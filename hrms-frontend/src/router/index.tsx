/**
 * Application Router — Production
 */
import { createBrowserRouter } from 'react-router-dom';
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
import MyCertificatesPage from '../pages/certificates/MyCertificatesPage';
import ManageCertificatesPage from '../pages/certificates/ManageCertificatesPage';

import TemplateListPage from '../pages/templates/TemplateListPage';
import TemplateEditorPage from '../pages/templates/TemplateEditorPage';

import MyLeavesPage from '../pages/leaves/MyLeavesPage';
import LeaveRequestPage from '../pages/leaves/LeaveRequestPage';

import MissionListPage from '../pages/missions/MissionListPage';
import DailyAttendancePage from '../pages/attendance/DailyAttendancePage';

import DepartementsPage from '../pages/employees/DepartementsPage';
import AdministratifPage from '../pages/employees/AdministratifPage';
import UserManagementPage from '../pages/users/UserManagementPage';
import SuperAdminDashboardPage from '../pages/superadmin/SuperAdminDashboardPage';
import BroadcastNotificationPage from '../pages/superadmin/BroadcastNotificationPage';
import NotificationListPage from '../pages/notifications/NotificationListPage';


import EvaluationListPage from '../pages/performance/EvaluationListPage';
import AIInsightsPage from '../pages/ai/AIInsightsPage';
import AuditLogPage from '../pages/audit/AuditLogPage';
import ReportsPage from '../pages/reports/ReportsPage';
import PromotionsPage from '../pages/promotions/PromotionsPage';


import ForbiddenPage from '../components/ui/ForbiddenPage';
import MessagingPage from '../pages/messaging/MessagingPage';

import RoleBasedRedirect from './RoleBasedRedirect';

const HR = ['SUPER_ADMIN', 'ADMIN_HR'];
const SUPER = ['SUPER_ADMIN'];
const HR_AND_SUPER = ['SUPER_ADMIN', 'ADMIN_HR'];

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  {
    path: '/',
    element: <ProtectedRoute><ErrorBoundary><AppLayout /></ErrorBoundary></ProtectedRoute>,
    children: [
      { index: true, element: <RoleBasedRedirect /> },
      { path: 'dashboard',  element: <ProtectedRoute roles={['ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF', 'STUDENT']}><DashboardPage /></ProtectedRoute> },
      { path: 'profile',    element: <ProfilePage /> },
      { path: 'notifications', element: <NotificationListPage /> },
      { path: 'messaging', element: <ProtectedRoute roles={['SUPER_ADMIN','ADMIN_HR','DEPARTMENT_HEAD','PROFESSOR','STAFF']}><MessagingPage /></ProtectedRoute> },

      /* Demandes unifiées */
      { path: 'requests/new',       element: <ProtectedRoute roles={['DEPARTMENT_HEAD','PROFESSOR','STAFF','STUDENT']}><NewRequestPage /></ProtectedRoute> },
      { path: 'requests',           element: <ProtectedRoute roles={['DEPARTMENT_HEAD','PROFESSOR','STAFF','STUDENT']}><MyRequestsPage /></ProtectedRoute> },
      { path: 'requests/all',       element: <ProtectedRoute roles={HR_AND_SUPER}><AllRequestsPage /></ProtectedRoute> },
      { path: 'requests/:type/:id', element: <RequestDetailPage /> },

      /* Attestations */
      { path: 'certificates',        element: <MyCertificatesPage /> },
      { path: 'certificates/new',    element: <CertificateRequestPage /> },
      { path: 'certificates/manage', element: <ProtectedRoute roles={HR_AND_SUPER}><ManageCertificatesPage /></ProtectedRoute> },

      /* Modèles */
      { path: 'templates',          element: <ProtectedRoute roles={HR}><TemplateListPage /></ProtectedRoute> },
      { path: 'templates/new',      element: <ProtectedRoute roles={HR}><TemplateEditorPage /></ProtectedRoute> },
      { path: 'templates/:id/edit', element: <ProtectedRoute roles={HR}><TemplateEditorPage /></ProtectedRoute> },

      /* Congés */
      { path: 'leaves',         element: <MyLeavesPage /> },
      { path: 'leaves/request', element: <LeaveRequestPage /> },

      /* Missions & Présences */
      { path: 'missions',   element: <MissionListPage /> },
      { path: 'attendance', element: <DailyAttendancePage /> },

      /* RH (admin seulement) */
      { path: 'departements', element: <ProtectedRoute roles={HR}><DepartementsPage /></ProtectedRoute> },
      { path: 'administratif', element: <ProtectedRoute roles={HR}><AdministratifPage /></ProtectedRoute> },
      
      /* Super Admin only */
      { path: 'superadmin', element: <ProtectedRoute roles={SUPER}><SuperAdminDashboardPage /></ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute roles={SUPER}><UserManagementPage /></ProtectedRoute> },
      { path: 'broadcast', element: <ProtectedRoute roles={SUPER}><BroadcastNotificationPage /></ProtectedRoute> },

      /* Rapports & Analyses */
      { path: 'promotions',   element: <ProtectedRoute roles={HR}><PromotionsPage /></ProtectedRoute> },
      { path: 'ai',          element: <ProtectedRoute roles={HR}><AIInsightsPage /></ProtectedRoute> },
      { path: 'reports',     element: <ProtectedRoute roles={HR}><ReportsPage /></ProtectedRoute> },
      { path: 'audit',       element: <ProtectedRoute roles={HR}><AuditLogPage /></ProtectedRoute> },

      { path: '403', element: <ForbiddenPage /> },
    ],
  },

  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-200">404</h1>
          <p className="text-sm text-gray-500 mt-2">Page introuvable</p>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline mt-3 inline-block">Retour au tableau de bord</a>
        </div>
      </div>
    ),
  },
]);
