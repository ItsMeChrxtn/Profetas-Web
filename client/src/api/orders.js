import { api } from './client.js';

export const ordersApi = {
  place: (formData) => api.post('/orders', formData),
  mine: () => api.get('/orders/mine'),
  track: ({ orderNumber, email }) =>
    api.get(`/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`),
  deliveryQuote: ({ lat, lng, address, items }) => api.post('/orders/delivery-quote', { lat, lng, address, items }, { loader: false }),
};
