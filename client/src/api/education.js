import { api } from './client.js';

export const educationApi = {
  list: (params = {}) => api.get(`/education-posts?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/education-posts/${id}`),
};
