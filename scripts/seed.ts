/**
 * Standalone seed runner — run once to populate a fresh database.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   npm run db:seed
 *
 * Optional env vars:
 *   ADMIN_EMAIL      — admin email (default: admin@wedsaas.app)
 *   ADMIN_USERNAME   — admin username (default: admin)
 *   ADMIN_PASSWORD   — admin password (default: Admin123! — change this!)
 *   SITE_NAME        — site name used in settings (default: WedSaaS)
 *   APP_URL          — canonical URL e.g. https://yourdomain.com
 *   SKIP_DEMO_SEED   — set to "true" to skip demo user/invitation
 *   DATABASE_URL     — PostgreSQL connection string (required)
 */

import { seedDatabase } from "../server/seed";

console.log("─────────────────────────────────────────────");
console.log("  WedSaaS — Database Seed");
console.log("─────────────────────────────────────────────");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  console.error("  export DATABASE_URL=postgresql://user:pass@localhost:5432/wedsaas");
  process.exit(1);
}

seedDatabase()
  .then(() => {
    console.log("─────────────────────────────────────────────");
    console.log("  Seed complete.");
    console.log("─────────────────────────────────────────────");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
