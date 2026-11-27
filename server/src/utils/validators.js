import { HttpError } from './httpError.js';

/** Contact numbers are digits only: an 11-digit PH mobile number like 09171234567. */
export function normalizeContactNumber(value, { required = true } = {}) {
  const text = String(value ?? '').trim();
  if (!text) {
    if (required) throw new HttpError(400, 'Please enter a contact number.');
    return undefined;
  }
  if (!/^09\d{9}$/.test(text)) {
    throw new HttpError(400, 'Contact number must be 11 digits, numbers only (e.g. 09171234567).');
  }
  return text;
}

/** GCash reference numbers are digits only. */
export function normalizeGcashReference(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!/^\d{8,20}$/.test(text)) {
    throw new HttpError(400, 'GCash reference number must be numbers only (usually 13 digits).');
  }
  return text;
}
