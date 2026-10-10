import { api } from '../client.js';

export const adminSettingsApi = {
  get: () => api.get('/admin/settings'),
  update: (payload) => api.put('/admin/settings', payload),
  getProfile: () => api.get('/admin/settings/profile'),
  updateProfile: (payload) => api.put('/admin/settings/profile', payload),
  changePassword: (payload) => api.put('/admin/settings/profile/password', payload),
};

export const adminLandingApi = {
  addImage: (formData) => api.post('/admin/settings/landing/images', formData),
  removeImage: (slot, image) => api.post('/admin/settings/landing/images/remove', { slot, image }),
  updateContent: (payload) => api.put('/admin/settings/landing', payload),
};
