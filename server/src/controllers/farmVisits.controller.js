import { FarmVisit } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { appEvents } from '../utils/eventBus.js';
import { normalizeContactNumber } from '../utils/validators.js';

const OPENING_TIME = '07:00';
const CLOSING_TIME = '17:00';
const MAX_VISITORS = 100;

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function createFarmVisit(req, res) {
  const { name, contactNumber, visitDate, visitTime, numberOfVisitors, notes } = req.body;

  if (!name?.trim() || !contactNumber?.trim() || !visitDate || !visitTime) {
    throw new HttpError(400, 'Please fill in all required fields.');
  }
  if (visitTime < OPENING_TIME || visitTime > CLOSING_TIME) {
    throw new HttpError(400, 'Farm visits are from 7:00 AM to 5:00 PM only.');
  }
  const visitors = parseInt(numberOfVisitors, 10);
  if (!(visitors >= 1 && visitors <= MAX_VISITORS)) {
    throw new HttpError(400, `Number of visitors must be from 1 to ${MAX_VISITORS}.`);
  }
  if (visitDate < todayDateString()) {
    throw new HttpError(400, 'Visit date cannot be in the past.');
  }
  if (await FarmVisit.exists({ visitDate, status: 'Confirmed' })) {
    throw new HttpError(409, 'That date is already booked. Please choose another day.');
  }

  const visit = await FarmVisit.create({
    customer: req.user.id,
    name: name.trim(),
    contactNumber: normalizeContactNumber(contactNumber),
    visitDate,
    visitTime,
    numberOfVisitors: visitors,
    notes: notes?.trim() || null,
  });

  appEvents.emit('farmvisit:created', {
    _id: visit._id,
    name: visit.name,
    visitDate: visit.visitDate,
    visitTime: visit.visitTime,
    numberOfVisitors: visit.numberOfVisitors,
  });

  res.status(201).json({ success: true, visit });
}

/** Dates (YYYY-MM-DD) that already have a confirmed visit, for the booking calendar. Names stay private. */
export async function getOccupiedDates(req, res) {
  const dates = await FarmVisit.distinct('visitDate', { status: 'Confirmed', visitDate: { $gte: todayDateString() } });
  res.json({ success: true, dates: dates.sort() });
}

export async function getMyFarmVisits(req, res) {
  const visits = await FarmVisit.find({ customer: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, visits });
}
