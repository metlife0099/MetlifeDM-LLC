import mongoose from 'mongoose';

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    // Singleton flag — always ensure only one doc exists
    key: { type: String, default: 'global', unique: true, immutable: true },

    // Site identity
    site: {
      name: { type: String, default: 'MetlifeDM LLC' },
      tagline: { type: String, default: 'Enterprise Digital Marketing for USA Businesses' },
      description: String,
      logo: { url: String, publicId: String },
      logoDark: { url: String, publicId: String },
      favicon: { url: String, publicId: String },
      ogImage: { url: String, publicId: String },
    },

    // Contact / office
    contact: {
      email: { type: String, default: 'hello@metlifedm.com' },
      supportEmail: { type: String, default: 'support@metlifedm.com' },
      salesEmail: { type: String, default: 'sales@metlifedm.com' },
      phone: String,
      whatsapp: String,
      officeHours: String,
      addresses: [
        {
          label: String,
          line1: String,
          line2: String,
          city: String,
          state: String,
          zip: String,
          country: { type: String, default: 'US' },
          mapUrl: String,
          latitude: Number,
          longitude: Number,
          isPrimary: { type: Boolean, default: false },
        },
      ],
    },

    // Social
    social: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
      tiktok: String,
      pinterest: String,
      dribbble: String,
      behance: String,
    },

    // Legal / business
    business: {
      registeredName: { type: String, default: 'MetlifeDM LLC' },
      ein: String,
      established: Number,
    },

    // Analytics IDs
    analytics: {
      ga4Id: String,
      gtmId: String,
      metaPixelId: String,
      linkedinInsightId: String,
      hotjarId: String,
      microsoftClarityId: String,
      searchConsoleCode: String,
      bingWebmasterCode: String,
    },

    // SEO defaults
    seo: {
      defaultMetaTitle: String,
      defaultMetaDescription: String,
      defaultKeywords: [String],
      defaultOgImage: String,
      twitterHandle: String,
      robotsTxt: {
        type: String,
        default: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api',
      },
      organizationSchema: Schema.Types.Mixed,
      localBusinessSchema: Schema.Types.Mixed,
    },

    // Theme / branding
    theme: {
      primaryColor: { type: String, default: '#0F172A' },      // dark navy
      secondaryColor: { type: String, default: '#1E40AF' },    // royal blue
      accentColor: { type: String, default: '#06B6D4' },       // cyan
      surfaceColor: { type: String, default: '#F8FAFC' },
      fontHeading: { type: String, default: 'Inter' },
      fontBody: { type: String, default: 'Inter' },
    },

    // Feature flags
    features: {
      chatbotEnabled: { type: Boolean, default: true },
      newsletterEnabled: { type: Boolean, default: true },
      consultationEnabled: { type: Boolean, default: true },
      blogCommentsEnabled: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: String,
    },

    // Homepage builder
    homepage: {
      hero: {
        eyebrow: String,
        title: String,
        subtitle: String,
        ctaPrimary: { label: String, url: String },
        ctaSecondary: { label: String, url: String },
        backgroundVideo: String,
        lottieUrl: String,
      },
      trustedBy: {
        title: { type: String, default: 'Trusted by 200+ US brands' },
        logos: [{ name: String, url: String, publicId: String, link: String }],
      },
      stats: [{ label: String, value: String, suffix: String, icon: String }],
      cta: {
        title: String,
        subtitle: String,
        buttonLabel: String,
        buttonUrl: String,
      },
    },

    // Footer
    footer: {
      about: String,
      copyright: { type: String, default: '© 2025 MetlifeDM LLC. All rights reserved.' },
      newsletterTitle: String,
      newsletterSubtitle: String,
      badges: [{ image: String, url: String }],
      columns: [
        {
          title: String,
          links: [{ label: String, url: String }],
        },
      ],
    },

    // Chatbot
    chatbot: {
      welcomeMessage: {
        type: String,
        default: "Hi 👋 I'm MetlifeDM's AI assistant — how can I help you grow your business today?",
      },
      offlineMessage: String,
      systemPrompt: String,
      suggestedQuestions: [String],
      handoffMessage: {
        type: String,
        default: "Let me connect you with a human specialist. Please share your email so we can follow up.",
      },
    },

    // Notifications
    notifications: {
      adminEmails: [String],
      slackWebhook: String,
    },

    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Static: get the single settings document (or create it)
settingsSchema.statics.getGlobal = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
