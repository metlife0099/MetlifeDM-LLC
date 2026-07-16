import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout.jsx';
import AuthLayout from '@/components/auth/AuthLayout.jsx';
import DashboardLayout from '@/components/dashboard/DashboardLayout.jsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import { PageLoader } from '@/components/ui/index.jsx';

/* Eager: homepage */
// import HomePage from '@/pages/HomePage.jsx';
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));

/* Route-split — Step 3 public pages */
const AboutPage = lazy(() => import('@/pages/AboutPage.jsx'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage.jsx'));
const ServiceDetailsPage = lazy(() => import('@/pages/ServiceDetailsPage.jsx'));
const PricingPage = lazy(() => import('@/pages/PricingPage.jsx'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage.jsx'));
const PortfolioDetailsPage = lazy(() => import('@/pages/PortfolioDetailsPage.jsx'));
const CaseStudiesPage = lazy(() => import('@/pages/CaseStudiesPage.jsx'));
const CaseStudyDetailsPage = lazy(() => import('@/pages/CaseStudyDetailsPage.jsx'));
const IndustriesPage = lazy(() => import('@/pages/IndustriesPage.jsx'));
const IndustryDetailsPage = lazy(() => import('@/pages/IndustryDetailsPage.jsx'));
const ContactPage = lazy(() => import('@/pages/ContactPage.jsx'));
const ConsultationPage = lazy(() => import('@/pages/ConsultationPage.jsx'));

/* Route-split — Step 4 content */
const BlogPage = lazy(() => import('@/pages/blog/BlogPage.jsx'));
const BlogDetailsPage = lazy(() => import('@/pages/blog/BlogDetailsPage.jsx'));
const TestimonialsPage = lazy(() => import('@/pages/TestimonialsPage.jsx'));
const FaqPage = lazy(() => import('@/pages/FaqPage.jsx'));
const CareersPage = lazy(() => import('@/pages/CareersPage.jsx'));
const CareerDetailsPage = lazy(() => import('@/pages/CareerDetailsPage.jsx'));
const LegalPage = lazy(() => import('@/pages/legal/LegalPage.jsx'));

/* Route-split — Auth */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage.jsx'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage.jsx'));

/* Route-split — Commerce */
const CartPage = lazy(() => import('@/pages/commerce/CartPage.jsx'));
const CheckoutPage = lazy(() => import('@/pages/commerce/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('@/pages/commerce/OrderSuccessPage.jsx'));

/* Route-split — Dashboard (single-default modules) */
const DashboardOverview = lazy(() => import('@/pages/dashboard/OverviewPage.jsx'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage.jsx'));
const InvoicesPage = lazy(() => import('@/pages/dashboard/InvoicesPage.jsx'));

/* Route-split — Dashboard multi-export modules
 * Each module exports a default (the list page) and named children.
 * We pull each into its own lazy component for code-splitting. */
const OrdersListPage = lazy(() =>
  import('@/pages/dashboard/OrdersPage.jsx').then((m) => ({ default: m.OrdersListPage }))
);
const OrderDetailsPage = lazy(() =>
  import('@/pages/dashboard/OrdersPage.jsx').then((m) => ({ default: m.OrderDetailsPage }))
);
const TicketsListPage = lazy(() =>
  import('@/pages/dashboard/TicketsPage.jsx').then((m) => ({ default: m.TicketsListPage }))
);
const NewTicketPage = lazy(() =>
  import('@/pages/dashboard/TicketsPage.jsx').then((m) => ({ default: m.NewTicketPage }))
);
const TicketDetailsPage = lazy(() =>
  import('@/pages/dashboard/TicketsPage.jsx').then((m) => ({ default: m.TicketDetailsPage }))
);
const WishlistPage = lazy(() =>
  import('@/pages/dashboard/AccountPages.jsx').then((m) => ({ default: m.WishlistPage }))
);
const NotificationsPage = lazy(() =>
  import('@/pages/dashboard/AccountPages.jsx').then((m) => ({ default: m.NotificationsPage }))
);
const SecurityPage = lazy(() =>
  import('@/pages/dashboard/AccountPages.jsx').then((m) => ({ default: m.SecurityPage }))
);

/* Route-split — Utility */
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage.jsx'));

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

        {/* Services + Pricing */}
        <Route path="services" element={withSuspense(ServicesPage, 'Services')} />
        <Route path="services/:slug" element={withSuspense(ServiceDetailsPage, 'Service')} />
        <Route path="pricing" element={withSuspense(PricingPage, 'Pricing')} />

        {/* Work */}
        <Route path="portfolio" element={withSuspense(PortfolioPage, 'Portfolio')} />
        <Route path="portfolio/:slug" element={withSuspense(PortfolioDetailsPage, 'Project')} />
        <Route path="case-studies" element={withSuspense(CaseStudiesPage, 'Case studies')} />
        <Route path="case-studies/:slug" element={withSuspense(CaseStudyDetailsPage, 'Case study')} />
        <Route path="industries" element={withSuspense(IndustriesPage, 'Industries')} />
        <Route path="industries/:slug" element={withSuspense(IndustryDetailsPage, 'Industry')} />

        {/* Content */}
        <Route path="blog" element={withSuspense(BlogPage, 'Blog')} />
        <Route path="blog/:slug" element={withSuspense(BlogDetailsPage, 'Post')} />
        <Route path="testimonials" element={withSuspense(TestimonialsPage, 'Testimonials')} />
        <Route path="faq" element={withSuspense(FaqPage, 'FAQ')} />
        <Route path="careers" element={withSuspense(CareersPage, 'Careers')} />
        <Route path="careers/:slug" element={withSuspense(CareerDetailsPage, 'Role')} />

        {/* Contact */}
        <Route path="contact" element={withSuspense(ContactPage, 'Contact')} />
        <Route path="consultation" element={withSuspense(ConsultationPage, 'Consultation')} />

        {/* Commerce */}
        <Route path="cart" element={withSuspense(CartPage, 'Cart')} />
        <Route path="checkout" element={withSuspense(CheckoutPage, 'Checkout')} />
        <Route path="order-success" element={withSuspense(OrderSuccessPage, 'Confirmation')} />

        {/* Legal */}
        <Route path="privacy" element={withSuspense(LegalPage, 'Privacy')} />
        <Route path="terms" element={withSuspense(LegalPage, 'Terms')} />
        <Route path="cookies" element={withSuspense(LegalPage, 'Cookies')} />

        {/* Errors */}
        <Route path="403" element={withSuspense(ForbiddenPage, 'Forbidden')} />
        <Route path="*" element={withSuspense(NotFoundPage, '404')} />
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
        <Route index element={withSuspense(DashboardOverview, 'Dashboard')} />
        <Route path="profile" element={withSuspense(ProfilePage, 'Profile')} />
        <Route path="orders" element={withSuspense(OrdersListPage, 'Orders')} />
        <Route path="orders/:id" element={withSuspense(OrderDetailsPage, 'Order')} />
        <Route path="invoices" element={withSuspense(InvoicesPage, 'Invoices')} />
        <Route path="tickets" element={withSuspense(TicketsListPage, 'Tickets')} />
        <Route path="tickets/new" element={withSuspense(NewTicketPage, 'New ticket')} />
        <Route path="tickets/:id" element={withSuspense(TicketDetailsPage, 'Ticket')} />
        <Route path="wishlist" element={withSuspense(WishlistPage, 'Wishlist')} />
        <Route path="notifications" element={withSuspense(NotificationsPage, 'Notifications')} />
        <Route path="security" element={withSuspense(SecurityPage, 'Security')} />
      </Route>
    </Routes>
  );
}
