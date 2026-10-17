import { User, Order } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { sendEmail } from '../../utils/brevoEmail.js';

// No login (or signup) within this window shows as Inactive.
const INACTIVE_AFTER_DAYS = 90;

/** Active / Inactive / Suspended, as shown in the Customers list. */
export function customerStatus(user) {
  if (user.accountStatus === 'Suspended') return 'Suspended';
  const lastSeen = user.lastLoginAt || user.createdAt;
  const cutoff = Date.now() - INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return lastSeen && new Date(lastSeen).getTime() >= cutoff ? 'Active' : 'Inactive';
}

const PER_PAGE = 15;

export async function listCustomers(req, res) {
  const { q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const match = { role: 'customer' };
  if (q?.trim()) {
    const term = q.trim();
    match.$or = [{ firstName: { $regex: term, $options: 'i' } }, { lastName: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
  }

  // Sorting by totalSpent has to happen across ALL matching customers before
  // paginating (not per-page), so this is one aggregation pipeline rather
  // than a User.find() + in-memory sort - otherwise page 1 wouldn't
  // reliably show the actual top spenders.
  const basePipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'orders',
        let: { customerId: '$_id' },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$customer', '$$customerId'] }, { $ne: ['$status', 'Cancelled'] }] } } }, { $project: { totalAmount: 1 } }],
        as: 'orderStats',
      },
    },
    {
      $lookup: {
        from: 'orders',
        let: { customerId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$customer', '$$customerId'] }, { $ne: ['$deliveryAddress', null] }] } } },
          { $sort: { orderDate: -1 } },
          { $limit: 1 },
          { $project: { deliveryAddress: 1 } },
        ],
        as: 'lastOrderWithAddress',
      },
    },
    {
      $addFields: {
        totalOrders: { $size: '$orderStats' },
        totalSpent: { $sum: '$orderStats.totalAmount' },
        lastAddress: { $arrayElemAt: ['$lastOrderWithAddress.deliveryAddress', 0] },
      },
    },
    { $sort: { totalSpent: -1 } },
  ];

  const [items, countResult] = await Promise.all([
    User.aggregate([
      ...basePipeline,
      { $skip: (page - 1) * PER_PAGE },
      { $limit: PER_PAGE },
      {
        $project: {
          id: '$_id',
          _id: 0,
          firstName: 1,
          lastName: 1,
          email: 1,
          contactNumber: 1,
          createdAt: 1,
          totalOrders: 1,
          totalSpent: 1,
          lastAddress: 1,
          isWholesaler: 1,
          businessName: 1,
          accountStatus: 1,
          lastLoginAt: 1,
        },
      },
    ]),
    User.aggregate([...basePipeline, { $count: 'total' }]),
  ]);

  const total = countResult[0]?.total || 0;
  res.json({
    success: true,
    items: items.map((c) => ({ ...c, status: customerStatus(c) })),
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}

/** Profile, order history, total spent, and account (violation) history. */
export async function getCustomer(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-passwordHash');
  if (!user) throw new HttpError(404, 'Customer not found.');

  const orders = await Order.find({ customer: user._id })
    .sort({ orderDate: -1 })
    .select('orderNumber orderDate totalAmount status deliveryMethod payment.status');
  const totalSpent = orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    success: true,
    customer: { ...user.toJSON(), status: customerStatus(user) },
    orders,
    totalSpent: Math.round(totalSpent * 100) / 100,
  });
}

/** Super admin: suspend or reinstate a customer, with a recorded reason. */
export async function updateCustomerAccount(req, res) {
  const { action, reason } = req.body;
  if (!['suspend', 'unsuspend', 'warn'].includes(action)) throw new HttpError(400, 'Invalid action.');
  if (!reason?.trim()) throw new HttpError(400, 'Please record a reason.');

  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw new HttpError(404, 'Customer not found.');

  if (action === 'suspend') {
    user.accountStatus = 'Suspended';
    user.suspensionReason = reason.trim();
  } else if (action === 'unsuspend') {
    user.accountStatus = 'Active';
    user.suspensionReason = null;
  }
  const historyAction = { suspend: 'Suspended', unsuspend: 'Unsuspended', warn: 'Warning' }[action];
  user.accountHistory.push({ action: historyAction, reason: reason.trim(), by: req.user.name });
  await user.save();

  res.json({ success: true, message: `Account ${historyAction.toLowerCase()}.` });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Super admin: email a customer about an order, a warning, or a suspension. */
export async function contactCustomer(req, res) {
  const { subject, message } = req.body;
  if (!subject?.trim() || !message?.trim()) throw new HttpError(400, 'Please enter a subject and a message.');

  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw new HttpError(404, 'Customer not found.');

  await sendEmail({
    to: user.email,
    subject: subject.trim(),
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color:#7B1E2B;">Profeta Integrated Farm</h2>
        <p>Hi ${escapeHtml(user.firstName)},</p>
        <p style="white-space: pre-line;">${escapeHtml(message.trim())}</p>
      </div>`,
  });

  user.accountHistory.push({ action: 'Emailed', reason: subject.trim(), by: req.user.name });
  await user.save();
  res.json({ success: true, message: `Email sent to ${user.email}.` });
}
