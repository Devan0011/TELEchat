import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().jwt;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  createSession: (supabaseAccessToken) => api.post('/auth/session', { supabaseAccessToken }),
  logout: () => api.post('/auth/logout')
};

export const chatApi = {
  list: () => api.get('/chats'),
  createDirect: (participantId) => api.post('/chats/direct', { participantId }),
  createGroup: (payload) => api.post('/groups', payload),
  messages: (chatId, cursor) => api.get(`/messages/${chatId}`, { params: { cursor } }),
  send: (payload) => api.post('/messages', payload),
  edit: (id, content) => api.patch(`/messages/${id}`, { content }),
  remove: (id) => api.delete(`/messages/${id}`),
  react: (id, emoji) => api.post(`/messages/${id}/reactions`, { emoji }),
  pin: (id) => api.post(`/messages/${id}/pin`)
};

export const userApi = {
  me: () => api.get('/users/me'),
  update: (payload) => api.patch('/users/me', payload),
  remove: () => api.delete('/users/me'),
  search: (query) => api.get('/users/search', { params: { query } }),
  block: (blockedId) => api.post('/users/block', { blockedId }),
  mute: (mutedId) => api.post('/users/mute', { mutedId })
};

export const mediaApi = {
  createSignedUpload: (payload) => api.post('/media/upload-url', payload),
  register: (payload) => api.post('/media', payload)
};

export const adminApi = {
  overview: () => api.get('/admin/overview'),
  users: () => api.get('/admin/users'),
  moderate: (payload) => api.post('/admin/moderation', payload)
};
