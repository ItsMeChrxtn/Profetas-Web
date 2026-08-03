import { Order, ORDER_STATUS_VALUES } from '../../models/index.js';
import { generateTrackingNumber } from '../../services/tracking.service.js';
import { HttpError } from '../../utils/httpError.js';

const PER_PAGE = 15;

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
  res.json({ success: true, order });
}

export async function bookCourier(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.deliveryMethod !== 'Lalamove') {
    throw new HttpError(400, 'Courier booking only applies to Lalamove deliveries.');
  }
  if (order.trackingNumber) {
    throw new HttpError(400, 'This order has already been booked with a courier.');
  }

  order.trackingNumber = generateTrackingNumber();
  if (['Pending', 'Confirmed'].includes(order.status)) {
    order.status = 'Processing';
  }
  await order.save();

  res.json({ success: true, order });
}
