import { api } from './client.js';

export const wholesaleApi = {
  submit: (payload) => api.post('/wholesale-inquiries', payload),
};
