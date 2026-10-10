import { User } from '../../models/index.js';

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
        },
      },
    ]),
    User.aggregate([...basePipeline, { $count: 'total' }]),
  ]);

  const total = countResult[0]?.total || 0;
  res.json({
    success: true,
    items,
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}
