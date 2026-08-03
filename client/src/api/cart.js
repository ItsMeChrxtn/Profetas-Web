import { api } from './client.js';

export const cartApi = {
  validate: (items) => api.post('/cart/validate', { items }),
  checkAdd: (productId, currentQuantity, quantity) => api.post('/cart/check-add', { productId, currentQuantity, quantity }),
};
