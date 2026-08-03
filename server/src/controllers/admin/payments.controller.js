import { Order } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

export async function listPendingPayments(req, res) {
  const orders = await Order.find({ 'payment.status': 'Pending' })
    .populate('customer', 'firstName lastName')
    .sort({ 'payment.createdAt': 1 });
  res.json({ success: true, orders });
}

export async function listPaymentHistory(req, res) {
  const orders = await Order.find({})
    .populate('customer', 'firstName lastName')
    .sort({ 'payment.createdAt': -1 })
    .limit(50);
  res.json({ success: true, orders });
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
