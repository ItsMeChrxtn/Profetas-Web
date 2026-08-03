import mongoose from 'mongoose';
import { Order, LoyaltyVoucher, LOYALTY_THRESHOLDS } from '../models/index.js';

export async function customerCumulativeSpend(customerId) {
  // Aggregation $match doesn't auto-cast query values like a normal find() does.
  const [result] = await Order.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId), status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  return result?.total || 0;
}

/** Idempotently issues any newly-qualified vouchers - safe to call on every loyalty page load. */
export async function syncLoyaltyVouchers(customerId) {
  const spend = await customerCumulativeSpend(customerId);

  await Promise.all(
    LOYALTY_THRESHOLDS.filter((threshold) => spend >= threshold).map((threshold) =>
      LoyaltyVoucher.findOneAndUpdate(
        { customer: customerId, thresholdAmount: threshold },
        { $setOnInsert: { code: `PF-${customerId}-${threshold}`, status: 'Available' } },
        { upsert: true }
      )
    )
  );

  return spend;
}
