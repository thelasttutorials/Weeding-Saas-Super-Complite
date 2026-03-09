# WedSaaS - Digital Wedding Invitation Platform

## Overview
WedSaaS is a production-ready SaaS platform for digital wedding invitations. Users can create beautiful wedding invitation websites, share invitation links, manage RSVPs, receive guest messages, display digital gift accounts, and view analytics from a dashboard.

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
- `/dashboard/builder/:id` - Invitation builder (6 tabs: couple, events, content, gallery, theme, settings)
- `/dashboard/rsvp` - RSVP management
- `/dashboard/messages` - Guest messages
- `/dashboard/gifts` - Digital gift accounts
- `/dashboard/analytics` - Analytics with charts
- `/dashboard/subscription` - Subscription plans
- `/dashboard/settings` - Account settings

### Key Features
- Multi-tenant: each user can have many invitations
- 4 wedding themes: Classic Elegant, Minimal Modern, Romantic Floral, Luxury Gold
- RSVP management with guest count
- Guest messages with visibility control
- Digital gift (bank/e-wallet) accounts
- Analytics with views, RSVP conversion, charts
- Countdown timer on public invitation page
- Guest name personalization via `?to=GuestName` query param

## Database Tables
- `users` - User accounts with plan (free/premium/business)
- `invitations` - Wedding invitations (slug, theme, status, views)
- `invitation_couples` - Bride/groom info, love story, photos
- `invitation_events` - Akad and reception event details
- `invitation_content` - Opening quote, closing message, RSVP settings
- `invitation_gallery` - Gallery images
- `rsvps` - RSVP submissions
- `guest_messages` - Guest wishes/messages
- `gift_accounts` - Bank/e-wallet accounts for digital gifting
- `gift_confirmations` - Gift transfer confirmations

## Demo Account
- Username: `demo`
- Password: `demo123`

## API Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/invitations` - Get user's invitations
- `POST /api/invitations` - Create invitation
- `GET/PATCH/DELETE /api/invitations/:id` - Manage specific invitation
- `GET/PUT /api/invitations/:id/couple` - Couple info
- `GET/PUT /api/invitations/:id/events` - Event details
- `GET/PUT /api/invitations/:id/content` - Content settings
- `GET/POST /api/invitations/:id/gallery` - Gallery management
- `GET /api/invitations/:id/rsvps` - Get RSVPs (dashboard)
- `GET /api/invitations/:id/messages` - Get messages (dashboard)
- `GET /api/invitations/:id/gifts` - Get gift accounts
- `GET /api/invitations/:id/analytics` - Get analytics
- `GET /api/stats` - User-wide stats
- `GET /api/public/:slug` - Public invitation (no auth)
- `POST /api/public/:slug/rsvp` - Submit RSVP (no auth)
- `POST /api/public/:slug/messages` - Submit message (no auth)
- `GET /api/public/:slug/messages` - Get visible messages (no auth)
