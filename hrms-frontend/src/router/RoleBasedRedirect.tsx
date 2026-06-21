/**
 * RoleBasedRedirect - توجيه المستخدمين حسب دورهم
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#0f172a] mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // توجيه حسب الدور
  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/superadmin" replace />;
    
    case 'ADMIN_HR':
    case 'DEPARTMENT_HEAD':
    case 'PROFESSOR':
    case 'STAFF':
    case 'STUDENT':
      return <Navigate to="/dashboard" replace />;
    
    default:
      return <Navigate to="/dashboard" replace />;
  }
}
