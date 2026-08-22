import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/index.js';
import { setAccessToken, getAccessToken, STORAGE } from '@/api/client.js';
import { setUser, clearAuth, setLoading } from '@/store/index.js';
import { ADMIN_ROLES } from '@/utils/constants.js';

/**
 * Module-level hydration guard — ensures we only call /auth/me ONCE per app
 * session, no matter how many components mount useAuth(). Without this the
 * hook fires from every component (ProtectedAdminRoute, Topbar, DashboardPage,
 * etc.), causing overlapping requests and stuck loading states.
 */
let hydrationPromise = null;

const clearStoredUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE.USER);
  sessionStorage.removeItem(STORAGE.USER);
};

const doHydrate = (dispatch, queryClient) => {
  if (hydrationPromise) return hydrationPromise;

  dispatch(setLoading(true));

  hydrationPromise = Promise.resolve()
    .then(async () => {
      let token = getAccessToken();
      if (!token) {
        const session = await authApi.session();
        if (!session?.hasSession) return null;
        const refreshed = await authApi.refresh();
        token = refreshed?.accessToken;
        if (!token) return null;
        // Keep the short-lived bearer token in this browser tab. The durable,
        // HttpOnly refresh cookie restores the 2-day staff session next time.
        setAccessToken(token, false);
      }
      return authApi.me();
    })
    .then((res) => {
      if (!res) {
        clearStoredUser();
        queryClient.clear();
        dispatch(clearAuth());
        return null;
      }
      const me = res?.user || res;
      if (!me || !ADMIN_ROLES.includes(me.role)) {
        setAccessToken(null);
        clearStoredUser();
        queryClient.clear();
        dispatch(clearAuth());
        return null;
      }
      dispatch(setUser(me));
      return me;
    })
    .catch(() => {
      setAccessToken(null);
      clearStoredUser();
      queryClient.clear();
      dispatch(clearAuth());
      return null;
    })
    .finally(() => {
      // ALWAYS clear loading, no matter what. Guard against React StrictMode
      // double-invocation cancelling this side-effect.
      dispatch(setLoading(false));
    });

  return hydrationPromise;
};

const resetHydration = () => {
  hydrationPromise = null;
};

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const loading = useSelector((s) => s.auth.loading);

  const endSession = useCallback(() => {
    resetHydration();
    setAccessToken(null);
    clearStoredUser();
    queryClient.clear();
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  }, [dispatch, navigate, queryClient]);

  /* Hydrate once from /auth/me — module-level dedupe prevents multiple calls */
  useEffect(() => {
    doHydrate(dispatch, queryClient);
  }, [dispatch, queryClient]);

  /* Listen for global logout events (from the 401 interceptor) */
  useEffect(() => {
    const onLogout = () => endSession();
    window.addEventListener('admin:logout', onLogout);
    return () => window.removeEventListener('admin:logout', onLogout);
  }, [endSession]);

  const login = useCallback(
    async (data) => {
      const res = await authApi.login(data);
      if (res?.requires2FA) return res;
      if (res?.accessToken) setAccessToken(res.accessToken, Boolean(data.rememberMe));
      const me = res?.user || res;
      if (!me?.role || !ADMIN_ROLES.includes(me.role)) {
        await authApi.logout().catch(() => {});
        setAccessToken(null);
        clearStoredUser();
        queryClient.clear();
        dispatch(clearAuth());
        throw new Error('This account does not have admin access.');
      }
      queryClient.clear();
      dispatch(setUser(me));
      // Mark hydration as done so we don't refetch /me after login
      hydrationPromise = Promise.resolve(me);
      return res;
    },
    [dispatch, queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    endSession();
  }, [endSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      endSession();
    }
  }, [endSession]);

  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      if (!roles || (Array.isArray(roles) && roles.length === 0)) return true;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(user.role);
    },
    [user]
  );

  return { user, isAuthenticated, loading, login, logout, logoutAll, hasRole };
}
