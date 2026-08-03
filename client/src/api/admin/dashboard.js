import { api } from '../client.js';

export const adminDashboardApi = {
  get: () => api.get('/admin/dashboard'),
};
