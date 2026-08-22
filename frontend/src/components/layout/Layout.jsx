import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AnnouncementBar from './AnnouncementBar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ChatWidget from '@/components/chat/ChatWidget.jsx';
import { usePublicSettings } from '@/providers/PublicSettingsProvider.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const settings = usePublicSettings();
  const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://metlifedm.com').replace(/\/$/, '');
  const address = settings.contact.addresses.find((item) => item.isPrimary) || settings.contact.addresses[0];
  const fallbackOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: settings.business.registeredName,
    url: siteUrl,
    logo: settings.site.logo.startsWith('http') ? settings.site.logo : `${siteUrl}${settings.site.logo}`,
    ...(settings.business.established && { foundingDate: String(settings.business.established) }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: [address.line1, address.line2].filter(Boolean).join(', '),
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.zip,
        addressCountry: address.country || 'US',
      },
    }),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: settings.contact.supportEmail,
      ...(settings.contact.phone && { telephone: settings.contact.phone }),
      areaServed: 'US',
    },
    sameAs: Object.values(settings.social).filter(Boolean),
  };
  const organizationJsonLd = settings.seo.organizationSchema || fallbackOrganization;
  const serializedOrganization = JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Helmet>
        <script type="application/ld+json">{serializedOrganization}</script>
      </Helmet>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {settings.features.chatbotEnabled && import.meta.env.VITE_ENABLE_CHAT !== 'false' && <ChatWidget />}
    </div>
  );
}
