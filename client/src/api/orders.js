import { api } from './client.js';

export const ordersApi = {
  place: (formData) => api.post('/orders', formData),
  mine: () => api.get('/orders/mine'),
  deliveryQuote: ({ lat, lng, address }) => api.post('/orders/delivery-quote', { lat, lng, address }, { loader: false }),
};
