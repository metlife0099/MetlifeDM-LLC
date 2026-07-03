/**
 * Reusable selectors for cart, auth, ui.
 */
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
export const selectCartDiscount = (state) => state.cart.coupon?.discount || 0;
export const selectCartTotal = (state) =>
  Math.max(0, selectCartSubtotal(state) - selectCartDiscount(state));

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) =>
  ['admin', 'super_admin', 'manager'].includes(state.auth.user?.role);
