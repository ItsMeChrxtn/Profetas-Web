import { api } from '../client.js';

export const adminSettingsApi = {
  get: () => api.get('/admin/settings'),
  update: (payload) => api.put('/admin/settings', payload),
  getProfile: () => api.get('/admin/settings/profile'),
  updateProfile: (payload) => api.put('/admin/settings/profile', payload),
  changePassword: (payload) => api.put('/admin/settings/profile/password', payload),
};
