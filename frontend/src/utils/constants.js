export const SITE = {
  name: 'MetlifeDM',
  legalName: 'MetlifeDM LLC',
  tagline: 'Digital marketing excellence for USA businesses',
  founded: 2024,
  city: 'Miami, FL',
};

/**
 * Header nav. A plain entry ({label, href}) renders as a top-level link.
 * An entry with `items` renders as a dropdown/mega-menu on desktop and an
 * expandable accordion group on mobile — see Navbar.jsx. Icon names are
 * strings (not components) so this file stays framework-agnostic; Navbar.jsx
 * resolves them against its own lucide-react icon map.
 */
export const NAV_MAIN = [
  { label: 'Services', href: '/services' },
  {
    label: 'Solutions',
    items: [
      { label: 'Growth Solutions', href: '/growth-solutions', desc: 'Our main growth plans', icon: 'TrendingUp' },
      { label: 'SEO & Search Growth', href: '/seo', desc: 'Search-growth plans & diagnostic', icon: 'Search' },
      { label: 'Google Ads & Paid Growth', href: '/google-ads', desc: 'Paid-growth plans & diagnostic', icon: 'Target' },
      { label: 'Social Growth', href: '/social-growth', desc: 'Audience-growth plans & diagnostic', icon: 'MessageCircle' },
      { label: 'Customer Service', href: '/customer-service', desc: 'Support systems built around you', icon: 'Headphones' },
      { label: 'Projects', href: '/projects', desc: 'Build it once, build it right', icon: 'Hammer' },
      { label: 'Pricing', href: '/pricing', desc: 'Full pricing reference', icon: 'Receipt' },
    ],
  },
  {
    label: 'Diagnostics',
    items: [
      { label: 'The Diagnostic', href: '/diagnostic', desc: "Find what's actually wrong", icon: 'Activity' },
      { label: 'PASCO™', href: '/pasco', desc: 'Business continuity & recovery', icon: 'LifeBuoy' },
      { label: 'Control™', href: '/control', desc: 'Digital asset intelligence', icon: 'ShieldCheck', badge: 'Preview' },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Portfolio', href: '/portfolio', desc: 'Recent builds', icon: 'LayoutTemplate' },
      { label: 'Case Studies', href: '/case-studies', desc: 'Real results, in depth', icon: 'FileText' },
      { label: 'Industries', href: '/industries', desc: 'Outcomes by vertical', icon: 'Building2' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'About', href: '/about', desc: 'Who we are', icon: 'Users' },
      { label: 'Agency Partners', href: '/partners', desc: 'White-label delivery & partnership for agencies', icon: 'Handshake' },
      { label: 'Blog', href: '/blog', desc: 'Ideas & updates', icon: 'Newspaper' },
      { label: 'Careers', href: '/careers', desc: 'Join the team', icon: 'Briefcase' },
      { label: 'Testimonials', href: '/testimonials', desc: 'What clients say', icon: 'Quote' },
      { label: 'FAQ', href: '/faq', desc: 'Common questions', icon: 'HelpCircle' },
      { label: 'Contact', href: '/contact', desc: 'Get in touch', icon: 'Mail' },
    ],
  },
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
      { label: 'Customer Service', href: '/customer-service' },
      { label: 'The Diagnostic', href: '/diagnostic' },
      { label: 'PASCO', href: '/pasco' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'White-Label Partners', href: '/partners' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Book a Call', href: '/consultation' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Pricing', href: '/pricing' },
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
