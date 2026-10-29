import { User } from '../models/index.js';

/** A product has wholesale pricing when it's offered to wholesalers with a wholesale price set. */
export function hasWholesalePrice(product) {
  return Boolean(product.availableForWholesale) && product.wholesalePrice > 0;
}

/** Approved wholesalers pay the wholesale price where there is one; everyone else pays the regular price. */
export function unitPriceFor(product, isWholesaler) {
  return isWholesaler && hasWholesalePrice(product) ? product.wholesalePrice : product.price;
}

/** Wholesale-priced products have a minimum order for wholesalers; regular buys have none. */
export function minOrderQtyFor(product, isWholesaler) {
  return isWholesaler && hasWholesalePrice(product) ? Math.max(1, product.wholesaleMinQty || 1) : 1;
}

/**
 * A product as one viewer may see it: wholesalers get only the wholesale
 * price (where set), regular customers only the regular price. The other
 * price is removed from the response, not just hidden in the page.
 */
export function forViewer(product, isWholesaler) {
  const plain = typeof product?.toJSON === 'function' ? product.toJSON() : { ...product };
  const wholesale = isWholesaler && hasWholesalePrice(plain);
  const shaped = {
    ...plain,
    price: wholesale ? plain.wholesalePrice : plain.price,
    isWholesalePrice: wholesale,
    minOrderQty: wholesale ? Math.max(1, plain.wholesaleMinQty || 1) : 1,
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
