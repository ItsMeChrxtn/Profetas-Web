import { Order, DELIVERY_METHOD_VALUES } from '../models/index.js';
import { placeOrder } from '../services/orders.service.js';
import { quoteLalamoveFee } from '../services/delivery.service.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../middleware/upload.js';
import { HttpError } from '../utils/httpError.js';
import { appEvents } from '../utils/eventBus.js';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function validateAndBuildDeliveryDetails(body) {
  const { deliveryMethod, deliveryAddress, deliveryLandmark, deliveryLat, deliveryLng, pickupDate, pickupTime } = body;

  if (!DELIVERY_METHOD_VALUES.includes(deliveryMethod)) {
    throw new HttpError(400, 'Please choose a valid delivery method.');
  }

  if (deliveryMethod === 'Self-Pickup') {
    if (!pickupDate || !pickupTime) {
      throw new HttpError(400, 'Please choose a pickup date and time.');
    }
    if (pickupDate < todayDateString()) {
      throw new HttpError(400, 'Pickup date cannot be in the past.');
    }
    return { pickupDate, pickupTime, deliveryAddress: null, deliveryLandmark: null, deliveryLat: null, deliveryLng: null };
  }

  if (!deliveryAddress || deliveryLat === undefined || deliveryLat === '' || deliveryLng === undefined || deliveryLng === '') {
    throw new HttpError(400, 'Please pin your delivery address on the map.');
  }
  return {
    deliveryAddress,
    deliveryLandmark: deliveryLandmark || null,
    deliveryLat: parseFloat(deliveryLat),
    deliveryLng: parseFloat(deliveryLng),
    pickupDate: null,
    pickupTime: null,
  };
}

export async function createOrder(req, res, next) {
  let receiptPublicPath = null;
  try {
    const { referenceNumber } = req.body;
    if (req.file) {
      receiptPublicPath = uploadedFilePublicPath('receipts', req.file);
    }
    if (!referenceNumber?.trim() && !receiptPublicPath) {
      throw new HttpError(400, 'Please provide a GCash reference number or upload your receipt.');
    }

    let items;
    try {
      items = JSON.parse(req.body.items || '[]');
    } catch {
      throw new HttpError(400, 'Invalid cart data.');
    }

    const deliveryDetails = validateAndBuildDeliveryDetails(req.body);

    // Re-quote server-side rather than trusting the fee the browser showed. The
    // customer already sent GCash for the total they saw, so refuse the order if
    // Lalamove's price moved in between instead of silently charging a new total.
    let deliveryFee = 0;
    if (req.body.deliveryMethod === 'Lalamove') {
      deliveryFee = await quoteLalamoveFee({
        lat: deliveryDetails.deliveryLat,
        lng: deliveryDetails.deliveryLng,
        address: deliveryDetails.deliveryAddress,
      });
      const expected = Number(req.body.expectedDeliveryFee);
      if (Number.isFinite(expected) && Math.abs(expected - deliveryFee) >= 0.01) {
        throw new HttpError(
          409,
          `The Lalamove delivery fee changed to ₱${deliveryFee.toFixed(2)}. Please review your new total before placing the order.`
        );
      }
    }

    const order = await placeOrder({
      customerId: req.user.id,
      items,
      deliveryMethod: req.body.deliveryMethod,
      deliveryFee,
      deliveryDetails,
      payment: { referenceNumber: referenceNumber?.trim() || null, receiptImage: receiptPublicPath },
    });

    appEvents.emit('order:created', {
      _id: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      customerName: req.user.name,
      orderDate: order.orderDate,
    });

    res.status(201).json({ success: true, message: 'Order placed! We will verify your payment shortly.', order });
  } catch (err) {
    if (receiptPublicPath) await deleteUploadedFile(receiptPublicPath);
    next(err);
  }
}

export async function getDeliveryQuote(req, res) {
  const fee = await quoteLalamoveFee({
    lat: parseFloat(req.body.lat),
    lng: parseFloat(req.body.lng),
    address: req.body.address,
  });
  res.json({ success: true, fee });
}

/**
 * Guest order lookup. Order numbers are sequential, so the email on the
 * account is required too - otherwise anyone could walk #1, #2, #3... and see
 * every order. Only status-level details are returned (no address or receipt).
 */
export async function trackOrderPublic(req, res) {
  const orderNumber = parseInt(String(req.query.orderNumber || '').replace(/\D/g, ''), 10);
  const email = req.query.email?.trim().toLowerCase();
  const notFound = 'No order matches that order number and email.';

  if (!orderNumber || !email) {
    throw new HttpError(400, 'Please enter your order number and the email you ordered with.');
  }

  const order = await Order.findOne({ orderNumber }).populate('customer', 'email');
  if (!order || order.customer?.email !== email) throw new HttpError(404, notFound);

  res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      items: order.items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
      totalAmount: order.totalAmount,
      paymentStatus: order.payment?.status,
      lalamoveShareLink: order.lalamoveShareLink,
    },
  });
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ customer: req.user.id }).sort({ orderDate: -1 });
  res.json({ success: true, orders });
}
