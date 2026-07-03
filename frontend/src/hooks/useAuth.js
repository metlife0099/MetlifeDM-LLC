import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, setAuthLoading } from '../store/index.js';
import { authApi } from '../api/index.js';
import { setAccessToken, getAccessToken } from '../api/client.js';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((s) => s.auth);

  /* Hydrate user on mount if token exists but no user */
  useEffect(() => {
    if (getAccessToken() && !user) {
      authApi
        .me()
        .then((r) => dispatch(setUser(r.user)))
        .catch(() => {
          setAccessToken(null);
          dispatch(clearUser());
        });
    }
  }, [dispatch, user]);

  /* Handle 401 broadcast from Axios */
  useEffect(() => {
    const onLogout = () => dispatch(clearUser());
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [dispatch]);

  const login = useCallback(
    async (credentials) => {
      dispatch(setAuthLoading(true));
      try {
        const result = await authApi.login(credentials);
        if (result.requires2FA) return { requires2FA: true };
        setAccessToken(result.accessToken);
        dispatch(setUser(result.user));
        return { user: result.user };
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (data) => {
      dispatch(setAuthLoading(true));
      try {
        const result = await authApi.register(data);
        return result;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      dispatch(clearUser());
    }
  }, [dispatch]);

  return { user, isAuthenticated, loading, login, register, logout };
};
