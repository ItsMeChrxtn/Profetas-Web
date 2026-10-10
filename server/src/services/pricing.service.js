import { User } from '../models/index.js';

/** Approved wholesalers pay the wholesale price on products the farm offers wholesale. */
export function unitPriceFor(product, isWholesaler) {
  if (isWholesaler && product.availableForWholesale && product.wholesalePrice > 0) {
    return product.wholesalePrice;
  }
  return product.price;
}

/** Looked up fresh (not from the session token) so approval takes effect without re-login. */
export async function isWholesalerUser(userId) {
  if (!userId) return false;
  const user = await User.findById(userId).select('isWholesaler').lean();
  return Boolean(user?.isWholesaler);
}
