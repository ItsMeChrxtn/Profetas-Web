import { Product, PRODUCT_CATEGORY_VALUES, Order } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { isWholesalerUser, forViewer } from '../services/pricing.service.js';

const PER_PAGE = 8;

// 0 = In Stock, 1 = Low Stock, 2 = Out of Stock - so available items list first.
export const STOCK_RANK = {
  $switch: {
    branches: [
      { case: { $lte: ['$stockQty', 0] }, then: 2 },
      { case: { $lte: ['$stockQty', '$lowStockThreshold'] }, then: 1 },
    ],
    default: 0,
  },
};

export async function listProducts(req, res) {
  const { category, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const filter = { status: 'Active' };
  if (category && PRODUCT_CATEGORY_VALUES.includes(category)) {
    filter.category = category;
  }
  if (q && q.trim()) {
    filter.name = { $regex: q.trim(), $options: 'i' };
  }

  // Grouped by category, and within each category In Stock -> Low Stock -> Out of Stock.
  const [items, total] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $addFields: { stockRank: STOCK_RANK } },
      { $sort: { category: 1, stockRank: 1, name: 1 } },
      { $skip: (page - 1) * PER_PAGE },
      { $limit: PER_PAGE },
    ]),
    Product.countDocuments(filter),
  ]);

  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({
    success: true,
    items: items.map((p) => forViewer(p, isWholesaler)),
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.id, status: 'Active' });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const related = await Product.find({
    category: product.category,
    status: 'Active',
    _id: { $ne: product._id },
  }).limit(4);

  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({ success: true, product: forViewer(product, isWholesaler), related: related.map((p) => forViewer(p, isWholesaler)) });
}

export async function listHarvestedToday(req, res) {
  const items = await Product.find({ isHarvestedToday: true, status: 'Active' }).sort({ updatedAt: -1 });
  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({ success: true, items: items.map((p) => forViewer(p, isWholesaler)) });
}

export async function listFeatured(req, res) {
  const items = await Product.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(8);
  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({ success: true, items: items.map((p) => forViewer(p, isWholesaler)) });
}

/** Active products ranked by a per-product score from non-cancelled orders since `since`. */
async function rankProducts({ since, score, limit = 4 }) {
  const match = { status: { $ne: 'Cancelled' } };
  if (since) match.orderDate = { $gte: since };

  const ranked = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', score: score } },
    { $sort: { score: -1 } },
    { $limit: 20 },
  ]);

  const products = await Product.find({ _id: { $in: ranked.map((r) => r._id) }, status: 'Active' });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return ranked
    .map((r) => byId.get(String(r._id)) && { ...byId.get(String(r._id)).toJSON(), score: r.score })
    .filter(Boolean)
    .slice(0, limit);
}

/** Best Sellers: most units sold, all time. */
export async function listBestSellers(req, res) {
  const items = await rankProducts({ score: { $sum: '$items.quantity' } });
  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({ success: true, items: items.map((p) => forViewer(p, isWholesaler)) });
}

/** Popular: ordered by the most customers (distinct orders) in the last 30 days. */
export async function listPopular(req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const items = await rankProducts({ since, score: { $sum: 1 } });
  const isWholesaler = await isWholesalerUser(req.user?.id);
  res.json({ success: true, items: items.map((p) => forViewer(p, isWholesaler)) });
}

/** Wholesale catalog - products marked for wholesalers; approved wholesalers only. */
export async function listWholesaleProducts(req, res) {
  if (!(await isWholesalerUser(req.user.id))) {
    throw new HttpError(403, 'The wholesale catalog is for approved wholesalers only.');
  }
  const items = await Product.aggregate([
    { $match: { status: 'Active', availableForWholesale: true } },
    { $addFields: { stockRank: STOCK_RANK } },
    { $sort: { category: 1, stockRank: 1, name: 1 } },
  ]);
  res.json({ success: true, items: items.map((p) => forViewer(p, true)) });
}
