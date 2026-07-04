import { configureStore, createSlice } from '@reduxjs/toolkit';
import { STORAGE } from '@/api/client.js';

/* ————— Storage helpers ————— */
const load = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
};

/* ————— AUTH ————— */
const authInitial = {
  user: load(STORAGE.USER, null),
  isAuthenticated: !!load(STORAGE.USER, null),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      save(STORAGE.USER, action.payload);
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      save(STORAGE.USER, state.user);
    },
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
      save(STORAGE.USER, null);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

/* ————— UI ————— */
const uiInitial = {
  sidebarCollapsed: load('mdm_admin_sidebar_collapsed', false),
  mobileMenuOpen: false,
  commandOpen: false,
  activeTheme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitial,
  reducers: {
    toggleSidebar(state, action) {
      state.sidebarCollapsed = action.payload ?? !state.sidebarCollapsed;
      save('mdm_admin_sidebar_collapsed', state.sidebarCollapsed);
    },
    toggleMobileMenu(state, action) {
      state.mobileMenuOpen = action.payload ?? !state.mobileMenuOpen;
    },
    toggleCommand(state, action) {
      state.commandOpen = action.payload ?? !state.commandOpen;
    },
  },
});

export const { setUser, updateUser, clearAuth, setLoading } = authSlice.actions;
export const { toggleSidebar, toggleMobileMenu, toggleCommand } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});
