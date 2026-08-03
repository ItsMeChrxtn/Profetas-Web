import { Product } from '../models/index.js';

/**
 * Re-resolves a client-held cart {productId, quantity}[] against live product
 * data - same clamp-and-drop pattern as the original cart.php: quantity is
 * clamped to live stock, and a line is dropped entirely if the product is
 * gone/inactive or clamps to zero. Used for cart-page display only; order
 * placement re-derives everything itself and never trusts this response.
 */
export async function validateCart(req, res) {
  const requested = Array.isArray(req.body.items) ? req.body.items : [];
  const ids = requested.map((i) => i.productId).filter(Boolean);

  const products = await Product.find({ _id: { $in: ids }, status: 'Active' });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  let subtotal = 0;

  for (const { productId, quantity } of requested) {
    const product = byId.get(String(productId));
    if (!product) continue;

    const clampedQty = Math.min(Math.max(0, parseInt(quantity, 10) || 0), product.stockQty);
    if (clampedQty <= 0) continue;

    const lineSubtotal = Math.round(product.price * clampedQty * 100) / 100;
    subtotal += lineSubtotal;

    items.push({
      productId: product._id,
      name: product.name,
      image: product.image,
      unit: product.unit,
      price: product.price,
      quantity: clampedQty,
      requestedQuantity: parseInt(quantity, 10) || 0,
      stockQty: product.stockQty,
      subtotal: lineSubtotal,
    });
  }

  res.json({ success: true, items, subtotal: Math.round(subtotal * 100) / 100 });
}

/**
 * Mirrors the original cart-add.php: an all-or-nothing live-stock check run
 * at the moment "Add to Cart" is clicked, so a customer who already has some
 * of a product in their (client-held) cart gets immediate feedback if adding
 * more would exceed live stock - the qty stepper alone can't catch this
 * since it doesn't know what's already in the cart.
 */
export async function checkCartAdd(req, res) {
  const { productId, currentQuantity, quantity } = req.body;
  const addQty = parseInt(quantity, 10) || 0;
  const alreadyInCart = parseInt(currentQuantity, 10) || 0;

  const product = await Product.findOne({ _id: productId, status: 'Active' });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  if (addQty < 1 || alreadyInCart + addQty > product.stockQty) {
    return res.status(400).json({ success: false, message: 'Not enough stock available.' });
  }

  res.json({ success: true, stockQty: product.stockQty });
}
