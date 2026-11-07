import { Product } from '../models/index.js';
import { unitPriceFor, minOrderQtyFor, hasWholesalePrice, isWholesalerUser } from '../services/pricing.service.js';

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

  const [products, isWholesaler] = await Promise.all([
    Product.find({ _id: { $in: ids }, status: 'Active' }),
    isWholesalerUser(req.user?.id),
  ]);
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  let subtotal = 0;

  for (const { productId, quantity, wholesale: wantsWholesale } of requested) {
    const product = byId.get(String(productId));
    if (!product) continue;
    // A wholesale line the account can no longer use is dropped, like a removed product.
    const wholesale = Boolean(wantsWholesale);
    if (wholesale && !(isWholesaler && hasWholesalePrice(product))) continue;

    const clampedQty = Math.min(Math.max(0, parseInt(quantity, 10) || 0), product.stockQty);
    if (clampedQty <= 0) continue;

    const price = unitPriceFor(product, wholesale);
    const lineSubtotal = Math.round(price * clampedQty * 100) / 100;
    subtotal += lineSubtotal;

    items.push({
      productId: product._id,
      name: product.name,
      image: product.image,
      unit: product.unit,
      price,
      isWholesalePrice: wholesale,
      // The cart page warns (and checkout refuses) below a wholesale minimum.
      minOrderQty: minOrderQtyFor(product, wholesale),
      weightKg: product.weightKg,
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
  const { productId, currentQuantity, quantity, wholesale: wantsWholesale } = req.body;
  const addQty = parseInt(quantity, 10) || 0;
  const alreadyInCart = parseInt(currentQuantity, 10) || 0;

  const product = await Product.findOne({ _id: productId, status: 'Active' });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  if (addQty < 1 || alreadyInCart + addQty > product.stockQty) {
    return res.status(400).json({ success: false, message: 'Not enough stock available.' });
  }

  const wholesale = Boolean(wantsWholesale);
  if (wholesale && !(hasWholesalePrice(product) && (await isWholesalerUser(req.user?.id)))) {
    return res.status(403).json({ success: false, message: 'Wholesale prices are for approved wholesalers only.' });
  }

  const minQty = minOrderQtyFor(product, wholesale);
  if (alreadyInCart + addQty < minQty) {
    return res.status(400).json({ success: false, message: `The minimum wholesale order for ${product.name} is ${minQty} ${product.unit}.` });
  }

  res.json({ success: true, stockQty: product.stockQty });
}
