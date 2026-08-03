import { WholesaleInquiry, WHOLESALE_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

export async function listAdminInquiries(req, res) {
  const inquiries = await WholesaleInquiry.find({}).sort({ createdAt: -1 });
  const newCount = await WholesaleInquiry.countDocuments({ status: 'New' });
  res.json({ success: true, inquiries, newCount });
}

export async function updateInquiry(req, res) {
  const { status, adminResponse } = req.body;
  if (!WHOLESALE_STATUS_VALUES.includes(status)) throw new HttpError(400, 'Please choose a valid status.');

  const inquiry = await WholesaleInquiry.findByIdAndUpdate(
    req.params.id,
    { status, adminResponse: adminResponse?.trim() || null },
    { new: true }
  );
  if (!inquiry) throw new HttpError(404, 'Inquiry not found.');
  res.json({ success: true, inquiry });
}
