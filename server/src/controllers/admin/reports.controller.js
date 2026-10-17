import { Order, Product, User } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

function parseDateRange(query) {
  const end = query.endDate ? new Date(`${query.endDate}T23:59:59.999Z`) : new Date();
  const start = query.startDate ? new Date(`${query.startDate}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { start, end };
}

const round2 = (n) => Math.round((n || 0) * 100) / 100;
const NOT_CANCELLED = { status: { $ne: 'Cancelled' } };
const NOT_ARCHIVED = { status: { $ne: 'Archived' } };

/** Every day in the range as YYYY-MM-DD, so trend lines have no gaps. */
function fillDays(start, end, rows) {
  const byDay = new Map(rows.map((r) => [r._id, r.value]));
  const days = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    days.push({ name: key.slice(5), value: round2(byDay.get(key) || 0) });
  }
  return days;
}

const perDay = (field, value) => [
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, value } },
  { $sort: { _id: 1 } },
];

async function salesReport({ start, end }) {
  const match = { orderDate: { $gte: start, $lte: end }, ...NOT_CANCELLED };
  const [summary, byCategory, topProducts, trend] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' }, fees: { $sum: '$deliveryFee' } } }]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$p.category', 0] }, 'Unknown'] }, value: { $sum: '$items.subtotal' } } },
      { $sort: { value: -1 } },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([{ $match: match }, ...perDay('orderDate', { $sum: '$totalAmount' })]),
  ]);
  const { orders = 0, revenue = 0, fees = 0 } = summary[0] || {};
  return {
    stats: [
      { label: 'Total Revenue', value: round2(revenue), kind: 'money', note: `${orders} non-cancelled orders` },
      { label: 'Average Order Value', value: orders ? round2(revenue / orders) : 0, kind: 'money', note: 'Per order' },
      { label: 'Delivery Fees Collected', value: round2(fees), kind: 'money', note: 'Included in revenue' },
    ],
    line: { title: 'Revenue per Day', data: fillDays(start, end, trend), kind: 'money' },
    bar: { title: 'Sales by Category', data: byCategory.map((c) => ({ name: c._id, value: round2(c.value) })), kind: 'money' },
    pie: { title: 'Category Share', data: byCategory.map((c) => ({ name: c._id, value: round2(c.value) })) },
    table: {
      title: 'Top Performing Products',
      headers: ['Product', 'Units Sold', 'Revenue'],
      kinds: ['text', 'number', 'money'],
      rows: topProducts.map((p) => [p.name, p.units, round2(p.revenue)]),
    },
  };
}

async function ordersReport({ start, end }) {
  const match = { orderDate: { $gte: start, $lte: end } };
  const [byStatus, byMethod, trend, recent] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$deliveryMethod', value: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, ...perDay('orderDate', { $sum: 1 })]),
    Order.find(match).sort({ orderDate: -1 }).limit(50).populate('customer', 'firstName lastName').lean(),
  ]);
  const total = byStatus.reduce((sum, s) => sum + s.value, 0);
  const count = (status) => byStatus.find((s) => s._id === status)?.value || 0;
  return {
    stats: [
      { label: 'Total Orders', value: total, kind: 'number', note: 'All statuses in range' },
      { label: 'Completed', value: count('Completed'), kind: 'number', note: `${count('Cancelled')} cancelled` },
      { label: 'Still Open', value: total - count('Completed') - count('Cancelled'), kind: 'number', note: 'Pending to Shipped' },
    ],
    line: { title: 'Orders per Day', data: fillDays(start, end, trend), kind: 'number' },
    bar: { title: 'Orders by Status', data: byStatus.map((s) => ({ name: s._id, value: s.value })), kind: 'number' },
    pie: { title: 'Delivery Method', data: byMethod.map((m) => ({ name: m._id, value: m.value })) },
    table: {
      title: 'Orders in Range (latest 50)',
      headers: ['Order', 'Customer', 'Date', 'Method', 'Status', 'Total'],
      kinds: ['text', 'text', 'text', 'text', 'text', 'money'],
      rows: recent.map((o) => [
        `#${String(o.orderNumber).padStart(6, '0')}`,
        o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '—',
        o.orderDate.toISOString().slice(0, 10),
        o.deliveryMethod,
        o.status,
        o.totalAmount,
      ]),
    },
  };
}

async function customersReport({ start, end }) {
  const [totals, signups, topCustomers] = await Promise.all([
    User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          wholesalers: { $sum: { $cond: ['$isWholesaler', 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$accountStatus', 'Suspended'] }, 1, 0] } },
          newInRange: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate([{ $match: { role: 'customer', createdAt: { $gte: start, $lte: end } } }, ...perDay('createdAt', { $sum: 1 })]),
    Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end }, ...NOT_CANCELLED } },
      { $group: { _id: '$customer', orders: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
      { $sort: { spent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
    ]),
  ]);
  const { total = 0, wholesalers = 0, suspended = 0, newInRange = 0 } = totals[0] || {};
  return {
    stats: [
      { label: 'Total Customers', value: total, kind: 'number', note: `${suspended} suspended` },
      { label: 'New in Range', value: newInRange, kind: 'number', note: 'Sign-ups' },
      { label: 'Wholesalers', value: wholesalers, kind: 'number', note: 'Verified accounts' },
    ],
    line: { title: 'New Customers per Day', data: fillDays(start, end, signups), kind: 'number' },
    bar: {
      title: 'Top Customers by Spend',
      data: topCustomers.map((c) => ({ name: c.u ? `${c.u.firstName} ${c.u.lastName}` : 'Deleted account', value: round2(c.spent) })),
      kind: 'money',
    },
    pie: { title: 'Account Types', data: [{ name: 'Regular', value: total - wholesalers }, { name: 'Wholesaler', value: wholesalers }].filter((d) => d.value > 0) },
    table: {
      title: 'Top Customers in Range',
      headers: ['Customer', 'Account Type', 'Orders', 'Total Spent'],
      kinds: ['text', 'text', 'number', 'money'],
      rows: topCustomers.map((c) => [
        c.u ? `${c.u.firstName} ${c.u.lastName}` : 'Deleted account',
        c.u?.isWholesaler ? 'Wholesaler' : 'Regular',
        c.orders,
        round2(c.spent),
      ]),
    },
  };
}

async function inventoryReport() {
  const products = await Product.find(NOT_ARCHIVED).select('name category stockQty lowStockThreshold status').sort({ stockQty: 1 }).lean();
  const statusOf = (p) => (p.stockQty <= 0 ? 'Out of Stock' : p.stockQty <= p.lowStockThreshold ? 'Low Stock' : 'In Stock');
  const counts = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 };
  const byCategory = {};
  for (const p of products) {
    counts[statusOf(p)] += 1;
    byCategory[p.category] = (byCategory[p.category] || 0) + p.stockQty;
  }
  return {
    stats: [
      { label: 'Products Tracked', value: products.length, kind: 'number', note: 'Excludes archived' },
      { label: 'Low Stock', value: counts['Low Stock'], kind: 'number', note: 'At or below threshold' },
      { label: 'Out of Stock', value: counts['Out of Stock'], kind: 'number', note: 'Needs restocking' },
    ],
    bar: { title: 'Units in Stock by Category', data: Object.entries(byCategory).map(([name, value]) => ({ name, value })), kind: 'number' },
    pie: { title: 'Stock Status', data: Object.entries(counts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0) },
    table: {
      title: 'Inventory (lowest stock first)',
      headers: ['Product', 'Category', 'Stock Qty', 'Threshold', 'Stock Status'],
      kinds: ['text', 'text', 'number', 'number', 'text'],
      rows: products.map((p) => [p.name, p.category, p.stockQty, p.lowStockThreshold, statusOf(p)]),
    },
  };
}

async function productsReport({ start, end }) {
  const [products, sold] = await Promise.all([
    Product.find(NOT_ARCHIVED).select('name category price status').lean(),
    Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end }, ...NOT_CANCELLED } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
    ]),
  ]);
  const soldById = new Map(sold.map((s) => [String(s._id), s]));
  const rows = products
    .map((p) => {
      const s = soldById.get(String(p._id));
      return { ...p, units: s?.units || 0, revenue: round2(s?.revenue || 0) };
    })
    .sort((a, b) => b.units - a.units);
  const perCategory = {};
  for (const p of products) perCategory[p.category] = (perCategory[p.category] || 0) + 1;

  return {
    stats: [
      { label: 'Products', value: products.length, kind: 'number', note: `${products.filter((p) => p.status === 'Active').length} active` },
      { label: 'Sold in Range', value: rows.filter((r) => r.units > 0).length, kind: 'number', note: 'Products with at least 1 sale' },
      { label: 'No Sales in Range', value: rows.filter((r) => r.units === 0).length, kind: 'number', note: 'Consider promoting' },
    ],
    bar: { title: 'Units Sold per Product', data: rows.slice(0, 10).map((r) => ({ name: r.name, value: r.units })), kind: 'number' },
    pie: { title: 'Products per Category', data: Object.entries(perCategory).map(([name, value]) => ({ name, value })) },
    table: {
      title: 'Product Performance',
      headers: ['Product', 'Category', 'Price', 'Status', 'Units Sold', 'Revenue'],
      kinds: ['text', 'text', 'money', 'text', 'number', 'money'],
      rows: rows.map((r) => [r.name, r.category, r.price, r.status, r.units, r.revenue]),
    },
  };
}

const REPORTS = { sales: salesReport, orders: ordersReport, customers: customersReport, inventory: inventoryReport, products: productsReport };

/** GET /admin/reports?type=sales|orders|customers|inventory|products&startDate&endDate */
export async function getReports(req, res) {
  const type = req.query.type || 'sales';
  const build = REPORTS[type];
  if (!build) throw new HttpError(400, 'Unknown report type.');

  const range = parseDateRange(req.query);
  res.json({
    success: true,
    type,
    range: { startDate: range.start.toISOString().slice(0, 10), endDate: range.end.toISOString().slice(0, 10) },
    ...(await build(range)),
  });
}
