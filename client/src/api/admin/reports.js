import { api } from '../client.js';

export const adminReportsApi = {
  get: (params = {}) => api.get(`/admin/reports?${new URLSearchParams(params)}`),
};
