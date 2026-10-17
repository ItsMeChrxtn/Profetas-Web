import { FarmVisit, FARM_VISIT_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { appEvents } from '../../utils/eventBus.js';

export async function listAdminFarmVisits(req, res) {
  const visits = await FarmVisit.find({}).sort({ visitDate: 1, visitTime: 1 });
  res.json({ success: true, visits });
}

export async function updateFarmVisitStatus(req, res) {
  const { status } = req.body;
  if (!FARM_VISIT_STATUS_VALUES.includes(status)) throw new HttpError(400, 'Please choose a valid status.');

  const existing = await FarmVisit.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Visit not found.');
  // One confirmed visit per day - that's what the customer calendar shows as occupied.
  if (status === 'Confirmed' && (await FarmVisit.exists({ _id: { $ne: existing._id }, visitDate: existing.visitDate, status: 'Confirmed' }))) {
    throw new HttpError(409, 'Another visit is already confirmed on this date.');
  }

  const visit = await FarmVisit.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (visit.customer) {
    appEvents.emit('farmvisit:updated', {
      customerId: visit.customer,
      _id: visit._id,
      status: visit.status,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
    });
  }

  res.json({ success: true, visit });
}
