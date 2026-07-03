import { configureStore, createSlice } from '@reduxjs/toolkit';

/* --------------------- AUTH SLICE --------------------- */
const authInitial = {
  user: JSON.parse(localStorage.getItem('mdm_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('mdm_access'),
  loading: false,
};
const authSlice = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) localStorage.setItem('mdm_user', JSON.stringify(action.payload));
      else localStorage.removeItem('mdm_user');
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('mdm_user', JSON.stringify(state.user));
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('mdm_user');
      localStorage.removeItem('mdm_access');
    },
    setAuthLoading(state, action) {
      state.loading = action.payload;
    },
  },
});
export const { setUser, updateUser, clearUser, setAuthLoading } = authSlice.actions;

/* --------------------- CART SLICE --------------------- */
const cartInitial = {
  items: JSON.parse(localStorage.getItem('mdm_cart') || '[]'),
  coupon: null,
};
const persistCart = (items) => localStorage.setItem('mdm_cart', JSON.stringify(items));

const cartSlice = createSlice({
  name: 'cart',
  initialState: cartInitial,
  reducers: {
    addItem(state, action) {
      const { service, plan, quantity = 1 } = action.payload;
      const existingIdx = state.items.findIndex(
        (i) => i.serviceId === service._id && i.planId === (plan?._id || null)
      );
      if (existingIdx >= 0) {
        state.items[existingIdx].quantity += quantity;
      } else {
        state.items.push({
          serviceId: service._id,
          slug: service.slug,
          serviceName: service.title,
          icon: service.icon,
          planId: plan?._id || null,
          planName: plan?.name || 'Custom',
          unitPrice: plan?.price || service.startingPrice,
          quantity,
        });
      }
      persistCart(state.items);
    },
    removeItem(state, action) {
      state.items = state.items.filter((_, i) => i !== action.payload);
      persistCart(state.items);
    },
    updateQuantity(state, action) {
      const { index, quantity } = action.payload;
      if (state.items[index]) {
        state.items[index].quantity = Math.max(1, quantity);
        persistCart(state.items);
      }
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      persistCart([]);
    },
    setCoupon(state, action) {
      state.coupon = action.payload;
    },
  },
});
export const { addItem, removeItem, updateQuantity, clearCart, setCoupon } = cartSlice.actions;

/* --------------------- UI SLICE --------------------- */
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    chatOpen: false,
    announcementDismissed: sessionStorage.getItem('mdm_announcement_dismissed') === '1',
    cookieAccepted: localStorage.getItem('mdm_cookies') === '1',
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
      sessionStorage.setItem('mdm_announcement_dismissed', '1');
    },
    acceptCookies(state) {
      state.cookieAccepted = true;
      localStorage.setItem('mdm_cookies', '1');
    },
  },
});
export const { toggleMobileMenu, toggleChat, dismissAnnouncement, acceptCookies } = uiSlice.actions;

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
