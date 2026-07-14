import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AnnouncementBar from './AnnouncementBar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import CookieBanner from './CookieBanner.jsx';
import ChatWidget from '@/components/chat/ChatWidget.jsx';

// Sitewide Organization schema — renders on every page so search engines
// can resolve the MetlifeDM entity regardless of which page they land on.
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://metlifedm.com/#organization',
  name: 'MetlifeDM LLC',
  url: 'https://metlifedm.com',
  logo: 'https://metlifedm.com/logo.png',
  foundingDate: '2013',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Miami',
    addressRegion: 'FL',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-800-555-0199',
    contactType: 'customer service',
    email: 'hello@metlifedm.com',
    areaServed: 'US',
  },
  sameAs: [
    'https://twitter.com/metlifedm',
    'https://linkedin.com/company/metlifedm',
    'https://instagram.com/metlifedm',
    'https://facebook.com/metlifedm',
    'https://youtube.com/@metlifedm',
  ],
};

export default function Layout() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ORGANIZATION_JSON_LD)}</script>
      </Helmet>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
      <ChatWidget />
    </div>
  );
}
