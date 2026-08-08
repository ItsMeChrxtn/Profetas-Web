import { Order, DELIVERY_METHOD_VALUES } from '../models/index.js';
import { placeOrder } from '../services/orders.service.js';
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

    const order = await placeOrder({
      customerId: req.user.id,
      items,
      deliveryMethod: req.body.deliveryMethod,
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

export async function getMyOrders(req, res) {
  const orders = await Order.find({ customer: req.user.id }).sort({ orderDate: -1 });
  res.json({ success: true, orders });
}
