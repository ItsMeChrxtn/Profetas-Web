import { api } from '../client.js';

export const adminWholesalerApi = {
  list: (params = {}) => api.get(`/admin/wholesaler-applications?${new URLSearchParams(params)}`),
  review: (id, action, reason) => api.patch(`/admin/wholesaler-applications/${id}`, { action, reason }),
};
