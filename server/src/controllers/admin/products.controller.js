import { Product, PRODUCT_CATEGORY_VALUES, Order } from '../../models/index.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../../middleware/upload.js';
import { HttpError } from '../../utils/httpError.js';

const PER_PAGE = 15;

export async function listAdminProducts(req, res) {
  const { q, category, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const filter = {};
  if (q && q.trim()) filter.name = { $regex: q.trim(), $options: 'i' };
  if (category && PRODUCT_CATEGORY_VALUES.includes(category)) filter.category = category;
  if (status && ['Active', 'Inactive'].includes(status)) filter.status = status;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ _id: -1 })
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

function validateProductFields(body) {
  const { name, category, price } = body;
  if (!name?.trim()) throw new HttpError(400, 'Product name is required.');
  if (!PRODUCT_CATEGORY_VALUES.includes(category)) throw new HttpError(400, 'Please choose a valid category.');
  const numericPrice = parseFloat(price);
  if (!(numericPrice > 0)) throw new HttpError(400, 'Price must be greater than 0.');
  return numericPrice;
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
    existing.status = status === 'Inactive' ? 'Inactive' : 'Active';
    existing.isHarvestedToday = isHarvestedToday === 'true' || isHarvestedToday === true;
    existing.stockQty = Math.max(0, parseInt(stockQty, 10) || 0);
    existing.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 10);

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

export async function deleteProduct(req, res) {
  const referenced = await Order.exists({ 'items.product': req.params.id });
  if (referenced) {
    throw new HttpError(400, 'Could not delete this product - it already has existing orders. Set its status to Inactive instead.');
  }

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  if (product.image) await deleteUploadedFile(product.image);

  res.json({ success: true });
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
