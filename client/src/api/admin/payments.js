import { api } from '../client.js';

export const adminPaymentsApi = {
  list: (params = {}) => api.get(`/admin/payments?${new URLSearchParams(params)}`),
  review: (orderId, action, adminNote) => api.patch(`/admin/payments/${orderId}`, { action, adminNote }),
};
