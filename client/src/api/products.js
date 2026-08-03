import { api } from './client.js';

export const productsApi = {
  list: (params = {}) => api.get(`/products?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/products/${id}`),
  harvestedToday: () => api.get('/products/harvested-today'),
  featured: () => api.get('/products/featured'),
};
