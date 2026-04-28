/**
 * =============================================================================
 * Unified Request API
 * =============================================================================
 *
 * Connects to the /api/v1/requests/ endpoints that aggregate certificates,
 * leaves, and missions into a single normalized stream.
 *
 * Used by:
 *   - MyRequestsPage  → getMyRequests()
 *   - AllRequestsPage → getAllRequests() + reviewRequest()
 *   - DashboardPage   → getRequestStats()
 * =============================================================================
 */
import api from './axiosInstance';

/**
 * GET /api/v1/requests/mine/
 * Fetch all of the current user's requests (all types merged).
 * Optional query params: ?type=CERTIFICATE&status=PENDING
 */
export const getMyRequests = (params?: Record<string, string>) =>
  api.get('/requests/mine/', { params });

/**
 * GET /api/v1/requests/all/
 * HR only: fetch all requests from all users.
 * Optional query params: ?type=LEAVE&status=APPROVED
 */
export const getAllRequests = (params?: Record<string, string>) =>
  api.get('/requests/all/', { params });

/**
 * POST /api/v1/requests/review/
 * HR only: approve or reject a request of any type.
 * The backend routes the action to the correct model (DocumentRequest,
 * LeaveRequest, or Mission) based on the type field.
 *
 * @param data.id     - UUID of the request
 * @param data.type   - "CERTIFICATE" | "LEAVE" | "MISSION"
 * @param data.action - "approve" | "reject"
 * @param data.reason - optional rejection reason
 */
export const reviewRequest = (data: {
  id: string;
  type: string;
  action: 'approve' | 'reject';
  reason?: string;
}) => api.post('/requests/review/', data);

/**
 * GET /api/v1/requests/stats/
 * HR only: dashboard statistics across all request types.
 */
export const getRequestStats = () =>
  api.get('/requests/stats/');
