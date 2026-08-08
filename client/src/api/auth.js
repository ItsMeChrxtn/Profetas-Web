import { api } from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  verifyRegistrationOtp: (payload) => api.post('/auth/register/verify-otp', payload),
  resendRegistrationOtp: (payload) => api.post('/auth/register/resend-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
