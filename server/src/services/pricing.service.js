import { User } from '../models/index.js';

/**
 * Everyone pays the listed price. (A separate wholesale price was dropped -
 * wholesalers get access to the wholesale products instead.) Kept as the one
 * place to change if per-customer pricing comes back.
 */
export function unitPriceFor(product) {
  return product.price;
}

/** Looked up fresh (not from the session token) so approval takes effect without re-login. */
export async function isWholesalerUser(userId) {
  if (!userId) return false;
  const user = await User.findById(userId).select('isWholesaler').lean();
  return Boolean(user?.isWholesaler);
}
