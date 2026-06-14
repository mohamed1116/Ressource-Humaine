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

export const createDocumentRequest = (data: { template: string; extra_data?: Record<string, string>; message?: string; attachment?: File | null }) => {
  const fd = new FormData();
  fd.append('template', data.template);
  if (data.extra_data) fd.append('extra_data', JSON.stringify(data.extra_data));
  if (data.message) fd.append('message', data.message);
  if (data.attachment) fd.append('attachment', data.attachment);
  return api.post('/certificates/requests/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const createFreeRequest = (data: { subject: string; message: string; attachment?: File | null }) => {
  const fd = new FormData();
  fd.append('subject', data.subject);
  fd.append('message', data.message);
  if (data.attachment) fd.append('attachment', data.attachment);
  return api.post('/certificates/requests/free/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const submitSignedDocument = (id: string, file: File, isSignatureImage = false) => {
  const fd = new FormData();
  if (isSignatureImage) {
    fd.append('signature_image', file);
  } else {
    fd.append('signed_document', file);
  }
  return api.post(`/certificates/requests/${id}/sign/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getDocumentRequestDetail = (id: string) =>
  api.get(`/certificates/requests/${id}/`);

export const reviewDocumentRequest = (id: string, data: { action: 'approve' | 'reject'; rejection_reason?: string }) =>
  api.post(`/certificates/requests/${id}/review/`, data);

export const previewDocument = (id: string) =>
  api.get(`/certificates/requests/${id}/preview/`);

export const generateDocument = (id: string) =>
  api.post(`/certificates/requests/${id}/generate/`);

export const downloadSignedDocument = (id: string) =>
  api.get(`/certificates/requests/${id}/download-signed/`, { responseType: 'blob' });

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

// ── Signatures & Stamps ──
export const getSignatureStamps = () =>
  api.get('/certificates/signatures/');

export const uploadSignatureStamp = (data: FormData) =>
  api.post('/certificates/signatures/', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteSignatureStamp = (id: string) =>
  api.delete(`/certificates/signatures/${id}/`);

export const toggleSignatureStamp = (id: string, is_active: boolean) =>
  api.patch(`/certificates/signatures/${id}/`, { is_active });
