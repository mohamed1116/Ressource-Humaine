import api from './axiosInstance';

export const getAttendanceRecords = (params?: Record<string, string>) =>
  api.get('/attendance/records/', { params });

export const checkIn = (timestamp?: string) =>
  api.post('/attendance/check-in/', timestamp ? { timestamp } : {});

export const checkOut = (timestamp?: string) =>
  api.post('/attendance/check-out/', timestamp ? { timestamp } : {});

export const getTodayAttendance = () =>
  api.get('/attendance/today/');

export const getJustifications = () =>
  api.get('/attendance/justifications/');

export const createJustification = (data: FormData | Record<string, unknown>) =>
  api.post('/attendance/justifications/', data);

export const reviewJustification = (id: string, action: 'accept' | 'reject', comment = '') =>
  api.post(`/attendance/justifications/${id}/review/`, { action, comment });
