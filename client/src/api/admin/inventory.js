import { api } from '../client.js';

export const adminInventoryApi = {
  list: (params = {}) => api.get(`/admin/inventory?${new URLSearchParams(params)}`),
};
