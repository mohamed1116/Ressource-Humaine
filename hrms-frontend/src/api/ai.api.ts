/**
 * AI Engine API
 * -------------
 * These calls run silently in the background.
 * The AI has no dedicated page -- its data is consumed by
 * the dashboard (alert banners, smart stats) and employee detail pages.
 */
import api from './axiosInstance';

/** Full summary for the HR dashboard (called once on load) */
export const getAIDashboard = () =>
  api.get('/ai/dashboard/');

/** Active department-level alerts */
export const getAlerts = (params?: Record<string, string>) =>
  api.get('/ai/alerts/', { params });

/** Dismiss a stored alert */
export const dismissAlert = (id: string) =>
  api.post(`/ai/alerts/${id}/dismiss/`);

/** AI-generated recommendations */
export const getRecommendations = () =>
  api.get('/ai/recommendations/');

/** Intelligence profile for a single employee */
export const getEmployeeIntelligence = (employeeId: string) =>
  api.get(`/ai/employee/${employeeId}/`);

/** Leave volume forecasting */
export const getLeaveForecast = () =>
  api.get('/ai/leave-forecast/');

/** Late arrival pattern detection */
export const getLatePatterns = () =>
  api.get('/ai/late-patterns/');
