import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProtectedAdminRoute from '@/components/auth/ProtectedAdminRoute.jsx';
import AdminLayout from '@/components/layout/AdminLayout.jsx';
import { PageLoader } from '@/components/ui/index.jsx';

/* ————— Lazy imports ————— */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage.jsx'));

const ServicesListPage = lazy(() => import('@/pages/content/services/ServicesListPage.jsx'));
const ServiceEditPage = lazy(() => import('@/pages/content/services/ServiceEditPage.jsx'));
const PortfolioListPage = lazy(() => import('@/pages/content/portfolio/PortfolioListPage.jsx'));
const PortfolioEditPage = lazy(() => import('@/pages/content/portfolio/PortfolioEditPage.jsx'));

const CaseStudiesModule = lazy(() =>
  import('@/pages/content/case-studies/CaseStudiesPage.jsx').then((m) => ({ default: m.CaseStudiesListPage }))
);
const CaseStudyEditModule = lazy(() =>
  import('@/pages/content/case-studies/CaseStudiesPage.jsx').then((m) => ({ default: m.CaseStudyEditPage }))
);

const IndustriesListModule = lazy(() =>
  import('@/pages/content/industries/IndustriesPage.jsx').then((m) => ({ default: m.IndustriesListPage }))
);
const IndustryEditModule = lazy(() =>
  import('@/pages/content/industries/IndustriesPage.jsx').then((m) => ({ default: m.IndustryEditPage }))
);

const PostsListModule = lazy(() =>
  import('@/pages/content/blog/PostsPage.jsx').then((m) => ({ default: m.PostsListPage }))
);
const PostEditModule = lazy(() =>
  import('@/pages/content/blog/PostsPage.jsx').then((m) => ({ default: m.PostEditPage }))
);
const CategoriesPage = lazy(() => import('@/pages/content/blog/CategoriesPage.jsx'));
const CommentsPage = lazy(() => import('@/pages/content/blog/CommentsPage.jsx'));

const TestimonialsPage = lazy(() => import('@/pages/content/testimonials/TestimonialsPage.jsx'));
const FaqsPage = lazy(() => import('@/pages/content/faqs/FaqsPage.jsx'));

const PagesListModule = lazy(() =>
  import('@/pages/content/pages/PagesPage.jsx').then((m) => ({ default: m.PagesListPage }))
);
const PageEditModule = lazy(() =>
  import('@/pages/content/pages/PagesPage.jsx').then((m) => ({ default: m.PageEditPage }))
);

const JobsListModule = lazy(() =>
  import('@/pages/careers/JobsPage.jsx').then((m) => ({ default: m.JobsListPage }))
);
const JobEditModule = lazy(() =>
  import('@/pages/careers/JobsPage.jsx').then((m) => ({ default: m.JobEditPage }))
);
const ApplicationsPage = lazy(() => import('@/pages/careers/ApplicationsPage.jsx'));

const ContactsModule = lazy(() =>
  import('@/pages/leads/LeadsPage.jsx').then((m) => ({ default: m.ContactsPage }))
);
const ConsultationsModule = lazy(() =>
  import('@/pages/leads/LeadsPage.jsx').then((m) => ({ default: m.ConsultationsPage }))
);
const SubscribersModule = lazy(() =>
  import('@/pages/leads/LeadsPage.jsx').then((m) => ({ default: m.SubscribersPage }))
);

const OrdersListModule = lazy(() =>
  import('@/pages/commerce/OrdersPage.jsx').then((m) => ({ default: m.OrdersListPage }))
);
const OrderDetailsModule = lazy(() =>
  import('@/pages/commerce/OrdersPage.jsx').then((m) => ({ default: m.OrderDetailsPage }))
);
const PaymentsModule = lazy(() =>
  import('@/pages/commerce/PaymentsCouponsPage.jsx').then((m) => ({ default: m.PaymentsPage }))
);
const CouponsModule = lazy(() =>
  import('@/pages/commerce/PaymentsCouponsPage.jsx').then((m) => ({ default: m.CouponsPage }))
);

const TicketsListModule = lazy(() =>
  import('@/pages/support/TicketsPage.jsx').then((m) => ({ default: m.TicketsListPage }))
);
const TicketDetailsModule = lazy(() =>
  import('@/pages/support/TicketsPage.jsx').then((m) => ({ default: m.TicketDetailsPage }))
);

const UsersListModule = lazy(() =>
  import('@/pages/users/UsersPage.jsx').then((m) => ({ default: m.UsersListPage }))
);
const UserDetailsModule = lazy(() =>
  import('@/pages/users/UsersPage.jsx').then((m) => ({ default: m.UserDetailsPage }))
);

const MediaLibraryPage = lazy(() => import('@/pages/media/MediaLibraryPage.jsx'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage.jsx'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage.jsx'));
const EmailTemplatesPage = lazy(() => import('@/pages/settings/EmailTemplatesPage.jsx'));

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage.jsx'));

/* ————— Suspense wrapper ————— */
const withSuspense = (Component, label) => (
  <Suspense fallback={<PageLoader label={label} />}>
    <Component />
  </Suspense>
);

export default function App() {
  return (
    <>
      <Helmet>
        <title>MetlifeDM · Admin console</title>
      </Helmet>
      <Routes>
        {/* Public */}
        <Route path="/login" element={withSuspense(LoginPage, 'Loading sign in')} />
        <Route path="/403" element={withSuspense(ForbiddenPage, 'Loading')} />
        <Route path="/404" element={withSuspense(NotFoundPage, 'Loading')} />

        {/* Protected */}
        <Route
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={withSuspense(DashboardPage, 'Loading dashboard')} />

          {/* Content · Services */}
          <Route path="/content/services" element={withSuspense(ServicesListPage, 'Loading services')} />
          <Route path="/content/services/:id" element={withSuspense(ServiceEditPage, 'Loading service')} />

          {/* Content · Portfolio */}
          <Route path="/content/portfolio" element={withSuspense(PortfolioListPage, 'Loading portfolio')} />
          <Route path="/content/portfolio/:id" element={withSuspense(PortfolioEditPage, 'Loading project')} />

          {/* Content · Case studies */}
          <Route path="/content/case-studies" element={withSuspense(CaseStudiesModule, 'Loading case studies')} />
          <Route path="/content/case-studies/:id" element={withSuspense(CaseStudyEditModule, 'Loading case study')} />

          {/* Content · Industries */}
          <Route path="/content/industries" element={withSuspense(IndustriesListModule, 'Loading industries')} />
          <Route path="/content/industries/:id" element={withSuspense(IndustryEditModule, 'Loading industry')} />

          {/* Content · Blog */}
          <Route path="/content/blog" element={withSuspense(PostsListModule, 'Loading posts')} />
          <Route path="/content/blog/categories" element={withSuspense(CategoriesPage, 'Loading categories')} />
          <Route path="/content/blog/comments" element={withSuspense(CommentsPage, 'Loading comments')} />
          <Route path="/content/blog/:id" element={withSuspense(PostEditModule, 'Loading post')} />

          {/* Content · Others */}
          <Route path="/content/testimonials" element={withSuspense(TestimonialsPage, 'Loading testimonials')} />
          <Route path="/content/faqs" element={withSuspense(FaqsPage, 'Loading FAQs')} />
          <Route path="/content/pages" element={withSuspense(PagesListModule, 'Loading pages')} />
          <Route path="/content/pages/:id" element={withSuspense(PageEditModule, 'Loading page')} />

          {/* Careers */}
          <Route path="/careers/jobs" element={withSuspense(JobsListModule, 'Loading jobs')} />
          <Route path="/careers/jobs/:id" element={withSuspense(JobEditModule, 'Loading job')} />
          <Route path="/careers/applications" element={withSuspense(ApplicationsPage, 'Loading applications')} />

          {/* Leads */}
          <Route path="/leads/contacts" element={withSuspense(ContactsModule, 'Loading contacts')} />
          <Route path="/leads/consultations" element={withSuspense(ConsultationsModule, 'Loading consultations')} />
          <Route path="/leads/subscribers" element={withSuspense(SubscribersModule, 'Loading subscribers')} />

          {/* Commerce */}
          <Route path="/commerce/orders" element={withSuspense(OrdersListModule, 'Loading orders')} />
          <Route path="/commerce/orders/:id" element={withSuspense(OrderDetailsModule, 'Loading order')} />
          <Route path="/commerce/payments" element={withSuspense(PaymentsModule, 'Loading payments')} />
          <Route path="/commerce/coupons" element={withSuspense(CouponsModule, 'Loading coupons')} />

          {/* Support */}
          <Route path="/support/tickets" element={withSuspense(TicketsListModule, 'Loading tickets')} />
          <Route path="/support/tickets/:id" element={withSuspense(TicketDetailsModule, 'Loading ticket')} />

          {/* Users */}
          <Route path="/users" element={withSuspense(UsersListModule, 'Loading users')} />
          <Route path="/users/:id" element={withSuspense(UserDetailsModule, 'Loading user')} />

          {/* Media */}
          <Route path="/media" element={withSuspense(MediaLibraryPage, 'Loading media')} />

          {/* Analytics */}
          <Route path="/analytics" element={withSuspense(AnalyticsPage, 'Loading analytics')} />

          {/* Settings */}
          <Route path="/settings" element={withSuspense(SettingsPage, 'Loading settings')} />
          <Route path="/settings/email-templates" element={withSuspense(EmailTemplatesPage, 'Loading email templates')} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={withSuspense(NotFoundPage, 'Loading')} />
      </Routes>
    </>
  );
}
