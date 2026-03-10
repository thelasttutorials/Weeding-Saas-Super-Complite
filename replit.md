# WedSaaS - Digital Wedding Invitation Platform

## Overview
WedSaaS is a production-ready SaaS platform for digital wedding invitations. Users create beautiful wedding invitation websites, share links, manage RSVPs, receive guest messages, display digital gift accounts, gallery photos, and view analytics. Admins have a comprehensive panel to manage the entire platform including content, pricing, testimonials, FAQs, settings, SEO, and audit logs.

## Tech Stack
- **Frontend**: React + TypeScript, Wouter routing, TanStack Query, Shadcn UI, Recharts
- **Backend**: Express.js v5 + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based (express-session + passport-local + bcrypt)

## Application Structure

### User Routes
- `/` - Marketing landing page
- `/login` - Login page
- `/register` - Register page
- `/invite/:slug` - Public wedding invitation page (no auth required) — includes share section (Copy, WhatsApp, Telegram)
- `/preview/:id` - Draft/published invitation preview page (auth required, no sidebar, shows "Mode Preview" amber banner)
- `/dashboard` - Dashboard overview (auth required)
- `/dashboard/invitations` - Invitation list & create
- `/dashboard/builder/:id` - Invitation builder (5 tabs: couple, events, content, theme, settings)
- `/dashboard/rsvp` - RSVP management
- `/dashboard/messages` - Guest messages (with hide/show + sort)
- `/dashboard/gifts` - Digital gift accounts (bank/e-wallet)
- `/dashboard/gallery` - Gallery photo management (URL-based)
- `/dashboard/analytics` - Analytics with charts
- `/dashboard/subscription` - Subscription plans with checkout modal + payment history
- `/dashboard/billing/:id` - Invoice detail page (countdown timer, bank transfer instructions, proof upload, payment timeline)
- `/dashboard/settings` - Account settings + password change

### Admin Routes
- `/admin` - Platform overview stats + recent users/invitations + quick actions
- `/admin/users` - User management (plan, suspend/activate, toggle admin, reg date)
- `/admin/invitations` - All invitations (publish/unpublish/archive, views count)
- `/admin/themes` - Wedding Theme Library (CRUD, duplicate, publish, search/filter)
- `/admin/themes/:id/builder` - Visual Theme Builder (full-screen, no admin sidebar, drag-drop)
- `/admin/testimonials` - Testimonials CRUD (publish/unpublish, star rating)
- `/admin/faqs` - FAQ CRUD (category filter, sort order, active toggle)
- `/admin/pricing` - Pricing plans CRUD + plan features management
- `/admin/payments` - Payment management with approve/reject actions, shows uniqueCode + amount + finalAmount columns, search + status filter
- `/admin/settings` - Website settings (General + System tabs)
- `/admin/seo` - SEO settings (meta tags, OG, Twitter card, live preview)
- `/admin/logs` - Audit log viewer (color-coded action badges, search + filter)

### Key Features (ALL ACTIVE WITH REAL DB)
- Multi-tenant: each user can have many invitations (RLS enforced)
- 4 built-in wedding themes: Classic Elegant, Minimal Modern, Romantic Floral, Luxury Gold
- **Admin Wedding Theme Builder**: Elementor-like visual builder with 14 block types, drag-drop reorder, content/style inspector, global settings (colors, fonts, spacing)
- RSVP management with guest count, search, filter
- Guest messages with visibility toggle + newest/oldest sort
- Digital gift (bank/e-wallet) accounts
- Gallery photos (URL-based, no file upload required)
- Analytics with views, RSVP breakdown, conversion rate, charts
- Countdown timer on public invitation page
- Guest name personalization via `?to=GuestName` query param
- Admin panel (role-based, isAdmin field on users)
- Account settings with real profile save + password change
- Admin testimonials/FAQ/pricing CRUD
- Admin website settings & SEO settings stored in DB
- Audit logging for all admin actions
- **Manual Bank Transfer Payment System**: Users select plan → checkout modal → invoice with unique 3-digit code (amount + code = finalAmount) → 24h countdown timer → upload proof URL → admin approve/reject → plan auto-activated on approval

## Database Tables (24 total)
### User/Invitation Tables (RLS enforced)
- `users` - Accounts with plan (free/premium/business) + isAdmin + isSuspended
- `invitations` - Wedding invitations (slug, theme, status, views)
- `invitation_couples` - Bride/groom info, love story, photos
- `invitation_events` - Akad and reception event details
- `invitation_content` - Opening quote, closing message, RSVP settings
- `invitation_gallery` - Gallery images with URL + caption
- `rsvps` - RSVP submissions
- `guest_messages` - Guest wishes/messages
- `gift_accounts` - Bank/e-wallet accounts for digital gifting
- `gift_confirmations` - Gift transfer confirmations
- `subscriptions` - Subscription records per user
- `white_label_settings` - Per-user white label config

### Payment Tables
- `bank_accounts` - Admin-managed bank accounts for manual transfer (bankName, accountNumber, accountName, isActive)
- `payments` - Invoice records (userId, plan, invoiceNumber, amount, uniqueCode, finalAmount, status, expiresAt, transferProofUrl, paidAt, rejectedReason)

### Admin/Platform Tables
- `testimonials` - Platform testimonials with rating, publish status
- `faqs` - Platform FAQ with category, sort order, active status
- `pricing_plans` - Subscription plan definitions
- `pricing_plan_features` - Features per plan
- `audit_logs` - Admin action audit trail (who did what when)
- `website_settings` - Singleton platform settings (id=1)
- `seo_settings` - Singleton SEO config (id=1)
- `session` - Express session store

### Theme Builder Tables
- `wedding_themes` - Custom theme definitions (name, slug, status, globalSettings JSON, createdBy)
- `wedding_theme_blocks` - Ordered block list per theme (blockType, sortOrder, content JSON, style JSON, isVisible)

## Row Level Security Architecture
PostgreSQL RLS enforces that users only access their own data at the database level.

**Mechanism**: Each authenticated request uses `withUserContext(userId, fn)` in `server/db.ts`.
Sets `SET LOCAL app.current_user_id = '{userId}'` (transaction-scoped, safe with connection pools).

**Public routes**: Allow SELECT on status='published' rows only.
`increment_invitation_views()`: SECURITY DEFINER function bypasses RLS for view counting.

**Migration**: `migrations/001_row_level_security.sql` — idempotent, safe to re-run.

## Demo Accounts
- `demo` / `demo123` — Admin + Premium — invitation slug: `ahmad-dan-sari`
- `admin` / `admin123` — Admin + Business
- `user_free` / `user123` — Free plan user
- `user_premium` / `user123` — Premium plan user

## Admin Access
Set `is_admin = true` in the `users` table. Non-admin users attempting /admin are redirected to /dashboard.
Use `PATCH /api/admin/users/:id/toggle-admin` to toggle via UI.

## Express v5 Note
This project uses Express v5 with `@types/express` v5. Route params are typed as `string | string[]` — routes.ts has a `declare module "express-serve-static-core"` override to treat them as `string`.

## API Endpoints

### Auth
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`
- `GET /api/auth/me`

### Invitation Management (auth required, RLS scoped)
- `GET/POST /api/invitations`
- `GET/PATCH/DELETE /api/invitations/:id`
- `POST /api/invitations/:id/publish`, `POST /api/invitations/:id/unpublish`
- `GET /api/invitations/:id/preview-data` — owner/admin only, returns full invitation data regardless of publish status (no view tracking)
- `GET/PUT /api/invitations/:id/couple`
- `GET/PUT /api/invitations/:id/events`
- `GET/PUT /api/invitations/:id/content`
- `GET/POST /api/invitations/:id/gallery`, `DELETE /api/invitations/:id/gallery/:imageId`
- `GET /api/invitations/:id/rsvps`, `GET /api/invitations/:id/messages`
- `PATCH /api/messages/:id/visibility`
- `GET/POST /api/invitations/:id/gifts`, `DELETE /api/gifts/:id`
- `GET /api/invitations/:id/gift-confirmations`
- `GET /api/invitations/:id/analytics`

### User
- `GET /api/stats`, `PATCH /api/users/me`, `PATCH /api/users/me/password`

### Admin (requireAdmin middleware)
- `GET /api/admin/stats` — includes recentUsers + recentInvitations
- `GET /api/admin/users`, `PATCH /api/admin/users/:id/plan`
- `PATCH /api/admin/users/:id/suspend`, `PATCH /api/admin/users/:id/unsuspend`
- `PATCH /api/admin/users/:id/toggle-admin`
- `GET /api/admin/users/:id/detail`
- `GET /api/admin/invitations`
- `POST /api/admin/invitations/:id/publish`, `/unpublish`, `/archive`
- `GET/POST /api/admin/testimonials`, `PATCH/DELETE /api/admin/testimonials/:id`
- `GET/POST /api/admin/faqs`, `PATCH/DELETE /api/admin/faqs/:id`
- `GET/POST /api/admin/pricing`, `PATCH/DELETE /api/admin/pricing/:id`
- `GET/PUT /api/admin/pricing/:id/features`
- `GET /api/admin/subscriptions`
- `GET/PUT /api/admin/settings/website`
- `GET/PUT /api/admin/settings/seo`
- `GET /api/admin/audit-logs`

### Admin Theme Builder (requireAdmin)
- `GET /api/admin/themes` — list all themes
- `POST /api/admin/themes` — create theme
- `GET /api/admin/themes/:id` — get theme + blocks
- `PATCH /api/admin/themes/:id` — update theme
- `DELETE /api/admin/themes/:id` — delete theme
- `POST /api/admin/themes/:id/duplicate` — duplicate theme
- `POST /api/admin/themes/:id/publish` — publish theme
- `POST /api/admin/themes/:id/archive` — archive theme
- `GET/POST /api/admin/themes/:id/blocks` — list/add blocks
- `PATCH /api/admin/themes/:themeId/blocks/:blockId` — update block
- `DELETE /api/admin/themes/:themeId/blocks/:blockId` — delete block
- `POST /api/admin/themes/:id/blocks/reorder` — reorder blocks

### Public (no auth)
- `GET /api/public/:slug`, `POST /api/public/:slug/rsvp`
- `POST /api/public/:slug/messages`, `GET /api/public/:slug/messages`
- `POST /api/public/:slug/gift-confirmation`
- `GET /api/public/themes/:id` — get published theme + blocks (for custom invite rendering)

## Theme Builder Architecture
- `client/src/lib/theme-blocks.ts` — 14 block type definitions with labels, icons, defaultContent, defaultStyle
- `client/src/pages/admin/themes.tsx` — Theme library grid page
- `client/src/pages/admin/theme-builder.tsx` — Full-screen 3-panel visual builder (left: block library + global settings, center: sortable canvas, right: content/style inspector)
- `client/src/components/theme-renderer/` — Block renderer components (index.tsx + 14 individual block files)
- Invitations with `customThemeId` use ThemeRenderer on /invite/:slug; others use built-in themes

## 14 Block Types
cover, couple, quote, countdown, story, events, maps, gallery, rsvp, messages, gifts, closing, divider, text
