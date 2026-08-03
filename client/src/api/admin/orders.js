import { api } from '../client.js';

export const adminOrdersApi = {
  list: (params = {}) => api.get(`/admin/orders?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  bookCourier: (id) => api.post(`/admin/orders/${id}/book-courier`),
};
