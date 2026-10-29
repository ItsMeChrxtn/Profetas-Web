import { Product, PRODUCT_CATEGORY_VALUES, Order } from '../../models/index.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../../middleware/upload.js';
import { HttpError } from '../../utils/httpError.js';

// 0 = Out of Stock, 1 = Low Stock, 2 = In Stock - admins see what needs restocking first.
const RESTOCK_RANK = {
  $switch: {
    branches: [
      { case: { $lte: ['$stockQty', 0] }, then: 0 },
      { case: { $lte: ['$stockQty', '$lowStockThreshold'] }, then: 1 },
    ],
    default: 2,
  },
};

const PER_PAGE = 15;

export async function listAdminProducts(req, res) {
  const { q, category, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const filter = {};
  if (q && q.trim()) filter.name = { $regex: q.trim(), $options: 'i' };
  if (category && PRODUCT_CATEGORY_VALUES.includes(category)) filter.category = category;
  // Archived products live in the Product Archive, not in this list.
  filter.status = status && ['Active', 'Inactive'].includes(status) ? status : { $ne: 'Archived' };

  const [items, total] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $addFields: { stockRank: RESTOCK_RANK } },
      { $sort: { stockRank: 1, _id: -1 } },
      { $skip: (page - 1) * PER_PAGE },
      { $limit: PER_PAGE },
    ]),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    pagination: { page, perPage: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}

function validateProductFields(body) {
  const { name, category, price } = body;
  if (!name?.trim()) throw new HttpError(400, 'Product name is required.');
  if (!PRODUCT_CATEGORY_VALUES.includes(category)) throw new HttpError(400, 'Please choose a valid category.');
  const numericPrice = parseFloat(price);
  if (!(numericPrice > 0)) throw new HttpError(400, 'Price must be greater than 0.');
  return numericPrice;
}

/** Weight and wholesale fields shared by create and update. */
function extraProductFields(body) {
  const availableForWholesale = body.availableForWholesale === 'true' || body.availableForWholesale === true;
  const wholesalePrice = parseFloat(body.wholesalePrice);
  const wholesaleMinQty = parseInt(body.wholesaleMinQty, 10);
  if (availableForWholesale && !(wholesalePrice > 0)) {
    throw new HttpError(400, 'Please set a wholesale price for products shown to wholesalers.');
  }
  if (availableForWholesale && !(wholesaleMinQty >= 1)) {
    throw new HttpError(400, 'Please set a minimum wholesale order of at least 1.');
  }
  return {
    weightKg: Math.max(0, parseFloat(body.weightKg) || 0),
    availableForWholesale,
    wholesalePrice: availableForWholesale ? wholesalePrice : null,
    wholesaleMinQty: availableForWholesale ? wholesaleMinQty : 1,
  };
}

export async function createProduct(req, res, next) {
  try {
    const numericPrice = validateProductFields(req.body);
    const { name, category, description, unit, status, isHarvestedToday, stockQty, lowStockThreshold } = req.body;

    const product = await Product.create({
      name: name.trim(),
      category,
      description: description || '',
      price: numericPrice,
      unit: unit?.trim() || 'unit',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      isHarvestedToday: isHarvestedToday === 'true' || isHarvestedToday === true,
      stockQty: Math.max(0, parseInt(stockQty, 10) || 0),
      lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10) || 10),
      ...extraProductFields(req.body),
      image: req.file ? uploadedFilePublicPath('products', req.file) : null,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    if (req.file) await deleteUploadedFile(uploadedFilePublicPath('products', req.file));
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Product not found.');

    const numericPrice = validateProductFields(req.body);
    const { name, category, description, unit, status, isHarvestedToday, stockQty, lowStockThreshold } = req.body;

    existing.name = name.trim();
    existing.category = category;
    existing.description = description || '';
    existing.price = numericPrice;
    existing.unit = unit?.trim() || 'unit';
    if (existing.status === 'Archived') throw new HttpError(400, 'Restore this product from the archive before editing it.');
    existing.status = status === 'Inactive' ? 'Inactive' : 'Active';
    existing.isHarvestedToday = isHarvestedToday === 'true' || isHarvestedToday === true;
    existing.stockQty = Math.max(0, parseInt(stockQty, 10) || 0);
    existing.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 10);
    Object.assign(existing, extraProductFields(req.body));

    if (req.file) {
      const oldImage = existing.image;
      existing.image = uploadedFilePublicPath('products', req.file);
      if (oldImage) await deleteUploadedFile(oldImage);
    }

    await existing.save();
    res.json({ success: true, product: existing });
  } catch (err) {
    if (req.file) await deleteUploadedFile(uploadedFilePublicPath('products', req.file));
    next(err);
  }
}

/** "Delete" from the Products list archives: hidden from the shop and new orders, history kept. */
export async function archiveProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  if (product.status === 'Archived') throw new HttpError(400, 'This product is already archived.');

  product.status = 'Archived';
  product.archivedAt = new Date();
  product.isHarvestedToday = false;
  await product.save();
  res.json({ success: true, message: `"${product.name}" moved to the Product Archive.` });
}

/** Super admin: archived products, searchable by name, category, or archive date range. */
export async function listArchivedProducts(req, res) {
  const { q, category, from, to } = req.query;
  const filter = { status: 'Archived' };
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: 'i' };
  if (category && PRODUCT_CATEGORY_VALUES.includes(category)) filter.category = category;
  if (from || to) {
    filter.archivedAt = {};
    if (from) filter.archivedAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.archivedAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const items = await Product.find(filter).sort({ archivedAt: -1 }).lean();
  const withOrders = await Order.distinct('items.product', { 'items.product': { $in: items.map((p) => p._id) } });
  const hasOrders = new Set(withOrders.map(String));
  res.json({ success: true, items: items.map((p) => ({ ...p, hasOrders: hasOrders.has(String(p._id)) })) });
}

/**
 * Super admin: bring a product back. The same record is reused (no duplicate),
 * and the admin confirms price and stock first since they may be out of date.
 */
export async function restoreProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product || product.status !== 'Archived') throw new HttpError(404, 'Archived product not found.');

  const price = parseFloat(req.body.price);
  const stockQty = parseInt(req.body.stockQty, 10);
  if (!(price > 0)) throw new HttpError(400, 'Please confirm a price greater than 0.');
  if (!(stockQty >= 0)) throw new HttpError(400, 'Please confirm the stock quantity.');

  product.price = price;
  product.stockQty = stockQty;
  product.status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
  product.archivedAt = null;
  await product.save();
  res.json({ success: true, message: `"${product.name}" restored to Products.` });
}

/** Super admin: permanent delete, refused when past orders still point at the product. */
export async function deleteProductPermanently(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product || product.status !== 'Archived') throw new HttpError(404, 'Only archived products can be deleted permanently.');

  if (await Order.exists({ 'items.product': product._id })) {
    throw new HttpError(400, 'This product appears in past orders, so it stays archived to keep those order records intact.');
  }

  await Product.deleteOne({ _id: product._id });
  if (product.image) await deleteUploadedFile(product.image);
  res.json({ success: true, message: `"${product.name}" was permanently deleted.` });
}

/** Lightweight quick-adjust used by the admin Inventory screen. */
export async function adjustStock(req, res) {
  const { stockQty, lowStockThreshold } = req.body;
  const update = {};
  if (stockQty !== undefined) update.stockQty = Math.max(0, parseInt(stockQty, 10) || 0);
  if (lowStockThreshold !== undefined) update.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 0);

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ success: true, product });
}
