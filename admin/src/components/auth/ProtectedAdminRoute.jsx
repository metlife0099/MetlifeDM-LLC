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

  // If we have a user with an admin role, render optimistically even while a
  // background /me hydration is in-flight. This prevents "verifying admin
  // session" from getting stuck when hydration races or refetches.
  if (user && ADMIN_ROLES.includes(user.role)) {
    if (roles && !roles.includes(user.role)) {
      return <Navigate to="/403" replace />;
    }
    return children;
  }

  // Have a token but user hasn't hydrated yet — show loader while /me resolves
  if (loading || (hasToken && !user)) {
    return <PageLoader label="Verifying admin session" />;
  }

  // Loaded but user has wrong role
  if (user && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
