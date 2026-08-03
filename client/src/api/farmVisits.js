import { api } from './client.js';

export const farmVisitsApi = {
  submit: (payload) => api.post('/farm-visits', payload),
};
