import { api } from '../client.js';

export const adminPaymentsApi = {
  pending: () => api.get('/admin/payments/pending'),
  history: () => api.get('/admin/payments/history'),
  review: (orderId, action, adminNote) => api.patch(`/admin/payments/${orderId}`, { action, adminNote }),
};
