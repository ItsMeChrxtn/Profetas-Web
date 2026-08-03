import { FarmVisit } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function createFarmVisit(req, res) {
  const { name, contactNumber, visitDate, visitTime, numberOfVisitors, notes } = req.body;

  if (!name?.trim() || !contactNumber?.trim() || !visitDate || !visitTime) {
    throw new HttpError(400, 'Please fill in all required fields.');
  }
  if (visitDate < todayDateString()) {
    throw new HttpError(400, 'Visit date cannot be in the past.');
  }

  const visit = await FarmVisit.create({
    customer: req.user?.id || null,
    name: name.trim(),
    contactNumber: contactNumber.trim(),
    visitDate,
    visitTime,
    numberOfVisitors: Math.max(1, parseInt(numberOfVisitors, 10) || 1),
    notes: notes?.trim() || null,
  });

  res.status(201).json({ success: true, visit });
}
