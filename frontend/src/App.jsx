import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout.jsx';
import AuthLayout from '@/components/auth/AuthLayout.jsx';
import DashboardLayout from '@/components/dashboard/DashboardLayout.jsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import { PageLoader } from '@/components/ui/index.jsx';

/* Eager: homepage */
import HomePage from '@/pages/HomePage.jsx';

/* Route-split — Step 3 public pages */
const AboutPage = lazy(() => import('@/pages/AboutPage.jsx'));

/* Route-split — Auth */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage.jsx'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage.jsx'));

/* Helper: wrap lazy route in Suspense */
const withSuspense = (Component, label) => (
  <Suspense fallback={<PageLoader label={label} />}>
    <Component />
  </Suspense>
);

export default function App() {
  return (
    <Routes>
      {/* ==================== PUBLIC ==================== */}
      <Route element={<Layout />}>
        {/* Landing */}
        <Route index element={<HomePage />} />

        {/* Company */}
        <Route path="about" element={withSuspense(AboutPage, 'About')} />
      </Route>

      {/* ==================== AUTH ==================== */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={withSuspense(LoginPage, 'Log in')} />
        <Route path="register" element={withSuspense(RegisterPage, 'Sign up')} />
        <Route path="verify-email" element={withSuspense(VerifyEmailPage, 'Verify')} />
        <Route path="forgot-password" element={withSuspense(ForgotPasswordPage, 'Reset')} />
        <Route path="reset-password" element={withSuspense(ResetPasswordPage, 'Reset')} />
      </Route>

      {/* ==================== DASHBOARD (PROTECTED) ==================== */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        
      </Route>
    </Routes>
  );
}
