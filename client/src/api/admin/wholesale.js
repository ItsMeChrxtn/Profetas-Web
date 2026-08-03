import { api } from '../client.js';

export const adminWholesaleApi = {
  list: () => api.get('/admin/wholesale-inquiries'),
  update: (id, status, adminResponse) => api.patch(`/admin/wholesale-inquiries/${id}`, { status, adminResponse }),
};
