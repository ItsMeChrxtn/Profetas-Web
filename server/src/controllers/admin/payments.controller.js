import { Order, PAYMENT_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

const PER_PAGE = 20;

/**
 * One list for every GCash payment (pending ones first, so they're reviewed
 * from here directly), filterable by payment status.
 */
export async function listPayments(req, res) {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const filter = PAYMENT_STATUS_VALUES.includes(status) ? { 'payment.status': status } : {};

  const [orders, total, pendingCount] = await Promise.all([
    Order.aggregate([
      { $match: filter },
      { $addFields: { pendingFirst: { $cond: [{ $eq: ['$payment.status', 'Pending'] }, 0, 1] } } },
      { $sort: { pendingFirst: 1, 'payment.createdAt': -1 } },
      { $skip: (page - 1) * PER_PAGE },
      { $limit: PER_PAGE },
      { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
      // Keep orders whose customer account was deleted.
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderNumber: 1,
          totalAmount: 1,
          deliveryFee: 1,
          deliveryFeePayment: 1,
          payment: 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
        },
      },
    ]),
    Order.countDocuments(filter),
    Order.countDocuments({ 'payment.status': 'Pending' }),
  ]);

  res.json({
    success: true,
    orders,
    pendingCount,
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}

/**
 * Because payment is embedded in Order, verify/reject is a single atomic
 * document update here - vs. the original PHP, which had to update the
 * separate `payments` and `orders` tables together in a DB transaction.
 */
export async function reviewPayment(req, res) {
  const { action, adminNote } = req.body;
  if (!['verify', 'reject'].includes(action)) throw new HttpError(400, 'Invalid action.');

  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');

  if (action === 'verify') {
    order.payment.status = 'Verified';
    order.payment.verifiedAt = new Date();
    if (order.status === 'Pending') order.status = 'Confirmed';
  } else {
    order.payment.status = 'Rejected';
  }
  order.payment.adminNote = adminNote?.trim() || null;

  await order.save();
  res.json({ success: true, order });
}
