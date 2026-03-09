# WedSaaS - Digital Wedding Invitation Platform

## Overview
WedSaaS is a production-ready SaaS platform for digital wedding invitations. Users create beautiful wedding invitation websites, share links, manage RSVPs, receive guest messages, display digital gift accounts, gallery photos, and view analytics from a dashboard. Admins can monitor the entire platform.

## Tech Stack
- **Frontend**: React + TypeScript, Wouter routing, TanStack Query, Shadcn UI, Recharts
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based (express-session + passport-local + bcrypt)

## Application Structure

### Routes
- `/` - Marketing landing page
- `/login` - Login page
- `/register` - Register page
- `/invite/:slug` - Public wedding invitation page (no auth required)
- `/dashboard` - Dashboard overview (auth required)
- `/dashboard/invitations` - Invitation list & create
- `/dashboard/builder/:id` - Invitation builder (5 tabs: couple, events, content, theme, settings)
- `/dashboard/rsvp` - RSVP management
- `/dashboard/messages` - Guest messages (with hide/show + sort)
- `/dashboard/gifts` - Digital gift accounts (bank/e-wallet)
- `/dashboard/gallery` - Gallery photo management (URL-based)
- `/dashboard/analytics` - Analytics with charts
- `/dashboard/subscription` - Subscription plans (payment gateway: coming soon)
- `/dashboard/settings` - Account settings + password change
- `/admin` - Admin platform overview stats
- `/admin/users` - Admin: all users list with plan management
- `/admin/invitations` - Admin: all invitations across platform

### Key Features (ALL ACTIVE WITH REAL DB)
- Multi-tenant: each user can have many invitations (RLS enforced)
- 4 wedding themes: Classic Elegant, Minimal Modern, Romantic Floral, Luxury Gold
- RSVP management with guest count, search, filter
- Guest messages with visibility toggle + newest/oldest sort
- Digital gift (bank/e-wallet) accounts
- Gallery photos (URL-based, no file upload required)
- Analytics with views, RSVP breakdown, conversion rate, charts
- Countdown timer on public invitation page
- Guest name personalization via `?to=GuestName` query param
- Admin panel (role-based, isAdmin field on users)
- Account settings with real profile save + password change

## Database Tables (13 total)
- `users` - Accounts with plan (free/premium/business) + isAdmin boolean
- `invitations` - Wedding invitations (slug, theme, status, views) — FORCE RLS
- `invitation_couples` - Bride/groom info, love story, photos — FORCE RLS
- `invitation_events` - Akad and reception event details — FORCE RLS
- `invitation_content` - Opening quote, closing message, RSVP settings — FORCE RLS
- `invitation_gallery` - Gallery images with URL + caption — FORCE RLS
- `rsvps` - RSVP submissions — FORCE RLS
- `guest_messages` - Guest wishes/messages — FORCE RLS
- `gift_accounts` - Bank/e-wallet accounts for digital gifting — FORCE RLS
- `gift_confirmations` - Gift transfer confirmations — FORCE RLS
- `subscriptions` - Subscription records per user
- `white_label_settings` - Per-user white label config
- `session` - Express session store

## Row Level Security Architecture
PostgreSQL RLS enforces that users only access their own data at the database level.

**Mechanism**: Each authenticated request uses `withUserContext(userId, fn)` in `server/db.ts`.
Sets `SET LOCAL app.current_user_id = '{userId}'` (transaction-scoped, safe with connection pools).

**Public routes**: Allow SELECT on status='published' rows only.
`increment_invitation_views()`: SECURITY DEFINER function bypasses RLS for view counting.

**Migration**: `migrations/001_row_level_security.sql` — idempotent, safe to re-run.

## Demo Account
- Username: `demo`
- Password: `demo123`
- Is Admin: `true` (can access /admin panel)
- Demo invitation slug: `ahmad-dan-sari`

## Admin Access
Set `is_admin = true` in the `users` table for any user to grant admin panel access.
Non-admin users attempting /admin are redirected to /dashboard.

## API Endpoints
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user (includes isAdmin)
- `GET /api/invitations` — User's invitations (RLS scoped)
- `POST /api/invitations` — Create invitation
- `GET/PATCH/DELETE /api/invitations/:id` — Manage invitation
- `GET/PUT /api/invitations/:id/couple` — Couple info
- `GET/PUT /api/invitations/:id/events` — Event details
- `GET/PUT /api/invitations/:id/content` — Content settings
- `GET/POST /api/invitations/:id/gallery` — Gallery
- `DELETE /api/invitations/:id/gallery/:imageId` — Delete photo
- `GET /api/invitations/:id/rsvps` — RSVPs (dashboard)
- `GET /api/invitations/:id/messages` — Messages (dashboard)
- `PATCH /api/messages/:id/visibility` — Toggle message visibility
- `GET/POST /api/invitations/:id/gifts` — Gift accounts
- `DELETE /api/gifts/:id` — Delete gift account
- `GET /api/invitations/:id/analytics` — Invitation analytics
- `PATCH /api/users/me` — Update profile
- `PATCH /api/users/me/password` — Change password
- `GET /api/stats` — User-wide stats overview
- `GET /api/admin/stats` — Platform stats (admin only)
- `GET /api/admin/users` — All users (admin only)
- `GET /api/admin/invitations` — All invitations (admin only)
- `PATCH /api/admin/users/:id/plan` — Update user plan (admin only)
- `GET /api/public/:slug` — Public invitation
- `POST /api/public/:slug/rsvp` — Submit RSVP
- `POST /api/public/:slug/messages` — Submit message
- `GET /api/public/:slug/messages` — Visible messages
- `POST /api/public/:slug/gift-confirmation` — Gift confirmation
