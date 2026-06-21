import api from './axiosInstance';

export const getMissions = (params?: Record<string, string>) =>
  api.get('/certificates/missions/', { params });

export const createMission = (data: Record<string, unknown>) =>
  api.post('/certificates/missions/', data);

export const updateMission = (id: string, data: Record<string, unknown>) =>
  api.patch(`/certificates/missions/${id}/`, data);

export const approveMission = (id: string) =>
  api.post(`/certificates/missions/${id}/approve/`);
