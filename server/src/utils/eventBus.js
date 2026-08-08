import { EventEmitter } from 'node:events';

// Shared in-process bus connecting write paths (order/farm-visit controllers)
// to the SSE streams (routes/admin/notifications.routes.js and
// routes/notifications.routes.js) so admins/customers see changes live.
export const appEvents = new EventEmitter();
appEvents.setMaxListeners(0);
