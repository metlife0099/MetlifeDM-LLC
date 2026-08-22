import { configureStore, createSlice } from '@reduxjs/toolkit';
import { buildCartItem } from '@/utils/commerce.js';
import { getBrowserStorage, readJsonStorage, writeJsonStorage } from '@/utils/storage.js';
import { readConsent, saveConsent } from '@/utils/consent.js';
import { clearCheckoutIdempotencyKey } from '@/utils/idempotency.js';

const local = getBrowserStorage();
const session = getBrowserStorage('session');

/* --------------------- AUTH SLICE --------------------- */
const AUTH_USER_KEY = 'mdm_user';
const AUTH_PERSISTENCE_KEY = 'mdm_auth_persistence';
const storedAuthMode = local?.getItem(AUTH_PERSISTENCE_KEY) === 'local'
  ? 'local'
  : session?.getItem(AUTH_PERSISTENCE_KEY) === 'session'
    ? 'session'
    : null;

// Older builds always wrote account data to localStorage. Without an explicit
// persistence choice it is only a cache, never proof of a live session.
if (!storedAuthMode) {
  local?.removeItem(AUTH_USER_KEY);
  session?.removeItem(AUTH_USER_KEY);
}

const authInitial = {
  user: storedAuthMode === 'local'
    ? readJsonStorage(local, AUTH_USER_KEY, null)
    : storedAuthMode === 'session'
      ? readJsonStorage(session, AUTH_USER_KEY, null)
      : null,
  isAuthenticated: false,
  loading: true,
  persistence: storedAuthMode || 'session',
};
const authSlice = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      local?.removeItem(AUTH_USER_KEY);
      session?.removeItem(AUTH_USER_KEY);
      if (action.payload) {
        writeJsonStorage(state.persistence === 'local' ? local : session, AUTH_USER_KEY, action.payload);
      }
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      writeJsonStorage(state.persistence === 'local' ? local : session, AUTH_USER_KEY, state.user);
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      local?.removeItem(AUTH_USER_KEY);
      session?.removeItem(AUTH_USER_KEY);
      local?.removeItem(AUTH_PERSISTENCE_KEY);
      session?.removeItem(AUTH_PERSISTENCE_KEY);
      local?.removeItem('mdm_access');
      session?.removeItem('mdm_access');
      state.persistence = 'session';
    },
    setAuthPersistence(state, action) {
      state.persistence = action.payload ? 'local' : 'session';
      local?.removeItem(AUTH_PERSISTENCE_KEY);
      session?.removeItem(AUTH_PERSISTENCE_KEY);
      local?.removeItem(AUTH_USER_KEY);
      session?.removeItem(AUTH_USER_KEY);
      const target = state.persistence === 'local' ? local : session;
      target?.setItem(AUTH_PERSISTENCE_KEY, state.persistence);
      if (state.user) writeJsonStorage(target, AUTH_USER_KEY, state.user);
    },
    setAuthLoading(state, action) {
      state.loading = action.payload;
    },
  },
});
export const { setUser, updateUser, clearUser, setAuthLoading, setAuthPersistence } = authSlice.actions;

/* --------------------- CART SLICE --------------------- */
const cartInitial = {
  items: readJsonStorage(local, 'mdm_cart', []),
  coupon: null,
};
const persistCart = (items) => writeJsonStorage(local, 'mdm_cart', items);

const cartSlice = createSlice({
  name: 'cart',
  initialState: cartInitial,
  reducers: {
    addItem(state, action) {
      const { service, plan, quantity = 1 } = action.payload;
      const nextItem = buildCartItem({ service, plan, quantity });
      const existingIdx = state.items.findIndex(
        (i) => i.serviceId === nextItem.serviceId && i.planId === nextItem.planId
      );
      if (existingIdx >= 0) {
        state.items[existingIdx].quantity += quantity;
      } else {
        state.items.push(nextItem);
      }
      state.coupon = null;
      clearCheckoutIdempotencyKey();
      persistCart(state.items);
    },
    removeItem(state, action) {
      state.items = state.items.filter((_, i) => i !== action.payload);
      state.coupon = null;
      clearCheckoutIdempotencyKey();
      persistCart(state.items);
    },
    updateQuantity(state, action) {
      const { index, quantity } = action.payload;
      if (state.items[index]) {
        state.items[index].quantity = Math.max(1, quantity);
        state.coupon = null;
        clearCheckoutIdempotencyKey();
        persistCart(state.items);
      }
    },
    replaceCartItems(state, action) {
      state.items = action.payload;
      state.coupon = null;
      clearCheckoutIdempotencyKey();
      persistCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      clearCheckoutIdempotencyKey();
      persistCart([]);
    },
    setCoupon(state, action) {
      state.coupon = action.payload;
      clearCheckoutIdempotencyKey();
    },
  },
});
export const { addItem, removeItem, updateQuantity, replaceCartItems, clearCart, setCoupon } = cartSlice.actions;

/* --------------------- UI SLICE --------------------- */
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    chatOpen: false,
    announcementDismissed: session?.getItem('mdm_announcement_dismissed') === '1',
    cookiePreferences: readConsent(),
    cookieBannerOpen: !readConsent(),
    theme: 'light',
  },
  reducers: {
    toggleMobileMenu(state, action) {
      state.mobileMenuOpen = action.payload ?? !state.mobileMenuOpen;
    },
    toggleChat(state, action) {
      state.chatOpen = action.payload ?? !state.chatOpen;
    },
    dismissAnnouncement(state) {
      state.announcementDismissed = true;
      session?.setItem('mdm_announcement_dismissed', '1');
    },
    setCookiePreferences(state, action) {
      state.cookiePreferences = saveConsent(action.payload);
      state.cookieBannerOpen = false;
      local?.removeItem('mdm_cookies');
    },
    openCookieSettings(state) {
      state.cookieBannerOpen = true;
    },
    closeCookieSettings(state) {
      if (state.cookiePreferences) state.cookieBannerOpen = false;
    },
  },
});
export const {
  toggleMobileMenu,
  toggleChat,
  dismissAnnouncement,
  setCookiePreferences,
  openCookieSettings,
  closeCookieSettings,
} = uiSlice.actions;

/* --------------------- STORE --------------------- */
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
  devTools: import.meta.env.MODE !== 'production',
});
