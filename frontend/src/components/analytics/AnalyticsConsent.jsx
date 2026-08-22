import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { cookieDeletionTargets } from '@/utils/consent.js';
import { usePublicSettings } from '@/providers/PublicSettingsProvider.jsx';

const loadScript = (id, src) => {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const deleteCookiesMatching = (pattern) => {
  const targets = cookieDeletionTargets({
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    siteUrl: import.meta.env.VITE_SITE_URL || 'https://metlifedm.com',
  });
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0].trim();
    if (!pattern.test(name)) return;
    targets.forEach(({ domain, path }) => {
      const attributes = [
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'Max-Age=0',
        `Path=${path}`,
        'SameSite=Lax',
      ];
      if (domain) attributes.push(`Domain=${domain}`);
      document.cookie = `${name}=;${attributes.join(';')}`;
    });
  });
};

export default function AnalyticsConsent() {
  const settings = usePublicSettings();
  const preferences = useSelector((state) => state.ui.cookiePreferences);
  const { pathname, search } = useLocation();
  const initializedGa = useRef(false);
  const initializedMeta = useRef(false);
  const gaId = settings.analytics.ga4Id;
  const metaPixelId = settings.analytics.metaPixelId;

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
  }, []);

  useEffect(() => {
    const analyticsAllowed = preferences?.analytics === true;
    const marketingAllowed = preferences?.marketing === true;

    window.gtag?.('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
      ad_storage: marketingAllowed ? 'granted' : 'denied',
      ad_user_data: marketingAllowed ? 'granted' : 'denied',
      ad_personalization: marketingAllowed ? 'granted' : 'denied',
    });

    if (analyticsAllowed && gaId) {
      loadScript('metlifedm-ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
      if (initializedGa.current !== gaId) {
        window.gtag('js', new Date());
        window.gtag('config', gaId, { anonymize_ip: true, send_page_view: false });
        initializedGa.current = gaId;
      }
      window.gtag('event', 'page_view', {
        page_path: `${pathname}${search}`,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    if (marketingAllowed && metaPixelId) {
      if (!window.fbq) {
        const fbq = function metaPixelQueue() {
          if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
          else fbq.queue.push(arguments);
        };
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = '2.0';
        fbq.queue = [];
        window.fbq = fbq;
        window._fbq = fbq;
      }
      loadScript('metlifedm-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
      if (initializedMeta.current !== metaPixelId) {
        window.fbq('init', metaPixelId);
        initializedMeta.current = metaPixelId;
      }
      window.fbq('consent', 'grant');
      window.fbq('track', 'PageView');
    } else {
      window.fbq?.('consent', 'revoke');
    }

    if (!analyticsAllowed) deleteCookiesMatching(/^(_ga|_gid|_gat)/);
    if (!marketingAllowed) deleteCookiesMatching(/^(_fbp|_fbc)/);
  }, [preferences, gaId, metaPixelId, pathname, search]);

  return null;
}
