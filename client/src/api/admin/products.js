import { api } from '../client.js';

export const adminProductsApi = {
  list: (params = {}) => api.get(`/admin/products?${new URLSearchParams(params)}`),
  create: (formData) => api.post('/admin/products', formData),
  update: (id, formData) => api.put(`/admin/products/${id}`, formData),
  archive: (id) => api.post(`/admin/products/${id}/archive`),
  adjustStock: (id, payload) => api.patch(`/admin/products/${id}/stock`, payload),
  archived: (params = {}) => api.get(`/admin/products/archive/list?${new URLSearchParams(params)}`),
  restore: (id, payload) => api.post(`/admin/products/${id}/restore`, payload),
  deletePermanently: (id) => api.del(`/admin/products/${id}/permanent`),
};
