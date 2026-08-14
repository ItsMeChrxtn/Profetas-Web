import crypto from 'node:crypto';
import { env, isProduction } from '../config/env.js';
import { HttpError } from './httpError.js';

const BASE_URLS = {
  sandbox: 'https://rest.sandbox.lalamove.com',
  production: 'https://rest.lalamove.com',
};

// Customers enter their contact number in whatever local PH format they like
// (0917-000-0000, 09170000000, etc.) but Lalamove requires strict E.164.
function toE164PH(phone) {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+63')) return digits;
  if (digits.startsWith('63')) return `+${digits}`;
  if (digits.startsWith('0')) return `+63${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length === 10) return `+63${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

// Signing scheme verified against Lalamove's own official example
// (github.com/lalamove/api-examples/nodejs/*-v3.js): HMAC-SHA256 of
// "<time>\r\n<method>\r\n<path>\r\n\r\n<body>" using the API secret, hex-encoded.
function sign(method, path, body) {
  const time = Date.now().toString();
  const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const signature = crypto.createHmac('sha256', env.lalamoveApiSecret).update(rawSignature).digest('hex');
  return { time, signature };
}

async function lalamoveRequest(method, path, payload) {
  if (!env.lalamoveApiKey || !env.lalamoveApiSecret) {
    throw new HttpError(500, 'Lalamove is not configured yet. Please contact support.');
  }

  const body = payload ? JSON.stringify(payload) : '';
  const { time, signature } = sign(method, path, body);

  const res = await fetch(`${BASE_URLS[env.lalamoveEnv]}${path}`, {
    method,
    headers: {
      'Content-type': 'application/json; charset=utf-8',
      Authorization: `hmac ${env.lalamoveApiKey}:${time}:${signature}`,
      Accept: 'application/json',
      Market: env.lalamoveMarket,
    },
    body: body || undefined,
  });

  // Cancel returns 204 with no body - only parse JSON when there's content to read.
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!isProduction) console.log(`[DEV] Lalamove ${method} ${path} -> ${res.status}`, JSON.stringify(data));

  if (!res.ok) {
    console.error('Lalamove API error:', res.status, data);
    const message = data?.errors?.[0]?.message || 'Lalamove request failed. Please try again.';
    throw new HttpError(502, message);
  }

  return data?.data ?? null;
}

/** pickup/dropoff: { lat, lng, address }. Returns the raw quotation data (stops carry the stopId needed to place the order). */
export async function getLalamoveQuotation({ pickup, dropoff }) {
  return lalamoveRequest('POST', '/v3/quotations', {
    data: {
      serviceType: env.lalamoveServiceType,
      specialRequests: [],
      language: 'en_PH',
      stops: [
        { coordinates: { lat: String(pickup.lat), lng: String(pickup.lng) }, address: pickup.address },
        { coordinates: { lat: String(dropoff.lat), lng: String(dropoff.lng) }, address: dropoff.address },
      ],
    },
  });
}

/** quotationId + stop IDs come from getLalamoveQuotation's response. */
export async function placeLalamoveOrder({ quotationId, pickupStopId, dropoffStopId, sender, recipient }) {
  return lalamoveRequest('POST', '/v3/orders', {
    data: {
      quotationId,
      sender: { stopId: pickupStopId, name: sender.name, phone: toE164PH(sender.phone) },
      recipients: [
        { stopId: dropoffStopId, name: recipient.name, phone: toE164PH(recipient.phone), remarks: recipient.remarks || '' },
      ],
    },
  });
}

export async function getLalamoveOrder(lalamoveOrderId) {
  return lalamoveRequest('GET', `/v3/orders/${lalamoveOrderId}`);
}

/** Lalamove only allows cancellation while a driver is still being assigned, or within ~5 min of being matched. */
export async function cancelLalamoveOrder(lalamoveOrderId) {
  return lalamoveRequest('DELETE', `/v3/orders/${lalamoveOrderId}`);
}

/** One-time setup: tells Lalamove where to POST order status change events (ORDER_STATUS_CHANGED, etc). */
export async function registerLalamoveWebhook(url) {
  return lalamoveRequest('PATCH', '/v3/webhook', { data: { url } });
}
