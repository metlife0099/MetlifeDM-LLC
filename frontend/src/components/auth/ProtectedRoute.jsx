import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth.js';
import { getAccessToken } from '@/api/client.js';
import { PageLoader } from '@/components/ui/index.jsx';

/**
 * Redirects unauthenticated users to /login with a return URL.
 * Optional roles prop for authorization (e.g., admin-only).
 */
export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const hasToken = getAccessToken();

  // No token → straight to login
  if (!hasToken && !isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Token exists but user not yet hydrated → wait
  if (hasToken && !user) {
    return <PageLoader label="Verifying" />;
  }

  // Role guard
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
