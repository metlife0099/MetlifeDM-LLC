import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/* ---------------------------------------------------------------
 * Access token management (in-memory + localStorage fallback)
 * ------------------------------------------------------------- */
let accessToken = localStorage.getItem('mdm_access') || null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) localStorage.setItem('mdm_access', token);
  else localStorage.removeItem('mdm_access');
};
export const getAccessToken = () => accessToken;

/* ---------------------------------------------------------------
 * Request: attach token
 * ------------------------------------------------------------- */
apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/* ---------------------------------------------------------------
 * Response: silent refresh on 401
 * ------------------------------------------------------------- */
let refreshing = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!error.response) return Promise.reject(error);

    if (error.response.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true }).then((r) => {
            const newToken = r.data?.data?.accessToken;
            if (newToken) setAccessToken(newToken);
            return newToken;
          });
        const token = await refreshing;
        refreshing = null;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        }
      } catch {
        refreshing = null;
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

/* ---------------------------------------------------------------
 * Response shape helpers
 * ------------------------------------------------------------- */
export const unwrap = (res) => res?.data?.data ?? res?.data;
export const unwrapMeta = (res) => ({ data: unwrap(res), meta: res?.data?.meta });

/* Human-friendly error message */
export const getErrorMessage = (err) => {
  if (!err) return 'Something went wrong';
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.errors?.[0]?.message) return err.response.data.errors[0].message;
  if (err.message) return err.message;
  return 'Something went wrong';
};

export default apiClient;
