import api from './axiosInstance';

export const getEmployees = (params?: Record<string, string>) =>
  api.get('/employees/', { params });

export const getEmployee = (id: string) =>
  api.get(`/employees/${id}/`);

export const createEmployee = (data: Record<string, unknown>) =>
  api.post('/employees/', data);

export const updateEmployee = (id: string, data: Record<string, unknown>) =>
  api.patch(`/employees/${id}/`, data);

export const getMyProfile = () =>
  api.get('/employees/me/');

export const getDepartments = () =>
  api.get('/employees/departments/');

export const createDepartment = (data: Record<string, unknown>) =>
  api.post('/employees/departments/', data);

export const getPositions = () =>
  api.get('/employees/positions/');

export const uploadSignature = (file: File) => {
  const form = new FormData();
  form.append('signature', file);
  return api.patch('/employees/me/signature/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteSignature = () =>
  api.delete('/employees/me/signature/');

export const toggleCanSign = (id: string) =>
  api.patch(`/employees/${id}/can-sign/`);
