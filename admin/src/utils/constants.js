export const SITE = {
  name: 'MetlifeDM',
  legalName: 'MetlifeDM LLC',
  publicUrl: import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/* ————— Roles ————— */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
  EDITOR: 'editor',
  SUPPORT: 'support',
  CUSTOMER: 'customer',
};

export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
  ROLES.EDITOR,
  ROLES.SUPPORT,
];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  editor: 'Editor',
  support: 'Support',
  customer: 'Customer',
};

/* ————— Navigation ————— */
export const NAV_SECTIONS = [
  {
    section: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    section: 'Content',
    items: [
      { label: 'Services', href: '/content/services', icon: 'Layers' },
      { label: 'Portfolio', href: '/content/portfolio', icon: 'FolderOpen' },
      { label: 'Case studies', href: '/content/case-studies', icon: 'BookOpen' },
      { label: 'Industries', href: '/content/industries', icon: 'Building2' },
      { label: 'Blog', href: '/content/blog', icon: 'FileText' },
      { label: 'Testimonials', href: '/content/testimonials', icon: 'Quote' },
      { label: 'FAQs', href: '/content/faqs', icon: 'HelpCircle' },
      { label: 'Pages', href: '/content/pages', icon: 'File' },
    ],
  },
  {
    section: 'Careers',
    items: [
      { label: 'Job openings', href: '/careers/jobs', icon: 'Briefcase' },
      { label: 'Applications', href: '/careers/applications', icon: 'FileCheck' },
    ],
  },
  {
    section: 'Leads',
    items: [
      { label: 'Contact forms', href: '/leads/contacts', icon: 'Mail' },
      { label: 'Consultations', href: '/leads/consultations', icon: 'Calendar' },
      { label: 'Newsletter', href: '/leads/subscribers', icon: 'MailPlus' },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Orders', href: '/commerce/orders', icon: 'ShoppingBag' },
      { label: 'Payments', href: '/commerce/payments', icon: 'CreditCard' },
      { label: 'Coupons', href: '/commerce/coupons', icon: 'Tag' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Support tickets', href: '/support/tickets', icon: 'LifeBuoy' },
      { label: 'Users', href: '/users', icon: 'Users' },
      { label: 'Media library', href: '/media', icon: 'Image' },
    ],
  },
  {
    section: 'Insights',
    items: [{ label: 'Analytics', href: '/analytics', icon: 'BarChart3' }],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: 'Settings' },
      { label: 'Email templates', href: '/settings/email-templates', icon: 'MailCheck' },
    ],
  },
];

/* ————— Status option sets ————— */
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const CONTACT_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
  { value: 'spam', label: 'Spam' },
];

export const CONSULTATION_STATUSES = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No show' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

export const POST_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

/* ————— Service categories (matches backend) ————— */
export const SERVICE_CATEGORIES = [
  { value: 'seo', label: 'SEO', icon: '🔍' },
  { value: 'ppc', label: 'PPC', icon: '📊' },
  { value: 'social_media', label: 'Social media', icon: '💬' },
  { value: 'content_marketing', label: 'Content', icon: '✏️' },
  { value: 'email_marketing', label: 'Email', icon: '📧' },
  { value: 'web_development', label: 'Web dev', icon: '💻' },
  { value: 'branding', label: 'Branding', icon: '🎨' },
  { value: 'analytics', label: 'Analytics', icon: '📈' },
  { value: 'consulting', label: 'Consulting', icon: '🧭' },
  { value: 'video_marketing', label: 'Video', icon: '🎬' },
];

export const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];
