import mongoose from 'mongoose';
import { config } from '../config/index.js';
import connectDatabase, { disconnectDatabase } from '../config/database.js';
import logger from '../config/logger.js';
import {
  User, Service, Settings, FAQ, Testimonial, Industry, Portfolio, CaseStudy, EmailTemplate, BlogCategory,
} from '../models/index.js';
import { USER_ROLES, USER_STATUS } from '../utils/constants.js';

const upsert = async (Model, filter, doc) => {
  const existing = await Model.findOne(filter);
  if (existing) {
    logger.info(`↔  ${Model.modelName} exists: ${JSON.stringify(filter)}`);
    return existing;
  }
  const created = await Model.create(doc);
  logger.info(`✓  ${Model.modelName} created`);
  return created;
};

const seedSuperAdmin = async () => {
  const email = config.seed.superAdminEmail;
  const password = config.seed.superAdminPassword;
  if (!email || !password) {
    logger.warn('⚠️  SEED_SUPER_ADMIN_EMAIL / _PASSWORD not set — skipping super admin');
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`↔  Super admin already exists: ${email}`);
    return existing;
  }
  const admin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email,
    password,
    role: USER_ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });
  logger.info(`✓  Super admin created: ${email}`);
  return admin;
};

const seedSettings = async () =>
  upsert(Settings, { key: 'global' }, {
    key: 'global',
    site: {
      name: 'MetlifeDM LLC',
      tagline: 'Enterprise Digital Marketing for USA Businesses',
      description: 'Full-service digital marketing agency helping US brands scale through SEO, PPC, content, and AI.',
    },
    contact: {
      email: 'hello@metlifedm.com',
      supportEmail: 'support@metlifedm.com',
      salesEmail: 'sales@metlifedm.com',
      phone: '+1 (800) 555-0199',
      officeHours: 'Mon-Fri 9AM-6PM EST',
    },
    homepage: {
      hero: {
        eyebrow: 'Digital Marketing Excellence',
        title: 'Scale Your Business with Data-Driven Growth',
        subtitle: 'Trusted by 200+ USA businesses to deliver measurable ROI through SEO, paid media, and AI-powered marketing.',
        ctaPrimary: { label: 'Get Free Audit', url: '/consultation' },
        ctaSecondary: { label: 'View Case Studies', url: '/case-studies' },
      },
      stats: [
        { label: 'US clients served', value: '200', suffix: '+' },
        { label: 'Avg ROI increase', value: '312', suffix: '%' },
        { label: 'Team members', value: '45', suffix: '' },
        { label: 'Years of experience', value: '12', suffix: '+' },
      ],
    },
  });

const seedServices = async () => {
  const services = [
    {
      title: 'Enterprise SEO',
      shortDescription: 'Dominate Google with data-driven SEO strategies designed for US businesses.',
      description: 'Full-funnel SEO covering technical audits, content strategy, link building, and CRO — engineered for measurable ranking growth in competitive US markets.',
      category: 'seo',
      startingPrice: 2500,
      icon: '🚀',
      isFeatured: true,
      isPublished: true,
      pricingPlans: [
        { name: 'Starter', price: 2500, billingCycle: 'monthly', features: [{ label: 'Technical audit', included: true }, { label: '10 target keywords', included: true }, { label: 'Monthly reports', included: true }] },
        { name: 'Growth', price: 5000, billingCycle: 'monthly', isPopular: true, features: [{ label: '30 target keywords', included: true }, { label: 'Content strategy', included: true }, { label: 'Link building', included: true }, { label: 'Weekly reports', included: true }] },
        { name: 'Enterprise', price: 12000, billingCycle: 'monthly', features: [{ label: 'Unlimited keywords', included: true }, { label: 'Dedicated strategist', included: true }, { label: 'Custom dashboards', included: true }] },
      ],
    },
    {
      title: 'Google Ads Management',
      shortDescription: 'Data-driven PPC campaigns that turn ad spend into revenue.',
      description: 'Full-funnel Google Ads management: search, display, shopping, YouTube, Performance Max — with dedicated strategists optimizing daily for ROAS.',
      category: 'ppc',
      startingPrice: 1500,
      icon: '💰',
      isFeatured: true,
      isPublished: true,
    },
    {
      title: 'Social Media Marketing',
      shortDescription: 'Grow your brand on Instagram, TikTok, LinkedIn, and Facebook.',
      description: 'End-to-end social media management with content creation, community engagement, paid social, and influencer partnerships.',
      category: 'social_media',
      startingPrice: 1800,
      icon: '📱',
      isPublished: true,
    },
    {
      title: 'Custom Web Development',
      shortDescription: 'High-performance websites built with React, Next.js, and modern stacks.',
      description: 'Fast, accessible, SEO-optimized websites and web applications with modern React/Next.js stacks — designed for conversions.',
      category: 'web_development',
      startingPrice: 8000,
      icon: '💻',
      isPublished: true,
    },
    {
      title: 'AI Marketing Solutions',
      shortDescription: 'Deploy AI-powered chatbots, personalization, and predictive analytics.',
      description: 'Leverage AI to automate customer engagement, personalize journeys, and predict buying behavior.',
      category: 'ai_solutions',
      startingPrice: 3500,
      icon: '🤖',
      isFeatured: true,
      isPublished: true,
    },
  ];

  for (const svc of services) {
    await upsert(Service, { title: svc.title }, svc);
  }
};

const seedIndustries = async () => {
  const industries = [
    { name: 'E-Commerce', shortDescription: 'Scale online stores with SEO, PPC, and CRO built for D2C brands.', icon: '🛒' },
    { name: 'SaaS', shortDescription: 'Growth marketing for SaaS: content, SEO, product-led growth, and paid.', icon: '☁️' },
    { name: 'Healthcare', shortDescription: 'HIPAA-aware marketing for clinics, telehealth, and health brands.', icon: '⚕️' },
    { name: 'Real Estate', shortDescription: 'Local SEO, IDX websites, and lead-gen for realtors and brokerages.', icon: '🏡' },
    { name: 'Legal Services', shortDescription: 'Ethical marketing for law firms — SEO, content, and PPC.', icon: '⚖️' },
    { name: 'Financial Services', shortDescription: 'Compliance-friendly marketing for fintech and financial advisors.', icon: '💵' },
  ];
  for (const i of industries) await upsert(Industry, { name: i.name }, { ...i, isPublished: true });
};

const seedFAQs = async () => {
  const faqs = [
    { question: 'How long until I see results?', answer: 'SEO typically shows results in 3-6 months; paid ads can deliver same-week traffic and leads.', category: 'general', order: 20 },
    { question: 'Do you sign contracts?', answer: 'We offer month-to-month agreements as well as 6/12-month options with discounted rates.', category: 'payment', order: 21 },
    { question: 'Are you based in the USA?', answer: 'Yes! MetlifeDM LLC is a US-registered agency with team members across North America.', category: 'general', order: 22 },
    { question: 'Do you offer white-label services?', answer: 'Yes, we partner with agencies looking to white-label our SEO, PPC, and content services.', category: 'services', order: 23 },
    { question: 'What industries do you specialize in?', answer: 'E-commerce, SaaS, healthcare, real estate, legal, and financial services — but we work across most B2B and B2C niches.', category: 'services', order: 24 },
    {
      question: "What's the Big Deal with Digital Marketing in 2025?",
      answer: "Buckle up—digital marketing is your ticket to explosive growth! In today's fast-paced, screen-obsessed world, it's how you connect with millions, skyrocket your brand, and turn clicks into cash. From social media dominance to SEO wizardry, we've got the tools to make your business unstoppable!",
      category: 'general', isFeatured: true, order: 1,
    },
    {
      question: 'Why Should I Choose Your Agency Over the Competition?',
      answer: "Because we're not just marketers—we're growth hackers on a mission! Based right here in the USA, we live and breathe the latest trends, cutting-edge tech, and bold strategies that deliver jaw-dropping results. No fluff, no excuses—just pure, high-octane success tailored to YOU!",
      category: 'general', isFeatured: true, order: 2,
    },
    {
      question: 'How Fast Can I See Results from Digital Marketing?',
      answer: "Hold onto your hat—results can start rolling in FAST! With PPC ads, you could see clicks in hours. SEO and content? Think weeks to months for that sweet, long-term dominance. We hustle hard to get you ROI at lightning speed—let's talk timelines!",
      category: 'process', isFeatured: true, order: 3,
    },
    {
      question: 'What Services Do You Offer to Crush It Online?',
      answer: "We're your one-stop shop for digital dominance! SEO that climbs the ranks, PPC that packs a punch, social media that stops the scroll, content that converts, and web design that wows. Ready to unleash the full arsenal? Let's do this!",
      category: 'services', isFeatured: true, order: 4,
    },
    {
      question: 'How Much Does Digital Marketing Cost?',
      answer: "No cookie-cutter pricing here—we customize the firepower to fit your goals! Whether you're a small biz ready to rumble or a big player aiming to reign supreme, we've got plans from budget-friendly to all-out blitz. Hit us up for a free quote and let's ignite your budget!",
      category: 'pricing', isFeatured: true, order: 5,
    },
    {
      question: "Can You Guarantee I'll Hit #1 on Google?",
      answer: 'We\'re bold, not magicians! Google\'s a wild beast, but we\'ve got the skills to tame it with killer SEO, epic content, and relentless optimization—we\'ll push you to the top faster than you can say "search engine supremacy." Let\'s get climbing!',
      category: 'seo', isFeatured: true, order: 6,
    },
    {
      question: 'How Do You Keep Up with Crazy Digital Trends?',
      answer: "We're trendsetters, not followers! Our team's plugged into the pulse of the world wide digital scene—think AI-powered ads, TikTok takeovers, and algorithm updates. We don't just keep up; we stay ahead so your brand's always the one to watch!",
      category: 'general', order: 25,
    },
    {
      question: 'Will Social Media Really Boost My Business?',
      answer: "Heck yes! Social's where the party's at—billions of users, endless opportunities. We'll craft scroll-stopping posts, viral campaigns, and targeted ads that turn likes into loyal customers. Ready to blow up your follower count? Let's roll!",
      category: 'services', order: 26,
    },
    {
      question: "What's the Secret Sauce to Winning at Digital Marketing?",
      answer: "It's no secret—it's strategy, grit, and a dash of creativity! We mix data-driven insights with bold ideas to create campaigns that hit hard and stick. Your success? That's our obsession—let's cook up something legendary!",
      category: 'general', order: 27,
    },
    {
      question: 'How Do I Get Started with You Rockstars?',
      answer: "Easy—let's kick things into high gear! Drop us a line, grab a free consultation, and watch us turn your vision into a digital powerhouse. No delays, no excuses—just pure marketing adrenaline. Ready?",
      category: 'support', order: 28,
    },
  ];
  for (const f of faqs) await upsert(FAQ, { question: f.question }, { ...f, isPublished: true });
};

const seedTestimonials = async () => {
  const testimonials = [
    { authorName: 'Sarah Mitchell', authorTitle: 'CEO', authorCompany: 'Wellness Co', rating: 5, quote: 'MetlifeDM tripled our organic traffic in 8 months. Their SEO team is world-class.', isFeatured: true, isPublished: true },
    { authorName: 'David Chen', authorTitle: 'Marketing Director', authorCompany: 'ShopTrend', rating: 5, quote: 'Our ROAS jumped from 2.1x to 6.4x within 3 months. Best PPC partner we\'ve ever hired.', isFeatured: true, isPublished: true },
    { authorName: 'Amanda Rodriguez', authorTitle: 'Founder', authorCompany: 'FinPath Advisors', rating: 5, quote: 'Their content strategy positioned us as thought leaders in fintech. Lead quality is off the charts.', isFeatured: true, isPublished: true },
  ];
  for (const t of testimonials) await upsert(Testimonial, { authorName: t.authorName, authorCompany: t.authorCompany }, t);
};

const seedBlogCategories = async () => {
  const cats = [
    { name: 'SEO', color: '#1E40AF', icon: '🔍' },
    { name: 'PPC & Paid Media', color: '#DC2626', icon: '💰' },
    { name: 'Content Marketing', color: '#059669', icon: '📝' },
    { name: 'Social Media', color: '#7C3AED', icon: '📱' },
    { name: 'Growth Strategy', color: '#EA580C', icon: '📈' },
    { name: 'AI & Marketing', color: '#0891B2', icon: '🤖' },
  ];
  for (const c of cats) await upsert(BlogCategory, { name: c.name }, c);
};

const seedEmailTemplates = async () => {
  const templates = [
    { key: 'WELCOME_EMAIL', name: 'Welcome Email', category: 'auth', subject: 'Welcome to MetlifeDM 👋', html: '<h1>Welcome {{firstName}}!</h1>', isSystem: true },
    { key: 'EMAIL_VERIFICATION', name: 'Email Verification', category: 'auth', subject: 'Verify your email', html: '<a href="{{verifyUrl}}">Verify</a>', isSystem: true },
    { key: 'PASSWORD_RESET', name: 'Password Reset', category: 'auth', subject: 'Reset your password', html: '<a href="{{resetUrl}}">Reset</a>', isSystem: true },
    { key: 'ORDER_CONFIRMATION', name: 'Order Confirmation', category: 'order', subject: 'Order {{orderNumber}} confirmed', html: '<p>Thanks for your order!</p>', isSystem: true },
    { key: 'PAYMENT_RECEIPT', name: 'Payment Receipt', category: 'payment', subject: 'Receipt {{invoiceNumber}}', html: '<p>Payment received</p>', isSystem: true },
    { key: 'CONSULTATION_CONFIRMED', name: 'Consultation Confirmed', category: 'consultation', subject: 'Your consultation is confirmed', html: '<p>See you soon!</p>', isSystem: true },
    { key: 'TICKET_CREATED', name: 'Ticket Created', category: 'ticket', subject: 'Ticket {{ticketNumber}}', html: '<p>Ticket opened</p>', isSystem: true },
    { key: 'NEWSLETTER_WELCOME', name: 'Newsletter Welcome', category: 'marketing', subject: 'Welcome to our newsletter', html: '<p>You\'re in!</p>', isSystem: true },
  ];
  for (const t of templates) await upsert(EmailTemplate, { key: t.key }, t);
};

const run = async () => {
  logger.info('🌱  Starting database seeder...');
  await connectDatabase();

  try {
    await seedSuperAdmin();
    await seedSettings();
    await seedServices();
    await seedIndustries();
    await seedFAQs();
    await seedTestimonials();
    await seedBlogCategories();
    await seedEmailTemplates();
    logger.info('🎉  Seeder complete');
  } catch (err) {
    logger.error(`Seeder failed: ${err.message}`);
    logger.error(err.stack);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

run();
