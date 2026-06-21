import api from './axiosInstance';

export const getLeaveRequests = (params?: Record<string, string>) =>
  api.get('/leaves/requests/', { params });

export const createLeaveRequest = (data: FormData | Record<string, unknown>) =>
  api.post('/leaves/requests/', data);

export const approveByDept = (id: string, comment = '') =>
  api.post(`/leaves/requests/${id}/approve-dept/`, { comment });

export const approveByHR = (id: string, comment = '') =>
  api.post(`/leaves/requests/${id}/approve-hr/`, { comment });

export const rejectLeave = (id: string, comment: string) =>
  api.post(`/leaves/requests/${id}/reject/`, { comment });

export const getLeaveBalances = (params?: Record<string, string>) =>
  api.get('/leaves/balances/', { params });

export const getLeaveTypes = () =>
  api.get('/leaves/types/');
