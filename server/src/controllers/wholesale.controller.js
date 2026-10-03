import { WholesaleInquiry } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { appEvents } from '../utils/eventBus.js';

export async function createInquiry(req, res) {
  const { name, contactNumber, location, requestedItems, estimatedBudget } = req.body;

  if (!name?.trim() || !contactNumber?.trim() || !location?.trim() || !requestedItems?.trim()) {
    throw new HttpError(400, 'Please fill in all required fields.');
  }

  const inquiry = await WholesaleInquiry.create({
    customer: req.user.id,
    name: name.trim(),
    contactNumber: contactNumber.trim(),
    location: location.trim(),
    requestedItems: requestedItems.trim(),
    estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
  });

  appEvents.emit('wholesale:created', {
    _id: inquiry._id,
    name: inquiry.name,
    location: inquiry.location,
    requestedItems: inquiry.requestedItems,
    estimatedBudget: inquiry.estimatedBudget,
  });

  res.status(201).json({ success: true, inquiry });
}
