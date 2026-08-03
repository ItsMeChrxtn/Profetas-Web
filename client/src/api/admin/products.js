import { api } from '../client.js';

export const adminProductsApi = {
  list: (params = {}) => api.get(`/admin/products?${new URLSearchParams(params)}`),
  create: (formData) => api.post('/admin/products', formData),
  update: (id, formData) => api.put(`/admin/products/${id}`, formData),
  remove: (id) => api.del(`/admin/products/${id}`),
  adjustStock: (id, payload) => api.patch(`/admin/products/${id}/stock`, payload),
};
