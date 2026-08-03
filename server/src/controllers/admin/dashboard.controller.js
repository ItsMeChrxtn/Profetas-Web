import { Order, Product, User } from '../../models/index.js';

export async function getDashboardStats(req, res) {
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [totalOrders, revenueResult, totalProducts, totalCustomers, lowStockCount, recentOrders, topProducts, salesTrendRaw, stockBreakdownRaw] =
    await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Product.countDocuments({}),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ $expr: { $lte: ['$stockQty', '$lowStockThreshold'] } }),
      Order.find({}).sort({ orderDate: -1 }).limit(5).populate('customer', 'firstName lastName'),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.productName' }, unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            inStock: { $sum: { $cond: [{ $gt: ['$stockQty', '$lowStockThreshold'] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stockQty', 0] }, { $lte: ['$stockQty', '$lowStockThreshold'] }] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $lte: ['$stockQty', 0] }, 1, 0] } },
          },
        },
      ]),
    ]);

  // Fill in zero-revenue days so the trend line has a continuous 30-day x-axis.
  const revenueByDate = new Map(salesTrendRaw.map((d) => [d._id, d.revenue]));
  const salesTrend = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    salesTrend.push({ date: key, revenue: revenueByDate.get(key) || 0 });
  }

  const { inStock = 0, lowStock = 0, outOfStock = 0 } = stockBreakdownRaw[0] || {};

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      totalProducts,
      totalCustomers,
      lowStockCount,
    },
    recentOrders,
    topProducts,
    salesTrend,
    stockBreakdown: { inStock, lowStock, outOfStock },
  });
}
