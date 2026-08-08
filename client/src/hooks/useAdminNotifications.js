import { useEffect, useState } from 'react';
import { showToast } from '../utils/toast.js';
import { peso } from '../utils/peso.js';
import { orderNumberLabel, formatDate, formatTime } from '../utils/dateFormat.js';

const MAX_NOTIFICATIONS = 20;

// Mirrors the icons/labels already used for these sections in navItems.js.
const TYPE_META = {
  order: { icon: 'fa-shopping-bag', bg: 'var(--success-bg)', color: 'var(--success-text)' },
  wholesale: { icon: 'fa-truck-loading', bg: 'var(--info-bg)', color: 'var(--info-text)' },
  farmvisit: { icon: 'fa-tractor', bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
  lowstock: { icon: 'fa-exclamation-triangle', bg: 'var(--danger-bg)', color: 'var(--danger-text)', toast: 'warning' },
};

/** Keeps a live SSE connection to /api/admin/notifications/stream so the admin
 * bell updates the moment a customer places a retail order, submits a
 * wholesale inquiry, or requests a farm visit - no page reload needed. */
export function useAdminNotifications(enabled) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const source = new EventSource('/api/admin/notifications/stream', { withCredentials: true });

    const addNotification = (type, id, text, href) => {
      const meta = TYPE_META[type];
      const notification = { id, text, href, receivedAt: Date.now(), ...meta };
      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((prev) => prev + 1);
      showToast(meta.toast || 'info', text);
    };

    source.addEventListener('order:created', (event) => {
      const order = JSON.parse(event.data);
      addNotification(
        'order',
        `order-${order._id}`,
        `New order ${orderNumberLabel(order.orderNumber)} from ${order.customerName} - ${peso(order.totalAmount)}`,
        `/admin/delivery-booking?order_id=${order._id}`
      );
    });

    source.addEventListener('wholesale:created', (event) => {
      const inquiry = JSON.parse(event.data);
      addNotification(
        'wholesale',
        `wholesale-${inquiry._id}`,
        `New wholesale inquiry from ${inquiry.name} (${inquiry.location})`,
        '/admin/wholesale-inquiries'
      );
    });

    source.addEventListener('farmvisit:created', (event) => {
      const visit = JSON.parse(event.data);
      addNotification(
        'farmvisit',
        `farmvisit-${visit._id}`,
        `New farm visit request from ${visit.name} - ${formatDate(visit.visitDate)} ${formatTime(visit.visitTime)}`,
        '/admin/farm-visits'
      );
    });

    source.addEventListener('product:lowstock', (event) => {
      const product = JSON.parse(event.data);
      const label = product.status === 'Out of Stock' ? 'Out of stock' : 'Low stock';
      addNotification(
        'lowstock',
        `lowstock-${product._id}-${product.status}`,
        `${label}: ${product.name} (${product.stockQty} left)`,
        '/admin/inventory'
      );
    });

    return () => source.close();
  }, [enabled]);

  const markAllRead = () => setUnreadCount(0);

  return { notifications, unreadCount, markAllRead };
}
