/**
 * Document & Certificate API module
 * ----------------------------------
 * Handles all HTTP requests for the dynamic template system:
 * templates, document requests, PDF generation, missions, and stats.
 */
import api from './axiosInstance';

// ── Templates ──
export const getTemplates = (params?: Record<string, string>) =>
  api.get('/certificates/templates/', { params });

export const getTemplate = (id: string) =>
  api.get(`/certificates/templates/${id}/`);

export const createTemplate = (data: Record<string, unknown>) =>
  api.post('/certificates/templates/', data);

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  api.patch(`/certificates/templates/${id}/`, data);

export const deleteTemplate = (id: string) =>
  api.delete(`/certificates/templates/${id}/`);

export const previewTemplate = (id: string, sampleData?: Record<string, string>) =>
  api.post(`/certificates/templates/${id}/preview/`, { sample_data: sampleData });

// ── Document Requests ──
export const getDocumentRequests = (params?: Record<string, string>) =>
  api.get('/certificates/requests/', { params });

export const createDocumentRequest = (data: { template: string; extra_data?: Record<string, string>; message?: string }) =>
  api.post('/certificates/requests/create/', data);

export const getDocumentRequestDetail = (id: string) =>
  api.get(`/certificates/requests/${id}/`);

export const reviewDocumentRequest = (id: string, data: { action: 'approve' | 'reject'; rejection_reason?: string }) =>
  api.post(`/certificates/requests/${id}/review/`, data);

export const previewDocument = (id: string) =>
  api.get(`/certificates/requests/${id}/preview/`);

export const generateDocument = (id: string) =>
  api.post(`/certificates/requests/${id}/generate/`);

export const downloadDocument = (id: string) =>
  api.get(`/certificates/requests/${id}/download/`, { responseType: 'blob' });

// ── Missions ──
export const getMissions = (params?: Record<string, string>) =>
  api.get('/certificates/missions/', { params });

export const createMission = (data: Record<string, unknown>) =>
  api.post('/certificates/missions/', data);

export const approveMission = (id: string) =>
  api.post(`/certificates/missions/${id}/approve/`);

// ── Stats ──
export const getDocumentStats = () =>
  api.get('/certificates/stats/');
