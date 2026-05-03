import api from './axiosInstance';

export const getPayslips = (params?: Record<string, string>) =>
  api.get('/payroll/payslips/', { params });

export const getMyPayslips = () =>
  api.get('/payroll/payslips/my-payslips/');

export const getPayslipDetail = (id: string) =>
  api.get(`/payroll/payslips/${id}/`);

export const generatePayslip = (data: { employee_id: string; year: number; month: number }) =>
  api.post('/payroll/payslips/generate/', data);

export const bulkGeneratePayslips = (data: { year: number; month: number; department_id?: string }) =>
  api.post('/payroll/payslips/bulk-generate/', data);

export const confirmPayslip = (id: string) =>
  api.post(`/payroll/payslips/${id}/confirm/`);

export const getSalaryStructures = () =>
  api.get('/payroll/structures/');

export const getSalaryComponents = () =>
  api.get('/payroll/components/');
