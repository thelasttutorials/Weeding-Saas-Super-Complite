/**
 * Database seed — idempotent, safe to run multiple times.
 *
 * Seeds required on every fresh install:
 *   1. Admin user        (ADMIN_EMAIL / ADMIN_PASSWORD env vars, or safe defaults)
 *   2. Demo user         (skipped if SKIP_DEMO_SEED=true)
 *   3. Bank accounts     (BCA, Mandiri, BNI)
 *   4. Website settings  (singleton id=1)
 *   5. SEO settings      (singleton id=1)
 *   6. Pricing plans     (Free, Premium, Business) + features
 *
 * Usage:
 *   Called automatically by server/index.ts on startup (dev).
 *   Run standalone:  tsx scripts/seed.ts
 */

import { db } from "./db";
import {
  users, invitations, invitationCouples, invitationEvents,
  invitationContent, rsvps, guestMessages,
  bankAccounts, websiteSettings, seoSettings,
  pricingPlans, pricingPlanFeatures,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function log(msg: string) { console.log(`[seed] ${msg}`); }

async function exists<T extends { id: unknown }>(
  table: any, col: any, value: string
): Promise<boolean> {
  const [row] = await db.select({ id: col }).from(table).where(eq(col, value)).limit(1);
  return !!row;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin user
// ─────────────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || "admin@wedsaas.app";
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  const [existing] = await db.select({ id: users.id })
    .from(users).where(eq(users.username, username)).limit(1);
  if (existing) { log(`Admin '${username}' already exists — skipped`); return; }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    id: randomUUID(),
    username,
    password: hashed,
    fullName: "Super Admin",
    email,
    plan: "business",
    isAdmin: true,
  });
  log(`Admin created — email: ${email} | password: ${password === "Admin123!" ? "Admin123! ⚠ CHANGE THIS" : "***"}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Demo user (skippable via SKIP_DEMO_SEED=true)
// ─────────────────────────────────────────────────────────────────────────────
async function seedDemo() {
  if (process.env.SKIP_DEMO_SEED === "true") {
    log("Demo seed skipped (SKIP_DEMO_SEED=true)");
    return;
  }

  const [existing] = await db.select({ id: users.id })
    .from(users).where(eq(users.username, "demo")).limit(1);
  if (existing) { log("Demo user already exists — skipped"); return; }

  const hashed = await bcrypt.hash("demo123", 12);
  const [demoUser] = await db.insert(users).values({
    id: randomUUID(),
    username: "demo",
    password: hashed,
    fullName: "Ahmad Ridwan",
    email: "demo@wedsaas.app",
    plan: "premium",
  }).returning();

  const invId = randomUUID();
  await db.insert(invitations).values({
    id: invId,
    userId: demoUser.id,
    title: "Pernikahan Ahmad & Sari",
    slug: "ahmad-dan-sari",
    theme: "classic_elegant",
    status: "published",
    views: 247,
    publishedAt: new Date(),
  });

  await db.insert(invitationCouples).values({
    id: randomUUID(),
    invitationId: invId,
    brideName: "Sari Dewi Permata",
    groomName: "Ahmad Ridwan Santoso",
    brideParents: "Bapak Sutrisno & Ibu Marlina",
    groomParents: "Bapak Hasan & Ibu Fatimah",
    loveStory: "Kami pertama bertemu di sebuah seminar pendidikan pada tahun 2021. Dari pertemuan yang tak disengaja itu, terjalinlah persahabatan yang indah, hingga akhirnya berkembang menjadi cinta yang tulus.",
    bridePhoto: "",
    groomPhoto: "",
  });

  await db.insert(invitationEvents).values({
    id: randomUUID(),
    invitationId: invId,
    akadDate: "2025-06-15",
    akadTime: "08:00",
    akadVenue: "Masjid Al-Hidayah, Jl. Masjid No. 10, Jakarta Selatan",
    akadMapsLink: "https://maps.google.com",
    receptionDate: "2025-06-15",
    receptionTime: "11:00",
    receptionVenue: "Gedung Serbaguna Permata, Jl. Raya Permata No. 25, Jakarta Selatan",
    receptionMapsLink: "https://maps.google.com",
  });

  await db.insert(invitationContent).values({
    id: randomUUID(),
    invitationId: invId,
    openingQuote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya. (QS. Ar-Rum: 21)",
    closingMessage: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    hashtag: "#AhmadDanSari2025",
    livestreamLink: "",
    backgroundMusic: "",
    enableRsvp: true,
    rsvpDeadline: "2025-06-10",
    maxGuests: 2,
  });

  for (const r of [
    { name: "Budi Santoso", whatsapp: "08123456789", guestCount: 2, status: "attending" as const, message: "Selamat ya! Semoga menjadi keluarga yang sakinah mawaddah warahmah." },
    { name: "Dewi Rahmawati", whatsapp: "08234567890", guestCount: 1, status: "attending" as const, message: "Insya Allah hadir!" },
    { name: "Rina Kusuma", whatsapp: "08456789012", guestCount: 1, status: "not_attending" as const, message: "Maaf tidak bisa hadir!" },
  ]) {
    await db.insert(rsvps).values({ id: randomUUID(), invitationId: invId, ...r });
  }

  for (const m of [
    { name: "Ibu Siti", message: "Barakallahu lakuma. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah!" },
    { name: "Pak Budi", message: "Selamat menempuh hidup baru! Semoga selalu diberikan kebahagiaan." },
  ]) {
    await db.insert(guestMessages).values({ id: randomUUID(), invitationId: invId, ...m, isVisible: true });
  }

  log("Demo user seeded — username: demo | password: demo123");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bank accounts
// ─────────────────────────────────────────────────────────────────────────────
async function seedBankAccounts() {
  const [existing] = await db.select({ id: bankAccounts.id }).from(bankAccounts).limit(1);
  if (existing) { log("Bank accounts already exist — skipped"); return; }

  const accounts = [
    { bankName: "BCA",    accountName: "WedSaaS Digital Indonesia", accountNumber: "1234567890", branch: "KCU Jakarta Pusat",  sortOrder: 1 },
    { bankName: "Mandiri", accountName: "WedSaaS Digital Indonesia", accountNumber: "9876543210", branch: "KCU Jakarta Selatan", sortOrder: 2 },
    { bankName: "BNI",    accountName: "WedSaaS Digital Indonesia", accountNumber: "1122334455", branch: "KCU Jakarta Barat",  sortOrder: 3 },
  ];
  for (const acc of accounts) {
    await db.insert(bankAccounts).values({ id: randomUUID(), ...acc, isActive: true });
  }
  log("Bank accounts seeded (BCA, Mandiri, BNI)");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Website settings (singleton id=1)
// ─────────────────────────────────────────────────────────────────────────────
async function seedWebsiteSettings() {
  const [existing] = await db.select({ id: websiteSettings.id }).from(websiteSettings).where(eq(websiteSettings.id, 1)).limit(1);
  if (existing) { log("Website settings already exist — skipped"); return; }

  await db.insert(websiteSettings).values({
    siteName: process.env.SITE_NAME || "WedSaaS",
    tagline: "Platform Undangan Pernikahan Digital",
    supportEmail: process.env.ADMIN_EMAIL || "admin@wedsaas.app",
    supportWhatsapp: "",
    businessAddress: "",
    primaryColor: "#e11d48",
    secondaryColor: "#f43f5e",
    maintenanceMode: false,
    registrationEnabled: true,
    trialEnabled: false,
    privacyPolicyUrl: "",
    termsUrl: "",
  });
  log("Website settings seeded");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SEO settings (singleton id=1)
// ─────────────────────────────────────────────────────────────────────────────
async function seedSeoSettings() {
  const [existing] = await db.select({ id: seoSettings.id }).from(seoSettings).where(eq(seoSettings.id, 1)).limit(1);
  if (existing) { log("SEO settings already exist — skipped"); return; }

  const siteName = process.env.SITE_NAME || "WedSaaS";
  await db.insert(seoSettings).values({
    homepageMetaTitle: `${siteName} — Undangan Pernikahan Digital`,
    homepageMetaDescription: "Buat undangan pernikahan digital yang indah dengan mudah. RSVP online, ucapan tamu, dan masih banyak lagi.",
    homepageMetaKeywords: "undangan pernikahan digital, undangan online, wedding invitation",
    ogTitle: `${siteName} — Undangan Pernikahan Digital`,
    ogDescription: "Buat undangan pernikahan digital yang indah dan berkesan.",
    twitterCard: "summary_large_image",
    canonicalUrl: process.env.APP_URL || "",
  });
  log("SEO settings seeded");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Pricing plans
// ─────────────────────────────────────────────────────────────────────────────
async function seedPricingPlans() {
  const [existing] = await db.select({ id: pricingPlans.id }).from(pricingPlans).limit(1);
  if (existing) { log("Pricing plans already exist — skipped"); return; }

  const plans = [
    {
      id: randomUUID(),
      name: "Free",
      slug: "free",
      shortDescription: "Mulai gratis, tanpa batas waktu",
      price: 0,
      billingType: "one_time" as const,
      priceLabel: "Gratis",
      badgeText: "",
      highlightColor: "#6b7280",
      sortOrder: 1,
      isActive: true,
      isPopular: false,
      ctaText: "Mulai Gratis",
      ctaLink: "/register",
      features: [
        "1 undangan digital",
        "Tema basic (Classic Elegant)",
        "Form RSVP",
        "Pesan tamu",
        "Watermark WedSaaS",
      ],
      notIncluded: [
        "Tema premium",
        "Digital gift registry",
        "Analytics lengkap",
        "Tanpa watermark",
      ],
    },
    {
      id: randomUUID(),
      name: "Premium",
      slug: "premium",
      shortDescription: "Terbaik untuk satu undangan pernikahan",
      price: 99000,
      billingType: "one_time" as const,
      priceLabel: "Rp 99.000 / undangan",
      badgeText: "Paling Populer",
      highlightColor: "#e11d48",
      sortOrder: 2,
      isActive: true,
      isPopular: true,
      ctaText: "Pilih Premium",
      ctaLink: "/dashboard/subscription",
      features: [
        "Semua fitur Free",
        "Semua tema premium",
        "Digital gift registry",
        "Analytics lengkap",
        "Tanpa watermark",
        "Prioritas support",
      ],
      notIncluded: [],
    },
    {
      id: randomUUID(),
      name: "Business",
      slug: "business",
      shortDescription: "Untuk fotografer & wedding organizer",
      price: 299000,
      billingType: "monthly" as const,
      priceLabel: "Rp 299.000 / bulan",
      badgeText: "",
      highlightColor: "#7c3aed",
      sortOrder: 3,
      isActive: true,
      isPopular: false,
      ctaText: "Pilih Business",
      ctaLink: "/dashboard/subscription",
      features: [
        "Undangan tidak terbatas",
        "Semua fitur Premium",
        "White label",
        "Custom domain (segera hadir)",
        "Dedicated support",
      ],
      notIncluded: [],
    },
  ];

  for (const plan of plans) {
    const { features, notIncluded, ...planData } = plan;
    await db.insert(pricingPlans).values(planData);

    let order = 0;
    for (const f of features) {
      await db.insert(pricingPlanFeatures).values({
        id: randomUUID(),
        planId: plan.id,
        featureName: f,
        included: true,
        sortOrder: order++,
      });
    }
    for (const f of notIncluded) {
      await db.insert(pricingPlanFeatures).values({
        id: randomUUID(),
        planId: plan.id,
        featureName: f,
        included: false,
        sortOrder: order++,
      });
    }
  }
  log("Pricing plans seeded (Free, Premium, Business)");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export async function seedDatabase() {
  try {
    await seedAdmin();
    await seedDemo();
    await seedBankAccounts();
    await seedWebsiteSettings();
    await seedSeoSettings();
    await seedPricingPlans();
  } catch (err) {
    console.error("[seed] Error during seeding:", err);
  }
}
