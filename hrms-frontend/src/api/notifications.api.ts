import api from './axiosInstance';

export const getNotifications = (params?: Record<string, string>) =>
  api.get('/notifications/', { params });

export const getUnreadCount = () =>
  api.get('/notifications/unread-count/');

export const markAsRead = (id: string) =>
  api.post(`/notifications/${id}/read/`);

export const markAllAsRead = () =>
  api.post('/notifications/mark-all-read/');

export const getPreferences = () =>
  api.get('/notifications/preferences/');

export const updatePreferences = (data: Record<string, boolean>) =>
  api.patch('/notifications/preferences/', data);

export const deleteNotification = (id: string) =>
  api.delete(`/notifications/${id}/`);
