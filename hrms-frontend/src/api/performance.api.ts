import api from './axiosInstance';

export const getEvaluations = (params?: Record<string, string>) =>
  api.get('/evaluations/', { params });

export const getEvaluation = (id: string) =>
  api.get(`/evaluations/${id}/`);

export const createEvaluation = (data: Record<string, unknown>) =>
  api.post('/evaluations/', data);

export const completeEvaluation = (id: string) =>
  api.post(`/evaluations/${id}/complete/`);

export const supervisorEvaluate = (id: string, data: { scores: Array<{ criterion_id: string; score: number; comment?: string }>; comment?: string }) =>
  api.post(`/evaluations/${id}/supervisor-evaluate/`, data);

export const selfEvaluate = (id: string, data: { scores: Array<{ criterion_id: string; score: number; comment?: string }>; comment?: string }) =>
  api.post(`/evaluations/${id}/self-evaluate/`, data);

export const getEvaluationPeriods = () =>
  api.get('/evaluations/periods/');

export const createEvaluationPeriod = (data: Record<string, unknown>) =>
  api.post('/evaluations/periods/', data);

export const updateEvaluationPeriod = (id: string, data: Record<string, unknown>) =>
  api.patch(`/evaluations/periods/${id}/`, data);

export const deleteEvaluationPeriod = (id: string) =>
  api.delete(`/evaluations/periods/${id}/`);

export const getCriteria = () =>
  api.get('/evaluations/criteria/');

export const createCriterion = (data: Record<string, unknown>) =>
  api.post('/evaluations/criteria/', data);

export const updateCriterion = (id: string, data: Record<string, unknown>) =>
  api.patch(`/evaluations/criteria/${id}/`, data);

export const deleteCriterion = (id: string) =>
  api.delete(`/evaluations/criteria/${id}/`);

export const launchCampaign = (data: { period_id: string; department_id?: string; role?: string }) =>
  api.post('/evaluations/campaign/', data);

export const getEvaluationStats = (params?: Record<string, string>) =>
  api.get('/evaluations/stats/', { params });
