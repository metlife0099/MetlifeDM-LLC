import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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

const doHydrate = (dispatch) => {
  if (hydrationPromise) return hydrationPromise;
  if (!getAccessToken()) return Promise.resolve();

  dispatch(setLoading(true));

  hydrationPromise = authApi
    .me()
    .then((res) => {
      const me = res?.user || res;
      if (!me || !ADMIN_ROLES.includes(me.role)) {
        setAccessToken(null);
        localStorage.removeItem(STORAGE.USER);
        dispatch(clearAuth());
        return null;
      }
      dispatch(setUser(me));
      return me;
    })
    .catch(() => {
      setAccessToken(null);
      localStorage.removeItem(STORAGE.USER);
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
  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const loading = useSelector((s) => s.auth.loading);

  /* Hydrate once from /auth/me — module-level dedupe prevents multiple calls */
  useEffect(() => {
    doHydrate(dispatch);
  }, [dispatch]);

  /* Listen for global logout events (from the 401 interceptor) */
  useEffect(() => {
    const onLogout = () => {
      resetHydration();
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
      const me = res?.user || res;
      if (!me?.role || !ADMIN_ROLES.includes(me.role)) {
        setAccessToken(null);
        throw new Error('This account does not have admin access.');
      }
      dispatch(setUser(me));
      // Mark hydration as done so we don't refetch /me after login
      hydrationPromise = Promise.resolve(me);
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
    resetHydration();
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
