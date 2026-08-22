import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { getAccessToken } from '@/api/client.js';
import { PageLoader } from '@/components/ui/index.jsx';

/**
 * Redirects unauthenticated users to /login with a return URL.
 * Optional roles prop for authorization (e.g., admin-only).
 */
export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const hasToken = getAccessToken();

  // Verify the HttpOnly refresh-cookie session before trusting a cached profile
  // or deciding that the visitor is signed out.
  if (loading) {
    return <PageLoader label="Verifying" />;
  }

  if (!hasToken || !isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
