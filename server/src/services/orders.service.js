import mongoose from 'mongoose';
import { Order, DELIVERY_METHOD_VALUES } from '../models/index.js';
import { nextSequence } from '../models/Counter.js';
import { HttpError } from '../utils/httpError.js';
import { decrementStockOrThrow } from './stock.service.js';
import { appEvents } from '../utils/eventBus.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

function stockStatusFor(qty, threshold) {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= threshold) return 'Low Stock';
  return 'In Stock';
}

/**
 * Places an order inside a Mongo multi-document transaction: atomically
 * decrements stock per line (aborting/reverting everything if any line is
 * insufficient), then inserts the order with server-computed totals. The
 * client's cart is only ever treated as a set of {productId, quantity}
 * intents - prices/names/totals are always re-derived here from live
 * Product data, never trusted from the request. deliveryFee is server-derived
 * too (a live Lalamove quote, or 0 for pickup).
 */
export async function placeOrder({ customerId, items, deliveryMethod, deliveryFee, deliveryDetails, payment }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Your cart is empty.');
  }
  if (!DELIVERY_METHOD_VALUES.includes(deliveryMethod)) {
    throw new HttpError(400, 'Please choose a valid delivery method.');
  }

  const session = await mongoose.startSession();
  let order;
  const lowStockAlerts = [];

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

        // Only alert when this order just pushed the product into a worse
        // stock tier - not on every subsequent order against an already-low item.
        const statusBefore = stockStatusFor(product.stockQty + qty, product.lowStockThreshold);
        const statusAfter = stockStatusFor(product.stockQty, product.lowStockThreshold);
        if (statusAfter !== 'In Stock' && statusAfter !== statusBefore) {
          lowStockAlerts.push({
            _id: product._id,
            name: product.name,
            stockQty: product.stockQty,
            lowStockThreshold: product.lowStockThreshold,
            status: statusAfter,
          });
        }
      }

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

  for (const alert of lowStockAlerts) {
    appEvents.emit('product:lowstock', alert);
  }

  return order;
}
