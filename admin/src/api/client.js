import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/* ————— Token store (admin has its own key) ————— */
const KEYS = {
  ACCESS: 'mdm_admin_access_token',
  USER: 'mdm_admin_user',
};

let accessToken =
  typeof window !== 'undefined' ? localStorage.getItem(KEYS.ACCESS) : null;

export const setAccessToken = (t) => {
  accessToken = t;
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem(KEYS.ACCESS, t);
  else localStorage.removeItem(KEYS.ACCESS);
};

export const getAccessToken = () => accessToken;

/* ————— Axios instance ————— */
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* ————— Silent refresh ————— */
let refreshing = null;

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((r) => {
              const token = r.data?.data?.accessToken || r.data?.accessToken;
              setAccessToken(token);
              return token;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
        localStorage.removeItem(KEYS.USER);
        window.dispatchEvent(new Event('admin:logout'));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

/* ————— Response unwrapping helpers —————
 * Backend controllers sometimes wrap single entities as { service: {...} } or
 * { post: {...} } inside `data`. We auto-flatten single-key object wrappers so
 * consumers can read entity fields directly (row.title, not row.service.title).
 * Arrays and multi-key objects are returned as-is.
 */
const flattenSingleKey = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
  const keys = Object.keys(v);
  if (keys.length !== 1) return v;
  const inner = v[keys[0]];
  if (!inner || typeof inner !== 'object' || Array.isArray(inner)) return v;
  return inner;
};

export const unwrap = (r) => flattenSingleKey(r.data?.data ?? r.data);
export const unwrapMeta = (r) => ({
  data: Array.isArray(r.data?.data) ? r.data.data : (r.data?.data || []),
  meta: r.data?.meta || {},
  ...(r.data?.stats && { stats: r.data.stats }),
});

/* ————— Error message extractor ————— */
export const getErrorMessage = (err) => {
  if (!err) return 'Something went wrong.';
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.message ||
    err.message ||
    'Something went wrong.'
  );
};

export const STORAGE = KEYS;
