import { LoyaltyVoucher } from '../models/index.js';
import { syncLoyaltyVouchers } from '../services/loyalty.service.js';

export async function getMyLoyalty(req, res) {
  const spend = await syncLoyaltyVouchers(req.user.id);
  const vouchers = await LoyaltyVoucher.find({ customer: req.user.id }).sort({ thresholdAmount: 1 });
  res.json({ success: true, spend, vouchers });
}
