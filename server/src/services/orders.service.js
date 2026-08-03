import mongoose from 'mongoose';
import { Order } from '../models/index.js';
import { nextSequence } from '../models/Counter.js';
import { HttpError } from '../utils/httpError.js';
import { decrementStockOrThrow } from './stock.service.js';

// Hardcoded flat fee, matching the original checkout.php - not a real courier API quote.
const DELIVERY_FEES = { Lalamove: 150.0, 'Self-Pickup': 0.0 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Places an order inside a Mongo multi-document transaction: atomically
 * decrements stock per line (aborting/reverting everything if any line is
 * insufficient), then inserts the order with server-computed totals. The
 * client's cart is only ever treated as a set of {productId, quantity}
 * intents - prices/names/totals are always re-derived here from live
 * Product data, never trusted from the request.
 */
export async function placeOrder({ customerId, items, deliveryMethod, deliveryDetails, payment }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Your cart is empty.');
  }
  if (!DELIVERY_FEES.hasOwnProperty(deliveryMethod)) {
    throw new HttpError(400, 'Please choose a valid delivery method.');
  }

  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const lineItems = [];
      let subtotal = 0;

      for (const { productId, quantity } of items) {
        const qty = parseInt(quantity, 10);
        if (!productId || !Number.isInteger(qty) || qty < 1) {
          throw new HttpError(400, 'Invalid item in cart.');
        }

        const product = await decrementStockOrThrow(productId, qty, session);
        const lineSubtotal = round2(product.price * qty);
        subtotal = round2(subtotal + lineSubtotal);

        lineItems.push({
          product: product._id,
          productName: product.name,
          unitPrice: product.price,
          quantity: qty,
          subtotal: lineSubtotal,
        });
      }

      const deliveryFee = DELIVERY_FEES[deliveryMethod];
      const totalAmount = round2(subtotal + deliveryFee);
      const orderNumber = await nextSequence('orderNumber', session);

      const [created] = await Order.create(
        [
          {
            orderNumber,
            customer: customerId,
            items: lineItems,
            subtotal,
            deliveryFee,
            totalAmount,
            status: 'Pending',
            deliveryMethod,
            ...deliveryDetails,
            payment: {
              method: 'GCash',
              referenceNumber: payment.referenceNumber || null,
              receiptImage: payment.receiptImage || null,
              amount: totalAmount,
              status: 'Pending',
            },
          },
        ],
        { session }
      );
      order = created;
    });
  } finally {
    await session.endSession();
  }

  return order;
}
