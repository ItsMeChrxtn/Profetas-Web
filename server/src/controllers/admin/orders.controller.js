import { Order, ORDER_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { appEvents } from '../../utils/eventBus.js';
import { getLalamoveQuotation, placeLalamoveOrder, cancelLalamoveOrder } from '../../utils/lalamoveClient.js';
import { env } from '../../config/env.js';
import { FARM_PICKUP } from '../../services/delivery.service.js';

const PER_PAGE = 15;

// 'All' lists orders by where they are in the workflow, newest first within each.
const STATUS_ORDER = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

// Self-pickup orders never ship, so they skip the Shipped status.
export function statusesFor(deliveryMethod) {
  return deliveryMethod === 'Self-Pickup' ? ORDER_STATUS_VALUES.filter((s) => s !== 'Shipped') : ORDER_STATUS_VALUES;
}

export async function listOrders(req, res) {
  const { q, status, deliveryMethod, needsBooking } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const pipeline = [
    { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
  ];

  const match = {};
  if (status && ORDER_STATUS_VALUES.includes(status)) match.status = status;
  if (['Lalamove', 'Self-Pickup'].includes(deliveryMethod)) match.deliveryMethod = deliveryMethod;
  // Delivery Booking queue: Lalamove orders that still need a rider.
  if (needsBooking === '1') {
    match.deliveryMethod = 'Lalamove';
    match.trackingNumber = null;
    match.status = { $nin: ['Completed', 'Cancelled'] };
  }

  const qTrimmed = q?.trim();
  if (qTrimmed) {
    const orClauses = [{ 'customer.firstName': { $regex: qTrimmed, $options: 'i' } }, { 'customer.lastName': { $regex: qTrimmed, $options: 'i' } }];
    if (/^\d+$/.test(qTrimmed)) orClauses.push({ orderNumber: parseInt(qTrimmed, 10) });
    match.$or = orClauses;
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push(
    { $addFields: { statusRank: { $indexOfArray: [STATUS_ORDER, '$status'] } } },
    { $sort: { statusRank: 1, orderDate: -1 } }
  );

  const countPipeline = [...pipeline, { $count: 'total' }];
  const pagePipeline = [
    ...pipeline,
    { $skip: (page - 1) * PER_PAGE },
    { $limit: PER_PAGE },
    {
      $project: {
        orderNumber: 1,
        orderDate: 1,
        totalAmount: 1,
        status: 1,
        'payment.status': 1,
        deliveryMethod: 1,
        trackingNumber: 1,
        pickupDate: 1,
        pickupTime: 1,
        customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
      },
    },
  ];

  const [items, countResult] = await Promise.all([Order.aggregate(pagePipeline), Order.aggregate(countPipeline)]);
  const total = countResult[0]?.total || 0;

  res.json({
    success: true,
    items,
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('customer', 'firstName lastName email contactNumber isWholesaler businessName');
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ success: true, order });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const existing = await Order.findById(req.params.id).select('deliveryMethod');
  if (!existing) throw new HttpError(404, 'Order not found.');
  if (!statusesFor(existing.deliveryMethod).includes(status)) throw new HttpError(400, 'Please choose a valid status.');

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

  appEvents.emit('order:updated', {
    customerId: order.customer,
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
  });

  res.json({ success: true, order });
}

export async function bookCourier(req, res) {
  const order = await Order.findById(req.params.id).populate('customer', 'firstName lastName contactNumber');
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.deliveryMethod !== 'Lalamove') {
    throw new HttpError(400, 'Courier booking only applies to Lalamove deliveries.');
  }
  if (order.trackingNumber) {
    throw new HttpError(400, 'This order has already been booked with a courier.');
  }
  if (order.deliveryLat == null || order.deliveryLng == null) {
    throw new HttpError(400, 'This order has no pinned delivery location to book a courier to.');
  }
  if (order.payment?.status !== 'Verified') {
    throw new HttpError(400, "Verify this order's GCash payment first before booking a rider.");
  }

  const quotation = await getLalamoveQuotation({
    serviceType: order.lalamoveServiceType || undefined,
    pickup: FARM_PICKUP,
    dropoff: { lat: order.deliveryLat, lng: order.deliveryLng, address: order.deliveryAddress || 'Delivery address' },
  });

  const [pickupStop, dropoffStop] = quotation.stops;
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

  const lalamoveOrder = await placeLalamoveOrder({
    quotationId: quotation.quotationId,
    pickupStopId: pickupStop.stopId,
    dropoffStopId: dropoffStop.stopId,
    sender: { name: env.lalamoveSenderName, phone: env.lalamoveSenderPhone },
    recipient: { name: customerName, phone: order.customer.contactNumber || env.lalamoveSenderPhone, remarks: `Order #${order.orderNumber}` },
  });

  order.trackingNumber = lalamoveOrder.orderId;
  order.lalamoveShareLink = lalamoveOrder.shareLink || null;
  order.lalamoveQuotedPrice = quotation.priceBreakdown?.total ? Number(quotation.priceBreakdown.total) : null;
  if (['Pending', 'Confirmed', 'Processing'].includes(order.status)) {
    order.status = 'Shipped';
  }
  await order.save();

  appEvents.emit('order:updated', {
    customerId: order.customer._id,
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
  });

  res.json({ success: true, order });
}

export async function cancelCourier(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  if (!order.trackingNumber) throw new HttpError(400, 'This order has no courier booking to cancel.');
  if (order.status === 'Completed') {
    throw new HttpError(400, 'This order has already been delivered and can no longer be cancelled.');
  }

  await cancelLalamoveOrder(order.trackingNumber);

  order.trackingNumber = null;
  order.lalamoveShareLink = null;
  order.lalamoveQuotedPrice = null;
  if (order.status === 'Shipped') order.status = 'Confirmed';
  await order.save();

  appEvents.emit('order:updated', {
    customerId: order.customer,
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
  });

  res.json({ success: true, order });
}
