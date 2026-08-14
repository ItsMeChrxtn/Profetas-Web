import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { appEvents } from '../../utils/eventBus.js';

export const adminNotificationsRouter = Router();

adminNotificationsRouter.use(requireAdmin);

adminNotificationsRouter.get('/stream', (req, res) => {
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

  // order:updated carries no bell notification - admin pages (e.g. Delivery Booking)
  // listen for it so they re-render when a Lalamove webhook moves an order along.
  const forwardedEvents = ['order:created', 'order:updated', 'wholesale:created', 'farmvisit:created', 'product:lowstock'];
  const listeners = forwardedEvents.map((event) => {
    const listener = (data) => send(event, data);
    appEvents.on(event, listener);
    return { event, listener };
  });

  // Keeps intermediary proxies from timing out the idle connection.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    listeners.forEach(({ event, listener }) => appEvents.off(event, listener));
  });
});
