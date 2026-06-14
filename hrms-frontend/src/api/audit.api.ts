import api from './axiosInstance';

export const getAuditLogs = (params?: Record<string, string>) =>
  api.get('/audit/logs/', { params });
