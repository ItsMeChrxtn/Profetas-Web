import { Product, PRODUCT_CATEGORY_VALUES } from '../models/index.js';

const PER_PAGE = 12;

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

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ name: 1 })
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

  res.json({ success: true, product, related });
}

export async function listHarvestedToday(req, res) {
  const items = await Product.find({ isHarvestedToday: true, status: 'Active' }).sort({ updatedAt: -1 });
  res.json({ success: true, items });
}

export async function listFeatured(req, res) {
  const items = await Product.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(8);
  res.json({ success: true, items });
}
