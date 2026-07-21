export const SITE = {
  name: 'MetlifeDM',
  legalName: 'MetlifeDM LLC',
  tagline: 'Digital marketing excellence for USA businesses',
  founded: 2024,
  city: 'Miami, FL',
};

export const NAV_MAIN = [
  { label: 'Services', href: '/services' },
  { label: 'Industries', href: '/industries' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
];

export const NAV_FOOTER = [
  {
    title: 'Services',
    links: [
      { label: 'SEO', href: '/services?category=seo' },
      { label: 'Google Ads', href: '/services?category=ppc' },
      { label: 'Social Media', href: '/services?category=social_media' },
      { label: 'Content Marketing', href: '/services?category=content_marketing' },
      { label: 'Web Development', href: '/services?category=web_development' },
      { label: 'AI Solutions', href: '/services?category=ai_solutions' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Book a Call', href: '/consultation' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Testimonials', href: '/testimonials' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Industries', href: '/industries' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
];

export const SERVICE_CATEGORIES = [
  { value: 'seo', label: 'SEO', icon: '🔍' },
  { value: 'ppc', label: 'Google Ads', icon: '💰' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'local_seo', label: 'Local SEO', icon: '📍' },
  { value: 'web_development', label: 'Web Development', icon: '💻' },
  { value: 'branding', label: 'Branding', icon: '🎨' },
  { value: 'content_marketing', label: 'Content Marketing', icon: '✍️' },
  { value: 'email_marketing', label: 'Email Marketing', icon: '📧' },
  { value: 'video_marketing', label: 'Video Marketing', icon: '🎥' },
  { value: 'analytics', label: 'Analytics', icon: '📊' },
  { value: 'ai_solutions', label: 'AI Solutions', icon: '🤖' },
];

export const BUDGET_OPTIONS = [
  { value: '<5k', label: 'Less than $5,000' },
  { value: '5k-10k', label: '$5,000 – $10,000' },
  { value: '10k-25k', label: '$10,000 – $25,000' },
  { value: '25k-50k', label: '$25,000 – $50,000' },
  { value: '50k-100k', label: '$50,000 – $100,000' },
  { value: '100k+', label: '$100,000+' },
  { value: 'undecided', label: 'Not sure yet' },
];

export const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: '1-3_months', label: '1 – 3 months' },
  { value: '3-6_months', label: '3 – 6 months' },
  { value: 'exploring', label: 'Just exploring' },
];

/* Ticker copy (design signature) */
export const TICKER_ITEMS = SERVICE_CATEGORIES.map((s) => s.label);
