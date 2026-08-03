import { api } from '../client.js';

export const adminFarmVisitsApi = {
  list: () => api.get('/admin/farm-visits'),
  updateStatus: (id, status) => api.patch(`/admin/farm-visits/${id}/status`, { status }),
};
