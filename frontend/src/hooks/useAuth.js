import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearUser,
  setAuthLoading,
  setAuthPersistence,
  setUser,
} from '../store/index.js';
import { authApi } from '../api/index.js';
import { getAccessToken, setAccessToken } from '../api/client.js';

let bootstrapPromise = null;
let bootstrapSettled = false;
let authRevision = 0;

const restoreSession = () => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      let token = getAccessToken();
      if (!token) {
        const session = await authApi.session();
        if (!session?.hasSession) throw new Error('No active session');
        const refreshed = await authApi.refresh();
        token = refreshed?.accessToken;
        if (!token) throw new Error('No active session');
        setAccessToken(token);
      }
      return authApi.me();
    })();
  }
  return bootstrapPromise;
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // A cached profile is presentational only. Authentication is established by
  // rotating the HttpOnly refresh cookie and then fetching the current user.
  useEffect(() => {
    if (bootstrapSettled) return undefined;

    const revision = authRevision;
    let active = true;
    dispatch(setAuthLoading(true));

    restoreSession()
      .then((result) => {
        if (active && revision === authRevision) dispatch(setUser(result?.user || null));
      })
      .catch(() => {
        if (active && revision === authRevision) {
          setAccessToken(null);
          queryClient.clear();
          dispatch(clearUser());
        }
      })
      .finally(() => {
        bootstrapSettled = true;
        if (active && revision === authRevision) dispatch(setAuthLoading(false));
      });

    return () => {
      active = false;
    };
  }, [dispatch, queryClient]);

  // Axios broadcasts this event after a refresh attempt fails. Clear all
  // customer-scoped query data so it cannot bleed into the next session.
  useEffect(() => {
    const onLogout = () => {
      authRevision += 1;
      bootstrapSettled = true;
      setAccessToken(null);
      queryClient.clear();
      dispatch(clearUser());
      dispatch(setAuthLoading(false));
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [dispatch, queryClient]);

  const login = useCallback(
    async (credentials) => {
      authRevision += 1;
      dispatch(setAuthLoading(true));
      try {
        const result = await authApi.login(credentials);
        if (result.requires2FA) return { requires2FA: true };

        queryClient.clear();
        dispatch(setAuthPersistence(Boolean(credentials.rememberMe)));
        setAccessToken(result.accessToken);
        dispatch(setUser(result.user));
        bootstrapSettled = true;
        return { user: result.user };
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch, queryClient]
  );

  const register = useCallback(
    async (data) => {
      dispatch(setAuthLoading(true));
      try {
        return await authApi.register(data);
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    authRevision += 1;
    try {
      await authApi.logout();
    } catch {
      // Local sign-out must still complete if the server is unavailable.
    } finally {
      bootstrapSettled = true;
      setAccessToken(null);
      queryClient.clear();
      dispatch(clearUser());
      dispatch(setAuthLoading(false));
    }
  }, [dispatch, queryClient]);

  return { user, isAuthenticated, loading, login, register, logout };
};
