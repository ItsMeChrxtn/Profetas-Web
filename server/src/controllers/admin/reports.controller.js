import { Order } from '../../models/index.js';

function parseDateRange(query) {
  const end = query.endDate ? new Date(`${query.endDate}T23:59:59.999Z`) : new Date();
  const start = query.startDate ? new Date(`${query.startDate}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getReports(req, res) {
  const { start, end } = parseDateRange(req.query);
  const dateMatch = { orderDate: { $gte: start, $lte: end } };
  const revenueMatch = { ...dateMatch, status: { $ne: 'Cancelled' } };

  const [summary, salesByCategory, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDoc' } },
      { $addFields: { category: { $ifNull: [{ $arrayElemAt: ['$productDoc.category', 0] }, 'Unknown'] } } },
      { $group: { _id: '$category', revenue: { $sum: '$items.subtotal' }, unitsSold: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const { totalOrders = 0, completedOrders = 0, revenue = 0 } = summary[0] || {};
  const averageOrderValue = completedOrders > 0 ? Math.round((revenue / completedOrders) * 100) / 100 : 0;

  res.json({
    success: true,
    range: { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) },
    summary: { totalOrders, completedOrders, revenue, averageOrderValue },
    salesByCategory,
    topProducts,
  });
}
