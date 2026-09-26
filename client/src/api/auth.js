import { api } from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  verifyRegistrationOtp: (payload) => api.post('/auth/register/verify-otp', payload, { loader: false }),
  resendRegistrationOtp: (payload) => api.post('/auth/register/resend-otp', payload, { loader: false }),
  login: (payload) => api.post('/auth/login', payload, { loader: false }),
  logout: () => api.post('/auth/logout', null, { loader: false }),
  me: () => api.get('/auth/me'),
};
