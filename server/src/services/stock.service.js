import { Product } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Atomically checks-and-decrements stock for one order line inside a
 * transaction session. The $gte filter makes the check-then-decrement a
 * single atomic operation (Mongo's equivalent of MySQL's
 * SELECT ... FOR UPDATE): two concurrent checkouts can't both succeed
 * against the same last unit of stock. Throwing here lets
 * session.withTransaction's caller abort (and thus auto-revert) any
 * decrements already applied to earlier lines in the same order.
 */
export async function decrementStockOrThrow(productId, quantity, session) {
  const updated = await Product.findOneAndUpdate(
    { _id: productId, status: 'Active', stockQty: { $gte: quantity } },
    { $inc: { stockQty: -quantity } },
    { session, new: true }
  );

  if (updated) return updated;

  const existing = await Product.findById(productId).session(session);
  if (!existing || existing.status !== 'Active') {
    throw new HttpError(409, 'One of the items in your order is no longer available.');
  }
  throw new HttpError(409, `Sorry, "${existing.name}" no longer has enough stock (only ${existing.stockQty} left).`);
}
