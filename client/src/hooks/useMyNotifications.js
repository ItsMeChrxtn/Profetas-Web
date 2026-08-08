import { useEffect, useState } from 'react';
import { showToast } from '../utils/toast.js';
import { orderNumberLabel } from '../utils/dateFormat.js';

const MAX_NOTIFICATIONS = 20;

/** Keeps a live SSE connection to /api/notifications/stream so a logged-in
 * customer sees their own order/farm-visit status changes with no reload. */
export function useMyNotifications(enabled) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const source = new EventSource('/api/notifications/stream', { withCredentials: true });

    const addNotification = (message) => {
      setNotifications((prev) => [message, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((prev) => prev + 1);
      showToast('info', message.text);
    };

    source.addEventListener('order:updated', (event) => {
      const order = JSON.parse(event.data);
      addNotification({
        id: `order-${order._id}-${order.status}`,
        text: `Order ${orderNumberLabel(order.orderNumber)} is now ${order.status}.`,
      });
    });

    source.addEventListener('farmvisit:updated', (event) => {
      const visit = JSON.parse(event.data);
      addNotification({
        id: `visit-${visit._id}-${visit.status}`,
        text: `Your farm visit request (${visit.visitDate}) is now ${visit.status}.`,
      });
    });

    return () => source.close();
  }, [enabled]);

  const markAllRead = () => setUnreadCount(0);

  return { notifications, unreadCount, markAllRead };
}
