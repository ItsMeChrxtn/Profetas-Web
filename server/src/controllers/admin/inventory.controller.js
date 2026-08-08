import { Product } from '../../models/index.js';

const PER_PAGE = 15;

export async function listInventory(req, res) {
  const { q, stockStatus } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const filter = {};
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: 'i' };
  if (stockStatus === 'out') {
    filter.stockQty = { $lte: 0 };
  } else if (stockStatus === 'low') {
    filter.$expr = { $and: [{ $gt: ['$stockQty', 0] }, { $lte: ['$stockQty', '$lowStockThreshold'] }] };
  } else if (stockStatus === 'in') {
    filter.$expr = { $gt: ['$stockQty', '$lowStockThreshold'] };
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('name category image stockQty lowStockThreshold status updatedAt')
      .sort({ stockQty: 1 })
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}
