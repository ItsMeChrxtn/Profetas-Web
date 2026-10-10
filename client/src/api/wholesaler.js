import { api } from './client.js';

export const wholesalerApi = {
  mine: () => api.get('/wholesaler-applications/mine'),
  apply: (formData) => api.post('/wholesaler-applications', formData),
};
