/**
 * ProtectedRoute -- Auth guard with role checking.
 * - No token → redirect to /login
 * - Wrong role → show 403 Forbidden page (not silent redirect)
 * - Loading → spinner
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForbiddenPage from '../components/ui/ForbiddenPage';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  /* Still loading user from token */
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

  /* Not authenticated → login */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* Authenticated but wrong role → 403 */
  if (roles && user && !roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
