import { api } from '../client.js';

export const adminCustomersApi = {
  list: (params = {}) => api.get(`/admin/customers?${new URLSearchParams(params)}`),
};
