import { Order, ORDER_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { appEvents } from '../../utils/eventBus.js';
import { getLalamoveQuotation, placeLalamoveOrder } from '../../utils/lalamoveClient.js';
import { env } from '../../config/env.js';

const PER_PAGE = 15;

// Must match client/src/components/site/DeliveryMap.jsx's FARM_CENTER - the
// farm is the pickup point for every Lalamove booking.
const FARM_PICKUP = { lat: 14.3585, lng: 120.8155, address: 'Profetas Integrated Farm, Tres Cruces, Tanza, Cavite' };

export async function listOrders(req, res) {
  const { q, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const pipeline = [
    { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
  ];

  const match = {};
  if (status && ORDER_STATUS_VALUES.includes(status)) match.status = status;

  const qTrimmed = q?.trim();
  if (qTrimmed) {
    const orClauses = [{ 'customer.firstName': { $regex: qTrimmed, $options: 'i' } }, { 'customer.lastName': { $regex: qTrimmed, $options: 'i' } }];
    if (/^\d+$/.test(qTrimmed)) orClauses.push({ orderNumber: parseInt(qTrimmed, 10) });
    match.$or = orClauses;
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({ $sort: { orderDate: -1 } });

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
  const order = await Order.findById(req.params.id).populate('customer', 'firstName lastName email contactNumber');
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ success: true, order });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!ORDER_STATUS_VALUES.includes(status)) throw new HttpError(400, 'Please choose a valid status.');

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) throw new HttpError(404, 'Order not found.');

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

  const quotation = await getLalamoveQuotation({
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
  if (['Pending', 'Confirmed'].includes(order.status)) {
    order.status = 'Processing';
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
