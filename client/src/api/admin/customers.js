import { api } from '../client.js';

export const adminCustomersApi = {
  list: (params = {}) => api.get(`/admin/customers?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/admin/customers/${id}`),
  updateAccount: (id, action, reason) => api.patch(`/admin/customers/${id}/account`, { action, reason }),
  contact: (id, subject, message) => api.post(`/admin/customers/${id}/contact`, { subject, message }),
};
