import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'MetlifeDM LLC API',
    version: '1.0.0',
    description: 'Enterprise digital marketing agency backend — MetlifeDM LLC.',
    contact: { name: 'MetlifeDM Engineering', email: 'engineering@metlifedm.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: `http://localhost:${config.server.port}${config.server.apiPrefix}/${config.server.apiVersion}`, description: 'Local' },
    { url: `https://api.metlifedm.com${config.server.apiPrefix}/${config.server.apiVersion}`, description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'metlife_rt' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          data: {},
          meta: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          code: { type: 'string' },
          errors: { type: 'array', items: {} },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Users', description: 'User profile & admin user management' },
    { name: 'Services', description: 'Marketing services catalog' },
    { name: 'Orders', description: 'Order & checkout flow' },
    { name: 'Payments', description: 'Payments & invoices (Stripe)' },
    { name: 'Coupons', description: 'Discount coupons' },
    { name: 'Blog', description: 'Blog posts & categories' },
    { name: 'Portfolio', description: 'Case studies & portfolio' },
    { name: 'Content', description: 'Industries, testimonials, FAQs' },
    { name: 'Leads', description: 'Contact, consultation, newsletter, careers' },
    { name: 'Chat', description: 'AI-powered live chat + handoff' },
    { name: 'Tickets', description: 'Support tickets' },
    { name: 'Media', description: 'Cloudinary media library' },
    { name: 'Settings', description: 'Global site settings' },
    { name: 'Pages', description: 'CMS pages' },
    { name: 'SEO', description: 'Sitemap, robots.txt, redirects' },
    { name: 'Admin', description: 'Admin dashboard analytics' },
    { name: 'Notifications', description: 'User notifications' },
  ],
};

// jsdoc-annotated routes could be added later; for now the spec above lists the shape of the API
const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
});

export default swaggerSpec;
