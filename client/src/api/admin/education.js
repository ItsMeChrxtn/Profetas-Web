import { api } from '../client.js';

export const adminEducationApi = {
  list: () => api.get('/admin/education-posts'),
  create: (formData) => api.post('/admin/education-posts', formData),
  update: (id, formData) => api.put(`/admin/education-posts/${id}`, formData),
  remove: (id) => api.del(`/admin/education-posts/${id}`),
};
