export const SITE = {
  name: 'MetlifeDM',
  legalName: 'MetlifeDM LLC',
  publicUrl: import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/* ————— Roles ————— */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
};

export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

// Managers cannot enter the /admin console, but the ticket API allows admins
// to assign support work to active managers as well as other administrators.
export const SUPPORT_STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
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
      { label: 'White-label partners', href: '/leads/partners', icon: 'Handshake' },
      { label: 'Pricing enquiries', href: '/leads/pricing-enquiries', icon: 'DollarSign' },
      { label: 'Newsletter', href: '/leads/subscribers', icon: 'MailPlus' },
      { label: 'Campaigns', href: '/leads/campaigns', icon: 'Send' },
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
      { label: 'Live chat', href: '/support/chat', icon: 'MessageCircle' },
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

/* ————— Sidebar nav item → notification resourceType ————— */
export const NAV_NOTIFICATION_TYPES = {
  '/commerce/orders': 'order',
  '/leads/contacts': 'contact',
  '/leads/consultations': 'consultation',
  '/leads/partners': 'partner_inquiry',
  '/leads/pricing-enquiries': 'pricing_enquiry',
  '/leads/subscribers': 'subscriber',
  '/careers/applications': 'application',
  '/support/tickets': 'ticket',
  '/support/chat': 'chat',
  '/users': 'user',
  '/content/blog': 'comment',
};

/* ————— Status option sets ————— */
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
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
  { value: 'normal', label: 'Normal' },
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

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partially sent' },
  { value: 'failed', label: 'Failed' },
];

export const CAMPAIGN_AUDIENCES = [
  { value: 'all', label: 'All active subscribers' },
  { value: 'featured', label: 'Featured subscribers' },
  { value: 'selected', label: 'Selected subscribers' },
];

export const CONSULTATION_STATUSES = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No show' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PARTNER_INQUIRY_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'active_partner', label: 'Active partner' },
  { value: 'not_a_fit', label: 'Not a fit' },
];

export const AGENCY_TYPE_LABELS = {
  marketing_agency: 'Digital Marketing Agency',
  web_design_agency: 'Web Design Agency',
  seo_agency: 'SEO Agency',
  branding_agency: 'Branding Agency',
  software_company: 'Software Company',
  other: 'Other',
};

export const PRICING_ENQUIRY_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'not_a_fit', label: 'Not a fit' },
];

export const INQUIRER_TYPE_LABELS = {
  customer: 'Customer',
  agency: 'Agency',
};

export const APPLICATION_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
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
  { value: 'local_seo', label: 'Local SEO', icon: '📍' },
  { value: 'content_marketing', label: 'Content', icon: '✏️' },
  { value: 'email_marketing', label: 'Email', icon: '📧' },
  { value: 'web_development', label: 'Web dev', icon: '💻' },
  { value: 'branding', label: 'Branding', icon: '🎨' },
  { value: 'analytics', label: 'Analytics', icon: '📈' },
  { value: 'ai_solutions', label: 'AI Solutions', icon: '🤖' },
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
