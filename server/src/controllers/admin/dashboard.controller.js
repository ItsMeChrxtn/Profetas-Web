import { Order, Product, User } from '../../models/index.js';

export async function getDashboardStats(req, res) {
  const [totalOrders, revenueResult, totalProducts, totalCustomers, lowStockCount, recentOrders, topProducts] = await Promise.all([
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
  ]);

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
  });
}
