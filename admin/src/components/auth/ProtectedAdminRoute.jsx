import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAccessToken } from '@/api/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { PageLoader } from '@/components/ui/index.jsx';
import { ADMIN_ROLES } from '@/utils/constants.js';

export default function ProtectedAdminRoute({ children, roles }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const hasToken = getAccessToken();

  if (!hasToken && !isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (loading || (hasToken && !user)) {
    return <PageLoader label="Verifying admin session" />;
  }

  if (user && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
