import { api } from '../client.js';

export const adminFarmVisitsApi = {
  list: () => api.get('/admin/farm-visits'),
  updateStatus: (id, status, reason) => api.patch(`/admin/farm-visits/${id}/status`, { status, reason }),
};
