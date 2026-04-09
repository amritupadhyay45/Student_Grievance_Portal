import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const complaintService = {
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, formData) => api.put(`/complaints/${id}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assign: (id, data) => api.put(`/complaints/${id}/assign`, data),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
  rate: (id, data) => api.post(`/complaints/${id}/rate`, data),
  getAnalytics: () => api.get('/complaints/analytics'),
};

export const requestService = {
  create: (formData) => api.post('/requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  updateStatus: (id, formData) => api.put(`/requests/${id}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assign: (id, data) => api.put(`/requests/${id}/assign`, data),
  rate: (id, data) => api.post(`/requests/${id}/rate`, data),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getStaff: () => api.get('/admin/staff'),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const aiService = {
  analyze: (subject, description) => api.post('/ai/analyze', { subject, description }),
  chat: (message, history) => api.post('/ai/chat', { message, history }),
};
