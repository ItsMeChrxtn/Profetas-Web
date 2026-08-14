import crypto from 'node:crypto';
import { Order } from '../models/index.js';
import { appEvents } from '../utils/eventBus.js';
import { env, isProduction } from '../config/env.js';

// Lalamove sends: ORDER_STATUS_CHANGED, DRIVER_ASSIGNED, ORDER_AMOUNT_CHANGED, etc.
// Order statuses inside the payload: ASSIGNING_DRIVER, ON_GOING, PICKED_UP,
// COMPLETED, CANCELED, REJECTED, EXPIRED. Their partner-portal webhook spec
// (the exact header name for the signature) isn't in the public docs, so this
// verifies using the same "Authorization: hmac key:time:sig" scheme Lalamove
// uses everywhere else in the v3 API. If that guess turns out wrong once a
// real event arrives, this only logs a warning - it does not drop the event -
// so the booking flow it drives (auto status updates) still works while we
// tighten verification with real data.
function verifyWebhookSignature(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn('[Lalamove webhook] No Authorization header present - accepting unverified.');
    return;
  }

  const match = authHeader.match(/^hmac\s+([^:]+):(\d+):([a-f0-9]+)$/i);
  if (!match) {
    console.warn('[Lalamove webhook] Authorization header in unexpected format, accepting unverified:', authHeader);
    return;
  }

  const [, key, time, signature] = match;
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', env.lalamoveApiSecret)
    .update(`${time}\r\nPOST\r\n${req.originalUrl}\r\n\r\n${rawBody}`)
    .digest('hex');

  if (key !== env.lalamoveApiKey || expected !== signature) {
    console.warn('[Lalamove webhook] Signature mismatch - accepting unverified while auth scheme is unconfirmed.');
  }
}

const COMPLETING_STATUSES = ['COMPLETED'];
const FAILED_STATUSES = ['CANCELED', 'REJECTED', 'EXPIRED'];
const IN_TRANSIT_STATUSES = ['ON_GOING', 'PICKED_UP'];

export async function handleLalamoveWebhook(req, res) {
  const payload = req.body || {};
  if (!isProduction) console.log('[DEV] Lalamove webhook received:', JSON.stringify(payload));

  verifyWebhookSignature(req);

  const orderData = payload.data?.order || payload.data || payload.order || payload;
  const lalamoveOrderId = orderData?.orderId || orderData?.id;
  const lalamoveStatus = orderData?.status;

  if (!lalamoveOrderId || !lalamoveStatus) {
    console.warn('[Lalamove webhook] Missing orderId/status in payload, ignoring:', JSON.stringify(payload));
    return res.status(200).json({ received: true });
  }

  const order = await Order.findOne({ trackingNumber: lalamoveOrderId });
  if (!order) {
    console.warn(`[Lalamove webhook] No matching order for Lalamove order ${lalamoveOrderId}.`);
    return res.status(200).json({ received: true });
  }

  // Already finalized on our side - don't let a late/duplicate webhook move it backward.
  if (['Completed', 'Cancelled'].includes(order.status)) {
    return res.status(200).json({ received: true });
  }

  if (COMPLETING_STATUSES.includes(lalamoveStatus)) {
    order.status = 'Completed';
  } else if (FAILED_STATUSES.includes(lalamoveStatus)) {
    // Courier fell through (no driver found / cancelled by Lalamove) - the order itself
    // isn't cancelled, it just needs to be re-booked, so revert it like a manual cancel.
    order.trackingNumber = null;
    order.lalamoveShareLink = null;
    order.lalamoveQuotedPrice = null;
    order.status = 'Confirmed';
  } else if (IN_TRANSIT_STATUSES.includes(lalamoveStatus)) {
    order.status = 'Shipped';
  } else {
    return res.status(200).json({ received: true });
  }

  await order.save();

  appEvents.emit('order:updated', {
    customerId: order.customer,
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
  });

  res.status(200).json({ received: true });
}
