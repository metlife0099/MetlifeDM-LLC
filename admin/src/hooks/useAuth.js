import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/index.js';
import { setAccessToken, getAccessToken, STORAGE } from '@/api/client.js';
import { setUser, clearAuth, setLoading } from '@/store/index.js';
import { ADMIN_ROLES } from '@/utils/constants.js';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const loading = useSelector((s) => s.auth.loading);

  /* Hydrate from /me on load */
  useEffect(() => {
    if (!getAccessToken() && !user) return;
    let cancelled = false;
    (async () => {
      try {
        dispatch(setLoading(true));
        const res = await authApi.me();
        const me = res.user || res;
        if (cancelled) return;
        // Reject non-admin users at hydration
        if (!ADMIN_ROLES.includes(me?.role)) {
          setAccessToken(null);
          localStorage.removeItem(STORAGE.USER);
          dispatch(clearAuth());
          return;
        }
        dispatch(setUser(me));
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        localStorage.removeItem(STORAGE.USER);
        dispatch(clearAuth());
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Listen for global logout events (from 401 interceptor) */
  useEffect(() => {
    const onLogout = () => {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    };
    window.addEventListener('admin:logout', onLogout);
    return () => window.removeEventListener('admin:logout', onLogout);
  }, [dispatch, navigate]);

  const login = useCallback(
    async (data) => {
      const res = await authApi.login(data);
      if (res?.requires2FA) return res;
      if (res?.accessToken) setAccessToken(res.accessToken);
      const me = res.user || res;
      if (!ADMIN_ROLES.includes(me?.role)) {
        setAccessToken(null);
        throw new Error('This account does not have admin access.');
      }
      dispatch(setUser(me));
      return res;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    localStorage.removeItem(STORAGE.USER);
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      if (!roles || (Array.isArray(roles) && roles.length === 0)) return true;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(user.role);
    },
    [user]
  );

  return { user, isAuthenticated, loading, login, logout, hasRole };
}
