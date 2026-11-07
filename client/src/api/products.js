import { api } from './client.js';

export const productsApi = {
  list: (params = {}) => api.get(`/products?${new URLSearchParams(params)}`),
  get: (id, { wholesale = false } = {}) => api.get(`/products/${id}${wholesale ? '?wholesale=1' : ''}`),
  harvestedToday: () => api.get('/products/harvested-today'),
  featured: () => api.get('/products/featured'),
  bestSellers: () => api.get('/products/best-sellers'),
  popular: () => api.get('/products/popular'),
  wholesale: () => api.get('/products/wholesale'),
};
