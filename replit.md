# WedSaaS - Digital Wedding Invitation Platform

## Overview
WedSaaS is a production-ready SaaS platform for digital wedding invitations. Users create beautiful wedding invitation websites, share links, manage RSVPs, receive guest messages, display digital gift accounts, gallery photos, and view analytics. Admins have a comprehensive panel to manage the entire platform.

## Tech Stack
- **Frontend**: React + TypeScript, Wouter routing, TanStack Query, Shadcn UI, Recharts
- **Backend**: Express.js v5 + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based (express-session + passport-local + bcrypt)
- **File Upload**: Multer with magic-bytes validation (images + audio)
- **QR Code**: qrcode (server), qrcode.react (client), html5-qrcode (QR scanner)

## Application Structure

### User Routes
- `/` - Marketing landing page (CMS-driven from landing_page_settings)
- `/login` - Login page (with referral code awareness)
- `/register` - Register page (optional referral_code field)
- `/invite/:slug` - Public wedding invitation page (personalized via `?guest=TOKEN`, event-filtered)
- `/save-the-date/:slug` - Save The Date page (simplified pre-invitation page, only if enabled)
- `/preview/:id` - Draft/published invitation preview (auth required)
- `/dashboard` - Dashboard overview with guest stats widget
- `/dashboard/invitations` - Invitation list with Duplicate + Save The Date link
- `/dashboard/invitations/:id/guests` - Guest management (CRUD, categories, event assignment, QR)
- `/dashboard/invitations/:id/checkin` - QR Check-in scanner + manual token
- `/dashboard/builder/:id` - Builder (5 tabs: couple, events, content, theme, settings) + AI Copy + Love Story + Color Presets + Video URL + Save The Date
- `/dashboard/rsvp` - RSVP management
- `/dashboard/messages` - Guest messages (hide/show + sort)
- `/dashboard/gifts` - Digital gift accounts (bank/e-wallet/QRIS)
- `/dashboard/gallery` - Gallery photo management
- `/dashboard/analytics` - Analytics with charts
- `/dashboard/media` - Media Library (upload/manage images & audio files)
- `/dashboard/domain` - Custom domain settings + DNS guide
- `/dashboard/subscription` - Plans with coupon code support in checkout
- `/dashboard/billing/:id` - Invoice detail page
- `/dashboard/settings` - Account settings

### Admin Routes
- `/admin` - Platform overview stats
- `/admin/users` - User management
- `/admin/invitations` - All invitations
- `/admin/themes` - Wedding Theme Library
- `/admin/themes/:id/builder` - Visual Theme Builder
- `/admin/testimonials` - Testimonials CRUD
- `/admin/faqs` - FAQ CRUD
- `/admin/pricing` - Pricing plans + features
- `/admin/payments` - Payment management
- `/admin/coupons` - Coupon management (create/edit/toggle)
- `/admin/referrals` - Referral usage tracking
- `/admin/domains` - Custom domain approval (status management)
- `/admin/cms` - CMS Landing Page editor
- `/admin/settings` - Website settings
- `/admin/seo` - SEO settings
- `/admin/logs` - Audit log viewer

### User Sidebar Groups
- **Undangan**: Overview, Undangan, RSVP, Pesan Tamu, Digital Gift, Galeri, Analytics
- **Konten**: Media Library
- **Akun**: Domain, Langganan, Pengaturan
- Admin users see an extra "Admin Panel" link

### Admin Sidebar Groups
- **Data**: Dashboard, Pengguna, Undangan, Pembayaran
- **Konten**: CMS Landing, Testimoni, FAQ
- **Marketing**: Paket Harga, Kupon, Referral
- **Konfigurasi**: Domain, Pengaturan, SEO, Audit Log
- **Tema**: Library Tema

## Key Features (ALL ACTIVE WITH REAL DB)
- Multi-tenant invitations with Row Level Security
- 4 built-in + unlimited custom wedding themes
- **Admin Wedding Theme Builder**: Visual builder with 14 block types, drag-drop
- **Guest Management**: CRUD guests with categories (keluarga/teman/kantor/vip/lainnya), personalized invitation links per guest, QR code generation per guest
- **QR Check-in**: Camera-based QR scanner (html5-qrcode), manual token fallback, real-time check-in stats
- **Media Library**: Upload images and audio files (magic-bytes validated), copy URL, used in builder
- **Custom Music**: Audio picker from media library in builder, autoplay with fallback play button, music controls toggle
- **Duplicate Invitation**: One-click copy with all content (couple, events, content, gallery)
- **AI Copy Generator**: Template-based text generator (opening text, quotes, love story, hashtags) — honest "template engine" labeling
- **CMS Landing Page**: Admin-editable hero, features, how-it-works, CTA sections with show/hide toggles
- **Coupon System**: Admin creates coupons (percentage/fixed), users apply at checkout, discount applied to payment
- **Referral System**: Each user gets a referral code, new signups link via referral code, admin tracks referral usage
- **Custom Domain**: Users submit domains, admin approves/rejects with DNS instructions shown to users
- Manual Bank Transfer Payment System with unique invoice codes
- Audit logging for all admin actions

## Database Tables (31 total)
### User/Invitation Tables
- `users` - with plan, isAdmin, isSuspended, referralCode
- `invitations`, `invitation_couples`, `invitation_events`
- `invitation_content` - includes musicEnabled, musicLabel, showMusicControl
- `invitation_gallery`, `rsvps` (with guestId), `guest_messages`
- `gift_accounts`, `gift_confirmations`
- `subscriptions`, `white_label_settings`

### New Feature Tables
- `guests` - invitationId, name, phone, email, category, guestCount, customLinkToken, rsvpStatus, checkedIn, checkedInAt
- `media_assets` - userId, fileName, originalName, mimeType, size, url, mediaType (image/audio)
- `custom_domains` - userId, domain, status (not_configured/pending/active/failed), adminNotes
- `coupons` - code, discountType, discountValue, minAmount, maxUses, usedCount, applicablePlans, isActive
- `coupon_usages` - couponId, userId, paymentId, discountApplied
- `referral_usages` - referrerId, refereeId
- `landing_page_settings` - singleton (id=1), all CMS fields for landing page

### Payment Tables
- `bank_accounts`, `payments` (with couponCode, discountAmount)

### Admin/Platform Tables
- `testimonials`, `faqs`, `pricing_plans`, `pricing_plan_features`
- `audit_logs`, `website_settings`, `seo_settings`, `session`

### Theme Builder Tables
- `wedding_themes`, `wedding_theme_blocks`

## Row Level Security Architecture
PostgreSQL RLS enforces that users only access their own data.
**Mechanism**: `withUserContext(userId, fn)` sets `SET LOCAL app.current_user_id = '{userId}'`

## Demo Accounts
- `demo` / `demo123` — Admin + Premium — invitation slug: `ahmad-dan-sari`
- `admin` / `admin123` — Admin + Business
- `user_free` / `user123` — Free plan user
- `user_premium` / `user123` — Premium plan user

## VPS / Self-Hosted Deployment

### First-time setup (single command)
```bash
cp .env.example .env
nano .env                  # Fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD
bash scripts/setup.sh      # Install → build → db push → seed
npm start
```

### Required environment variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `SESSION_SECRET` | Long random string for session signing (required) |
| `APP_URL` | Canonical URL e.g. https://yourdomain.com |
| `PORT` | Port to listen on (default: 5000) |
| `ADMIN_EMAIL` | Admin account email (seeded once) |
| `ADMIN_USERNAME` | Admin username (default: admin) |
| `ADMIN_PASSWORD` | Admin password (MUST change default) |
| `SITE_NAME` | Site name (default: WedSaaS) |
| `SKIP_DEMO_SEED` | Set "true" to skip demo user seeding |

## API Endpoints

### Auth
- `POST /api/auth/login`, `POST /api/auth/register` (accepts referralCode), `POST /api/auth/logout`
- `GET /api/auth/me`

### Invitation Management (auth required, RLS scoped)
- `GET/POST /api/invitations`
- `GET/PATCH/DELETE /api/invitations/:id`
- `POST /api/invitations/:id/publish`, `/unpublish`
- `POST /api/invitations/:id/duplicate` — NEW
- `GET /api/invitations/:id/preview-data`
- `GET/PUT /api/invitations/:id/couple`, `/events`, `/content`
- `GET/POST /api/invitations/:id/gallery`, `DELETE /api/invitations/:id/gallery/:imageId`
- `GET /api/invitations/:id/rsvps`, `/messages`, `/analytics`
- `PATCH /api/messages/:id/visibility`
- `GET/POST /api/invitations/:id/gifts`, `DELETE /api/gifts/:id`
- `GET /api/invitations/:id/gift-confirmations`

### Guest Management (auth required)
- `GET /api/invitations/:id/guests` — list with stats
- `POST /api/invitations/:id/guests` — create (auto-generates customLinkToken)
- `PATCH /api/guests/:id`, `DELETE /api/guests/:id`
- `POST /api/guests/:id/checkin` — mark checked-in with timestamp
- `GET /api/guests/token/:token` — public, resolve guest by token

### Media Library (auth required)
- `GET /api/media` — list user's media assets
- `POST /api/media/upload` — upload file (image or audio)
- `DELETE /api/media/:id`

### Coupon & Referral (auth required)
- `POST /api/coupons/validate` — validate coupon code for a plan
- `GET /api/referral/me` — get/auto-generate user's referral code
- `GET /api/referral/stats` — referral count for current user

### Custom Domain (auth required)
- `GET /api/domain` — get user's custom domain
- `POST /api/domain` — create/update domain request

### AI Copy Generator (auth required)
- `POST /api/ai/generate` — template-based text generation (type, groomName, brideName, tone, language)

### Admin (requireAdmin)
- `GET/POST /api/admin/coupons`, `PATCH/DELETE /api/admin/coupons/:id`
- `GET /api/admin/referrals`
- `GET /api/admin/domains`, `PATCH /api/admin/domains/:id`
- `GET/PUT /api/admin/cms/landing`
- All existing admin routes (users, invitations, payments, themes, testimonials, faqs, pricing, settings, seo, audit-logs)

### Public (no auth)
- `GET /api/public/:slug`, `POST /api/public/:slug/rsvp` (accepts guestToken)
- `POST/GET /api/public/:slug/messages`
- `POST /api/public/:slug/gift-confirmation`
- `GET /api/public/themes/:id`
- `GET /api/public/landing-settings` — CMS landing page data

## Theme Builder Architecture
- 14 block types: cover, couple, quote, countdown, story, events, maps, gallery, rsvp, messages, gifts, closing, divider, text
- `client/src/lib/theme-blocks.ts` — block type definitions
- `client/src/components/theme-renderer/` — block renderer components

## Express v5 Note
Route params are typed as `string | string[]` — routes.ts has a `declare module "express-serve-static-core"` override to treat them as `string`.

## Schema Management
- Always use `executeSql` via code_execution for schema changes (drizzle-kit push hangs on new tables)
- `pricing_plan_features` column is `feature_name` NOT `feature`
- `website_settings / seo_settings / landing_page_settings` are singletons with id=1
- Payment status enum: `pending`, `waiting_confirmation`, `paid`, `rejected`, `expired`, `canceled`
- PLAN_AMOUNTS: premium=99000, business=299000 (integers, IDR)
