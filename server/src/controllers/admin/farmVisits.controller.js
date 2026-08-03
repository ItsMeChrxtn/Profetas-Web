import { FarmVisit, FARM_VISIT_STATUS_VALUES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

export async function listAdminFarmVisits(req, res) {
  const visits = await FarmVisit.find({}).sort({ visitDate: 1, visitTime: 1 });
  res.json({ success: true, visits });
}

export async function updateFarmVisitStatus(req, res) {
  const { status } = req.body;
  if (!FARM_VISIT_STATUS_VALUES.includes(status)) throw new HttpError(400, 'Please choose a valid status.');

  const visit = await FarmVisit.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!visit) throw new HttpError(404, 'Visit not found.');
  res.json({ success: true, visit });
}
