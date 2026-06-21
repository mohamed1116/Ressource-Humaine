import api from './axiosInstance';

export const getEvaluations = (params?: Record<string, string>) =>
  api.get('/evaluations/', { params });

export const getEvaluation = (id: string) =>
  api.get(`/evaluations/${id}/`);

export const createEvaluation = (data: Record<string, unknown>) =>
  api.post('/evaluations/', data);

export const selfEvaluate = (id: string, data: { scores: Array<{ criterion_id: string; score: number; comment?: string }>; comment?: string }) =>
  api.post(`/evaluations/${id}/self-evaluate/`, data);

export const supervisorEvaluate = (id: string, data: { scores: Array<{ criterion_id: string; score: number; comment?: string }>; comment?: string }) =>
  api.post(`/evaluations/${id}/supervisor-evaluate/`, data);

export const completeEvaluation = (id: string) =>
  api.post(`/evaluations/${id}/complete/`);

export const getEvaluationPeriods = () =>
  api.get('/evaluations/periods/');

export const getCriteria = () =>
  api.get('/evaluations/criteria/');
