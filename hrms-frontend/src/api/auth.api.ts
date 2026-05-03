import api from './axiosInstance';
import type { LoginPayload, LoginResponse, User } from '../types/auth.types';

export const login = (data: LoginPayload) =>
  api.post<LoginResponse>('/auth/login/', data);

export const logout = (refresh: string) =>
  api.post('/auth/logout/', { refresh });

export const refreshToken = (refresh: string) =>
  api.post('/auth/token/refresh/', { refresh });

export const getProfile = () =>
  api.get<User>('/auth/profile/');

export const changePassword = (data: { old_password: string; new_password: string }) =>
  api.put('/auth/change-password/', data);

export const forgotPassword = (email: string) =>
  api.post('/auth/password-reset/', { email });

export const resetPassword = (data: { token: string; new_password: string }) =>
  api.post('/auth/password-reset/confirm/', data);
