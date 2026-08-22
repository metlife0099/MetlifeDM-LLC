import { getBrowserStorage, readJsonStorage, writeJsonStorage } from './storage.js';

export const CONSENT_STORAGE_KEY = 'mdm_cookie_preferences';
export const CONSENT_VERSION = 1;

const PUBLIC_SUFFIXES = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil',
  'co.uk', 'org.uk', 'com.au', 'co.nz', 'co.in',
]);

const safeDomain = (value) => {
  const domain = String(value || '').replace(/^\./, '').toLowerCase();
  if (!domain.includes('.') || PUBLIC_SUFFIXES.has(domain) || /^\d+(?:\.\d+){3}$/.test(domain)) return null;
  return domain;
};

export const cookieDeletionTargets = ({ hostname, pathname = '/', siteUrl }) => {
  const currentHost = safeDomain(hostname);
  let configuredApex = null;
  try {
    configuredApex = safeDomain(new URL(siteUrl).hostname);
  } catch {
    configuredApex = null;
  }

  // Only use the configured apex when it actually owns the current host. We
  // never derive arbitrary parent domains, which avoids touching public suffixes.
  if (configuredApex && currentHost
    && currentHost !== configuredApex
    && !currentHost.endsWith(`.${configuredApex}`)) {
    configuredApex = null;
  }

  const domains = new Set([null]);
  [currentHost, configuredApex].filter(Boolean).forEach((domain) => {
    domains.add(domain);
    domains.add(`.${domain}`);
  });

  const paths = new Set(['/']);
  const segments = String(pathname).split('/').filter(Boolean);
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    paths.add(currentPath);
  }

  return [...domains].flatMap((domain) => (
    [...paths].map((cookiePath) => ({ domain, path: cookiePath }))
  ));
};

export const normalizeConsent = (value) => {
  if (!value || value.version !== CONSENT_VERSION) return null;
  return {
    version: CONSENT_VERSION,
    essential: true,
    analytics: value.analytics === true,
    marketing: value.marketing === true,
    updatedAt: value.updatedAt || null,
  };
};

export const readConsent = () =>
  normalizeConsent(readJsonStorage(getBrowserStorage(), CONSENT_STORAGE_KEY, null));

export const saveConsent = (preferences) => {
  const value = {
    version: CONSENT_VERSION,
    essential: true,
    analytics: preferences.analytics === true,
    marketing: preferences.marketing === true,
    updatedAt: new Date().toISOString(),
  };
  writeJsonStorage(getBrowserStorage(), CONSENT_STORAGE_KEY, value);
  return value;
};
