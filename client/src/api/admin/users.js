import { api } from '../client.js';

export const adminUsersApi = {
  list: () => api.get('/admin/users'),
  create: (payload) => api.post('/admin/users', payload),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};
