import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { appEvents } from '../utils/eventBus.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// Pushes the logged-in customer's own order/farm-visit status changes live,
// so pages like Track Order update without a reload.
notificationsRouter.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('ready', { ok: true });

  const forwardIfMine = (event) => (payload) => {
    if (String(payload.customerId) === String(req.user.id)) send(event, payload);
  };

  const onOrderUpdated = forwardIfMine('order:updated');
  const onFarmVisitUpdated = forwardIfMine('farmvisit:updated');
  appEvents.on('order:updated', onOrderUpdated);
  appEvents.on('farmvisit:updated', onFarmVisitUpdated);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    appEvents.off('order:updated', onOrderUpdated);
    appEvents.off('farmvisit:updated', onFarmVisitUpdated);
  });
});
