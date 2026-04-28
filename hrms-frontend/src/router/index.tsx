/**
 * Application Router -- Production
 * All routes with error boundaries, 403 page, profile, forgot password.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ui/ErrorBoundary';

import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/profile/ProfilePage';
import NewRequestPage from '../pages/requests/NewRequestPage';
import MyRequestsPage from '../pages/requests/MyRequestsPage';
import AllRequestsPage from '../pages/requests/AllRequestsPage';
import RequestDetailPage from '../pages/requests/RequestDetailPage';
import CertificateRequestPage from '../pages/certificates/CertificateRequestPage';
import ManageCertificatesPage from '../pages/certificates/ManageCertificatesPage';
import TemplateListPage from '../pages/templates/TemplateListPage';
import TemplateEditorPage from '../pages/templates/TemplateEditorPage';
import MyLeavesPage from '../pages/leaves/MyLeavesPage';
import LeaveRequestPage from '../pages/leaves/LeaveRequestPage';
import MissionListPage from '../pages/missions/MissionListPage';
import EmployeeListPage from '../pages/employees/EmployeeListPage';
import DepartmentListPage from '../pages/departments/DepartmentListPage';
import AuditLogPage from '../pages/audit/AuditLogPage';
import ForbiddenPage from '../components/ui/ForbiddenPage';
import NotificationListPage from '../pages/notifications/NotificationListPage';

const HR = ['ADMIN_HR'];

export const router = createBrowserRouter([
  /* Public */
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  {
    path: '/',
    element: <ProtectedRoute><ErrorBoundary><AppLayout /></ErrorBoundary></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },

      /* Unified requests */
      { path: 'requests/new', element: <NewRequestPage /> },
      { path: 'requests', element: <MyRequestsPage /> },
      { path: 'requests/all', element: <ProtectedRoute roles={HR}><AllRequestsPage /></ProtectedRoute> },
      { path: 'requests/:type/:id', element: <RequestDetailPage /> },

      /* Attestations */
      { path: 'certificates/new', element: <CertificateRequestPage /> },
      { path: 'certificates/manage', element: <ProtectedRoute roles={HR}><ManageCertificatesPage /></ProtectedRoute> },

      /* Templates */
      { path: 'templates', element: <ProtectedRoute roles={HR}><TemplateListPage /></ProtectedRoute> },
      { path: 'templates/new', element: <ProtectedRoute roles={HR}><TemplateEditorPage /></ProtectedRoute> },
      { path: 'templates/:id/edit', element: <ProtectedRoute roles={HR}><TemplateEditorPage /></ProtectedRoute> },

      /* Leaves */
      { path: 'leaves', element: <MyLeavesPage /> },
      { path: 'leaves/request', element: <LeaveRequestPage /> },

      /* Missions */
      { path: 'missions', element: <MissionListPage /> },

      /* HR */
      { path: 'employees', element: <ProtectedRoute roles={HR}><EmployeeListPage /></ProtectedRoute> },
      { path: 'departments', element: <ProtectedRoute roles={HR}><DepartmentListPage /></ProtectedRoute> },
      { path: 'audit', element: <ProtectedRoute roles={HR}><AuditLogPage /></ProtectedRoute> },
      { path: 'notifications', element: <NotificationListPage /> },

      /* 403 */
      { path: '403', element: <ForbiddenPage /> },
    ],
  },

  /* 404 */
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-200">404</h1>
          <p className="text-sm text-gray-500 mt-2">Page introuvable</p>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline mt-3 inline-block">Retour</a>
        </div>
      </div>
    ),
  },
]);
