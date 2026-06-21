import api from './axiosInstance';

// Get all users (Super Admin only)
export const getUsers = (params?: Record<string, string>) =>
  api.get('/auth/users/', { params });

// Create new user (Super Admin only)
export const createUser = (data: Record<string, unknown>) =>
  api.post('/auth/users/create/', data);

// Get user details
export const getUser = (id: string) =>
  api.get(`/auth/users/${id}/`);

// Update user
export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.patch(`/auth/users/${id}/`, data);

// Delete user
export const deleteUser = (id: string) =>
  api.delete(`/auth/users/${id}/`);

// Reset user password (Super Admin only)
export const resetUserPassword = (id: string, newPassword: string) =>
  api.post(`/auth/users/${id}/reset-password/`, { new_password: newPassword });
