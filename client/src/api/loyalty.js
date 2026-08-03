import { api } from './client.js';

export const loyaltyApi = {
  mine: () => api.get('/loyalty/mine'),
};
