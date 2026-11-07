import { User } from '../models/index.js';

/** A product has wholesale pricing when it's offered to wholesalers with a wholesale price set. */
export function hasWholesalePrice(product) {
  return Boolean(product.availableForWholesale) && product.wholesalePrice > 0;
}

/**
 * The shop and the wholesale page are separate: a line is wholesale only when
 * it was picked from the wholesale page. An approved wholesaler buying from the
 * shop pays the regular price with no minimum, like any other customer.
 */
export function unitPriceFor(product, wholesale) {
  return wholesale ? product.wholesalePrice : product.price;
}

export function minOrderQtyFor(product, wholesale) {
  return wholesale ? Math.max(1, product.wholesaleMinQty || 1) : 1;
}

/**
 * A product as a page may show it: the regular price, or the wholesale price
 * when `wholesale` is set (wholesale page, approved wholesalers only). The
 * wholesale fields are removed from the response, not just hidden in the page.
 */
export function forViewer(product, wholesale = false) {
  const plain = typeof product?.toJSON === 'function' ? product.toJSON() : { ...product };
  const shaped = {
    ...plain,
    price: unitPriceFor(plain, wholesale),
    isWholesalePrice: wholesale,
    minOrderQty: minOrderQtyFor(plain, wholesale),
  };
  delete shaped.wholesalePrice;
  delete shaped.wholesaleMinQty;
  return shaped;
}

/** Looked up fresh (not from the session token) so approval takes effect without re-login. */
export async function isWholesalerUser(userId) {
  if (!userId) return false;
  const user = await User.findById(userId).select('isWholesaler').lean();
  return Boolean(user?.isWholesaler);
}
