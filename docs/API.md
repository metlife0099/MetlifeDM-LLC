# API reference

Base URL: `/api/v1`

Interactive Swagger UI at `/api/docs` when the backend is running.

## Conventions

- All responses use the [envelope shape](ARCHITECTURE.md#response-envelope).
- Authentication uses `Authorization: Bearer <accessToken>` for API calls, plus a `httpOnly` refresh token cookie.
- Paginated endpoints accept `?page=1&limit=20&sortBy=field&sortOrder=asc|desc`.
- Search endpoints accept `?search=term`.
- Filter endpoints accept resource-specific query params (e.g. `?status=published`).

Verbs: **GET** read, **POST** create, **PUT/PATCH** update (both accepted), **DELETE** remove.

---

## Authentication

| Method | Path | Purpose |
| :--- | :--- | :--- |
| POST | `/auth/register` | Create a customer account |
| POST | `/auth/login` | Login with email + password (+ 2FA if enabled) |
| POST | `/auth/refresh` | Rotate access token from refresh cookie |
| POST | `/auth/logout` | Invalidate current session |
| POST | `/auth/logout-all` | Invalidate all sessions for user |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/verify-email` | Confirm email with token |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Send password reset link |
| POST | `/auth/reset-password` | Set new password from token |
| POST | `/auth/change-password` | Change password (authenticated) |
| POST | `/auth/2fa/setup` | Generate TOTP secret + QR |
| POST | `/auth/2fa/enable` | Confirm TOTP code and enable 2FA |
| POST | `/auth/2fa/disable` | Disable 2FA (requires code) |

## Users

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/users/me` | user | Current user |
| PATCH | `/users/me` | user | Update own profile |
| DELETE | `/users/me` | user | Delete own account (soft) |

Admin variants (see [Admin routes](#admin-routes)).

## Services

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/services` | public | List published services |
| GET | `/services/:slug` | public | Get one service by slug |
| GET | `/services/categories` | public | List service categories |
| POST | `/services/:id/wishlist` | user | Add to wishlist |
| DELETE | `/services/:id/wishlist` | user | Remove from wishlist |

## Content (Portfolio, Case Studies, Industries)

Same pattern for each resource:

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/portfolio` | List published projects (paginated, filterable) |
| GET | `/portfolio/:slug` | Single project |
| GET | `/case-studies` | List published case studies |
| GET | `/case-studies/:slug` | Single case study |
| GET | `/industries` | List industries |
| GET | `/industries/:slug` | Single industry |

## Blog

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/blog/posts` | Published posts (paginated, `?category=`, `?tag=`, `?search=`) |
| GET | `/blog/posts/:slug` | Single post (increments view count) |
| GET | `/blog/categories` | All categories |
| POST | `/blog/posts/:id/comments` | Submit comment (goes to moderation) |
| POST | `/blog/posts/:id/like` | Like a post |

## Engagement (Testimonials, FAQs)

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/testimonials` | Published testimonials |
| GET | `/faqs` | Published FAQs (`?category=`) |

## Pages (CMS)

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/pages/:slug` | Get a CMS page by slug (e.g. `privacy`, `terms`) |

## Careers

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/careers/jobs` | Open positions |
| GET | `/careers/jobs/:slug` | Single job |
| POST | `/careers/jobs/:id/apply` | Submit application (multipart: resume + fields) |

## Lead capture

| Method | Path | Purpose |
| :--- | :--- | :--- |
| POST | `/contacts` | Submit contact form |
| POST | `/consultations` | Book a consultation |
| POST | `/newsletter/subscribe` | Newsletter opt-in |
| POST | `/newsletter/unsubscribe` | Newsletter opt-out |

## Commerce

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/orders` | user | Create an order (returns Stripe client secret) |
| GET | `/orders/mine` | user | Own order history |
| GET | `/orders/:id` | user/staff | Order detail |
| POST | `/coupons/validate` | user | Validate a coupon code |
| POST | `/payments/create-intent` | user | Create Stripe Payment Intent |
| POST | `/webhooks/stripe` | Stripe | Stripe webhook receiver (raw body) |

## Support tickets

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/tickets` | user | Open a ticket |
| GET | `/tickets/mine` | user | List own tickets |
| GET | `/tickets/:id` | user/staff | Get one (includes messages) |
| POST | `/tickets/:id/messages` | user/staff | Reply to a ticket |
| POST | `/tickets/:id/close` | user | Mark as closed |

## Chat (AI-assisted)

| Method | Path | Purpose |
| :--- | :--- | :--- |
| POST | `/chat/sessions` | Start a chatbot session |
| POST | `/chat/sessions/:id/messages` | Send a message, get AI reply |
| GET | `/chat/sessions/:id` | Retrieve session history |

## Media

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/media/upload` | user | Upload single file (multipart) |
| POST | `/media/signature` | user | Get Cloudinary signed upload params |
| DELETE | `/media/:id` | owner/admin | Delete a file |

## Notifications

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/notifications` | user | List notifications |
| GET | `/notifications/unread-count` | user | Unread badge count |
| PATCH / POST | `/notifications/:id/read` | user | Mark as read |
| PATCH / POST | `/notifications/read-all` | user | Mark all as read |
| DELETE | `/notifications/:id` | user | Delete a notification |

## Settings

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/settings/public` | public | Public site config (contact info, social links) |

## SEO

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/sitemap.xml` | Dynamic XML sitemap of all published content |
| GET | `/robots.txt` | Robots directives + sitemap URL |
| GET | `/redirects/check?from=` | Check if a path has a managed redirect |

---

## Admin routes

Every admin route mounts under `/admin/*` and requires `Authorization: Bearer <token>` with a role of `super_admin`, `admin`, `staff`, `editor`, or `support`.

### Dashboard

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/dashboard/overview?range=30d` | KPIs (revenue, orders, new users, leads) |
| GET | `/admin/dashboard/revenue?range=30d` | Revenue time-series |
| GET | `/admin/dashboard/orders-by-status` | Order status distribution |
| GET | `/admin/dashboard/leads?range=30d` | Lead counts by source |
| GET | `/admin/dashboard/top-services?range=30d` | Best-selling services |
| GET | `/admin/dashboard/recent-activity?limit=10` | Recent admin actions |

### Analytics

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/analytics/overview?range=30d` | KPI panel (revenue, orders, conversion, sessions) |
| GET | `/admin/analytics/revenue?range=30d` | Revenue chart data |
| GET | `/admin/analytics/traffic?range=30d` | Traffic sources |
| GET | `/admin/analytics/conversions?range=30d` | Conversion funnel |
| GET | `/admin/analytics/services?range=30d` | Top services by revenue |

### Content CRUD

Uniform pattern for services, portfolio, case-studies, industries, testimonials, faqs, pages:

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/<resource>` | List with pagination + search + filters |
| GET | `/admin/<resource>/:id` | Get one |
| POST | `/admin/<resource>` | Create |
| PUT / PATCH | `/admin/<resource>/:id` | Update |
| DELETE | `/admin/<resource>/:id` | Delete |

### Blog

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET, POST | `/admin/blog/posts` | List all (any status) + create |
| GET, PUT, DELETE | `/admin/blog/posts/:id` | CRUD |
| POST | `/admin/blog/posts/:id/publish` | Publish now |
| GET, POST | `/admin/blog/categories` | Categories list + create |
| PUT, DELETE | `/admin/blog/categories/:id` | Update / delete category |
| GET | `/admin/blog/comments` | Comment moderation queue |
| POST | `/admin/blog/comments/:id/approve` | Approve comment |
| DELETE | `/admin/blog/comments/:id` | Reject/delete comment |

### Careers

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET, POST | `/admin/careers/jobs` | Job CRUD |
| PUT, DELETE | `/admin/careers/jobs/:id` | Update / delete |
| GET | `/admin/careers/applications` | Application queue (filter by `?status=`) |
| PUT | `/admin/careers/applications/:id` | Update status/notes |

### Leads

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/leads/contacts` | Contact submissions |
| GET | `/admin/leads/consultations` | Consultation bookings |
| GET | `/admin/leads/subscribers` | Newsletter subscribers |
| GET | `/admin/leads/subscribers/export` | CSV download of subscribers |
| PUT, DELETE | `/admin/leads/<type>/:id` | Update / delete |

### Commerce

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/orders` | All orders |
| GET | `/admin/orders/:id` | Order detail with timeline |
| PATCH | `/admin/orders/:id/status` | Change status (adds timeline entry) |
| POST | `/admin/orders/:id/refund` | Issue refund |
| GET | `/admin/payments` | All Stripe transactions |
| GET, POST, PUT, DELETE | `/admin/coupons[/:id]` | Coupon CRUD |

### Support

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/tickets` | All tickets |
| GET | `/admin/tickets/:id` | Ticket detail with messages + notes |
| POST | `/admin/tickets/:id/reply` | Reply (with `isInternal` flag) |
| PATCH | `/admin/tickets/:id/status` | Change status |
| PATCH | `/admin/tickets/:id/assign` | Assign to staff member |
| POST | `/admin/tickets/:id/note` | Add internal note |

### Users

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/users` | List users (filter by `?role=`, `?status=`) |
| GET | `/admin/users/:id` | User detail |
| PUT | `/admin/users/:id` | Update profile |
| DELETE | `/admin/users/:id` | Soft-delete |
| PATCH | `/admin/users/:id/role` | Change role (super_admin only) |
| POST | `/admin/users/:id/suspend` | Suspend user |
| POST | `/admin/users/:id/activate` | Reactivate user |

### Media

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/media` | List assets (paginated) |
| GET | `/admin/media/folders` | Folder taxonomy with counts |
| POST | `/admin/media/upload` | Upload one or more files |
| PATCH | `/admin/media/:id` | Update metadata (alt text, folder) |
| DELETE | `/admin/media/:id` | Delete |

### Settings

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/settings` | Global site config |
| PUT | `/admin/settings` | Update settings |
| GET | `/admin/settings/email-templates` | Email template list |
| GET | `/admin/settings/email-templates/:id` | One template |
| PUT | `/admin/settings/email-templates/:id` | Update template |
| POST | `/admin/settings/test-email` | Send a test email using a template |

### SEO / redirects

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/admin/redirects` | List managed redirects |
| POST | `/admin/redirects` | Create a 301/302 |
| PATCH | `/admin/redirects/:id` | Update |
| DELETE | `/admin/redirects/:id` | Remove |

---

## Error codes

Common `error.code` values:

| Code | Meaning |
| :--- | :--- |
| `VALIDATION_ERROR` | Zod validation failed. `error.details` contains field-level messages |
| `UNAUTHORIZED` | No/invalid token |
| `FORBIDDEN` | Authenticated but not authorized for this route |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Duplicate (e.g. slug already in use) |
| `RATE_LIMITED` | Too many requests — see `Retry-After` header |
| `STRIPE_ERROR` | Payment provider returned an error — see `error.message` |
| `INTERNAL_ERROR` | Unhandled server error |

HTTP status codes match: 400, 401, 403, 404, 409, 429, 500.
