import api from './api';

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const linkService = {
  getLinks: (params) => api.get('/links', { params }),
  getLinkById: (id) => api.get(`/links/${id}`),
  createLink: (data) => api.post('/links', data),
  updateLink: (id, data) => api.put(`/links/${id}`, data),
  deleteLink: (id) => api.delete(`/links/${id}`),
  toggleFavorite: (id) => api.patch(`/links/${id}/favorite`),
  duplicateLink: (id) => api.post(`/links/${id}/duplicate`),
  getQRCode: (id) => api.get(`/links/${id}/qr`),
  getQRCodePng: (id) => api.get(`/links/${id}/qr?format=png`, { responseType: 'blob' }),
  getQRCodeSvg: (id) => api.get(`/links/${id}/qr?format=svg`, { responseType: 'blob' }),
  checkAlias: (alias) => api.get('/links/check-alias', { params: { alias } }),
  exportLinks: () => api.get('/links/export', { responseType: 'blob' }),
};

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getTopLinks: (limit = 10) => api.get('/dashboard/top-links', { params: { limit } }),
  getRecentActivity: (limit = 20) => api.get('/dashboard/recent-activity', { params: { limit } }),
  getFavorites: () => api.get('/dashboard/favorites'),
  getHealth: () => api.get('/dashboard/health'),
};

export const analyticsService = {
  getLinkAnalytics: (id, days = 30) => api.get(`/analytics/${id}`, { params: { days } }),
  exportAnalytics: (id) => api.get(`/analytics/${id}/export`, { responseType: 'blob' }),
};
