import api from './axiosInstance';

// Super Admin Dashboard
export const getSuperAdminDashboard = () =>
  api.get('/auth/superadmin/dashboard/');

export const getUserActivity = () =>
  api.get('/auth/superadmin/user-activity/');

// Broadcast Notifications
export const sendBroadcastNotification = (data: {
  title: string;
  message: string;
  target: 'ALL' | 'ROLE' | 'SPECIFIC';
  roles?: string[];
  user_ids?: string[];
  notification_type?: string;
}) => api.post('/auth/superadmin/broadcast-notification/', data);

// NOTE: System Settings endpoints are not yet implemented on the backend.
// Uncomment and use these once /api/v1/system/settings/ is registered in urls.py:
// export const getSystemSettings = () => api.get('/system/settings/');
// export const updateSystemSettings = (data: Record<string, unknown>) => api.patch('/system/settings/', data);
