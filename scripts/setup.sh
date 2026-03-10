#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# WedSaaS — VPS / Self-Hosted Setup Script
#
# Run this once on a fresh server after cloning the repo.
# Requirements: Node.js 20+, npm, PostgreSQL running and configured in .env
#
# Usage:
#   cp .env.example .env
#   nano .env          # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, etc.
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

step() { echo -e "\n${BOLD}▶  $1${RESET}"; }
ok()   { echo -e "${GREEN}✔  $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠  $1${RESET}"; }
fail() { echo -e "${RED}✖  $1${RESET}"; exit 1; }

echo -e "${BOLD}"
echo "═══════════════════════════════════════════════"
echo "  WedSaaS — First-Time Setup"
echo "═══════════════════════════════════════════════"
echo -e "${RESET}"

# ── 1. Check .env exists ──────────────────────────────────────────────────────
step "Checking configuration"
if [ ! -f ".env" ]; then
  fail ".env not found. Run: cp .env.example .env && nano .env"
fi

# shellcheck disable=SC2046
export $(grep -v '^#' .env | grep -v '^$' | xargs)

if [ -z "${DATABASE_URL:-}" ]; then
  fail "DATABASE_URL is not set in .env"
fi

if [ -z "${SESSION_SECRET:-}" ] || [ "${SESSION_SECRET}" = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_STRING" ]; then
  fail "SESSION_SECRET is not set or still has the default value. Generate one with: openssl rand -hex 64"
fi

if [ "${ADMIN_PASSWORD:-}" = "CHANGE_THIS_STRONG_PASSWORD" ]; then
  fail "ADMIN_PASSWORD is still the default placeholder. Please set a real password in .env"
fi

ok "Configuration looks good"

# ── 2. Install dependencies ───────────────────────────────────────────────────
step "Installing Node.js dependencies"
npm ci --omit=dev --include=dev
ok "Dependencies installed"

# ── 3. Create required directories ────────────────────────────────────────────
step "Creating directories"
mkdir -p uploads dist
ok "Directories ready"

# ── 4. Build the application ──────────────────────────────────────────────────
step "Building application (client + server)"
npm run build
ok "Build complete"

# ── 5. Push database schema ───────────────────────────────────────────────────
step "Pushing database schema"
echo "y" | npx drizzle-kit push || fail "Database schema push failed. Check DATABASE_URL and PostgreSQL access."
ok "Database schema up to date"

# ── 6. Seed the database ──────────────────────────────────────────────────────
step "Seeding database (admin account, bank accounts, settings, pricing)"
npx tsx scripts/seed.ts
ok "Database seeded"

# ── 7. Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  Setup complete!${RESET}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${RESET}"
echo ""
echo "Start the server:"
echo "  npm start"
echo ""
echo "Or with PM2 (recommended for production):"
echo "  pm2 start \"npm start\" --name wedsaas"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo -e "${YELLOW}⚠  If this is a production server:${RESET}"
echo "   - Make sure to set up a reverse proxy (Nginx/Caddy) in front of port ${PORT:-5000}"
echo "   - Set up SSL/TLS (Let's Encrypt recommended)"
echo "   - Change the admin password after first login"
echo ""
