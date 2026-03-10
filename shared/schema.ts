import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const planEnum = pgEnum("plan", ["free", "premium", "business"]);
export const statusEnum = pgEnum("invitation_status", ["draft", "published", "archived"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["pending", "attending", "not_attending"]);
export const themeEnum = pgEnum("theme", ["classic_elegant", "minimal_modern", "romantic_floral", "luxury_gold"]);
export const giftTypeEnum = pgEnum("gift_type", ["bank", "wallet"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "cancelled", "expired"]);
export const billingTypeEnum = pgEnum("billing_type", ["one_time", "monthly", "yearly"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "waiting_confirmation", "paid", "rejected", "expired", "canceled"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull().default(""),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  plan: planEnum("plan").notNull().default("free"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  referralCode: varchar("referral_code").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  theme: themeEnum("theme").notNull().default("classic_elegant"),
  status: statusEnum("status").notNull().default("draft"),
  coverImage: text("cover_image"),
  giftAddress: text("gift_address").notNull().default(""),
  views: integer("views").notNull().default(0),
  publishedAt: timestamp("published_at"),
  customThemeId: varchar("custom_theme_id"),
  saveTheDateEnabled: boolean("save_the_date_enabled").notNull().default(false),
  saveTheDateMessage: text("save_the_date_message").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invitationCouples = pgTable("invitation_couples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().unique().references(() => invitations.id, { onDelete: "cascade" }),
  brideName: text("bride_name").notNull().default(""),
  groomName: text("groom_name").notNull().default(""),
  brideParents: text("bride_parents").notNull().default(""),
  groomParents: text("groom_parents").notNull().default(""),
  loveStory: text("love_story").notNull().default(""),
  bridePhoto: text("bride_photo"),
  groomPhoto: text("groom_photo"),
  couplePhoto: text("couple_photo"),
});

export const invitationEvents = pgTable("invitation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().unique().references(() => invitations.id, { onDelete: "cascade" }),
  akadDate: text("akad_date").notNull().default(""),
  akadTime: text("akad_time").notNull().default(""),
  akadVenue: text("akad_venue").notNull().default(""),
  akadMapsLink: text("akad_maps_link").notNull().default(""),
  receptionDate: text("reception_date").notNull().default(""),
  receptionTime: text("reception_time").notNull().default(""),
  receptionVenue: text("reception_venue").notNull().default(""),
  receptionMapsLink: text("reception_maps_link").notNull().default(""),
});

export const invitationContent = pgTable("invitation_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().unique().references(() => invitations.id, { onDelete: "cascade" }),
  openingQuote: text("opening_quote").notNull().default(""),
  closingMessage: text("closing_message").notNull().default(""),
  hashtag: text("hashtag").notNull().default(""),
  livestreamLink: text("livestream_link").notNull().default(""),
  backgroundMusic: text("background_music").notNull().default(""),
  musicEnabled: boolean("music_enabled").notNull().default(false),
  musicLabel: text("music_label").notNull().default(""),
  showMusicControl: boolean("show_music_control").notNull().default(true),
  enableRsvp: boolean("enable_rsvp").notNull().default(true),
  rsvpDeadline: text("rsvp_deadline").notNull().default(""),
  maxGuests: integer("max_guests").notNull().default(2),
  colorPreset: text("color_preset").notNull().default("classic"),
  videoUrl: text("video_url").notNull().default(""),
});

export const invitationGallery = pgTable("invitation_gallery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Guest Management (defined before rsvps to avoid forward ref) ──────────────

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  category: text("category").notNull().default("lainnya"), // keluarga | teman | kantor | vip | lainnya
  guestCount: integer("guest_count").notNull().default(1),
  notes: text("notes"),
  customLinkToken: varchar("custom_link_token").unique(),
  invitedStatus: boolean("invited_status").notNull().default(false),
  rsvpStatus: text("rsvp_status").notNull().default("pending"), // pending | attending | not_attending
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rsvps = pgTable("rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id").references(() => guests.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull().default(""),
  guestCount: integer("guest_count").notNull().default(1),
  status: rsvpStatusEnum("status").notNull().default("pending"),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const guestMessages = pgTable("guest_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giftAccounts = pgTable("gift_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  type: giftTypeEnum("type").notNull().default("bank"),
  bankName: text("bank_name").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  accountHolder: text("account_holder").notNull().default(""),
  walletName: text("wallet_name").notNull().default(""),
  walletNumber: text("wallet_number").notNull().default(""),
  qrisUrl: text("qris_url").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giftConfirmations = pgTable("gift_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: text("amount").notNull().default(""),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  paymentRef: text("payment_ref"),
  amount: integer("amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const whiteLabelSettings = pgTable("white_label_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull().default(""),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#e11d48"),
  customDomain: text("custom_domain"),
  hideWatermark: boolean("hide_watermark").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Media Library ─────────────────────────────────────────────────────────────

export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  mediaType: text("media_type").notNull().default("image"), // image | audio
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Custom Domains ────────────────────────────────────────────────────────────

export const customDomains = pgTable("custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  status: text("status").notNull().default("pending"), // not_configured | pending | active | failed
  verifiedAt: timestamp("verified_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Coupons ───────────────────────────────────────────────────────────────────

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage | fixed
  discountValue: integer("discount_value").notNull(),
  minAmount: integer("min_amount").notNull().default(0),
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  applicablePlans: text("applicable_plans").array(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentId: varchar("payment_id"),
  discountApplied: integer("discount_applied").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Referrals ─────────────────────────────────────────────────────────────────

export const referralUsages = pgTable("referral_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refereeId: varchar("referee_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── CMS Landing Page ──────────────────────────────────────────────────────────

export const landingPageSettings = pgTable("landing_page_settings", {
  id: serial("id").primaryKey(),
  heroTitle: text("hero_title").notNull().default("Undangan Pernikahan Digital yang Indah & Berkesan"),
  heroSubtitle: text("hero_subtitle").notNull().default("Buat undangan pernikahan digital impian Anda dalam hitungan menit. RSVP online, ucapan tamu, galeri foto, dan masih banyak lagi."),
  heroCtaText: text("hero_cta_text").notNull().default("Mulai Gratis Sekarang"),
  heroCtaSecondaryText: text("hero_cta_secondary_text").notNull().default("Lihat Demo"),
  featuresTitle: text("features_title").notNull().default("Semua yang Kamu Butuhkan"),
  featuresSubtitle: text("features_subtitle").notNull().default("Fitur lengkap untuk undangan pernikahan digital yang sempurna"),
  featuresData: text("features_data").notNull().default("[]"),
  howItWorksTitle: text("how_it_works_title").notNull().default("Cara Kerja"),
  howItWorksSubtitle: text("how_it_works_subtitle").notNull().default("Tiga langkah mudah untuk undangan impian Anda"),
  howItWorksData: text("how_it_works_data").notNull().default("[]"),
  ctaTitle: text("cta_title").notNull().default("Siap Membuat Undangan Impian?"),
  ctaSubtitle: text("cta_subtitle").notNull().default("Bergabung dengan ribuan pasangan yang sudah menggunakan WedSaaS"),
  ctaButtonText: text("cta_button_text").notNull().default("Buat Undangan Gratis"),
  footerTagline: text("footer_tagline").notNull().default("Platform Undangan Pernikahan Digital terbaik di Indonesia"),
  showFeatures: boolean("show_features").notNull().default(true),
  showHowItWorks: boolean("show_how_it_works").notNull().default(true),
  showTestimonials: boolean("show_testimonials").notNull().default(true),
  showPricing: boolean("show_pricing").notNull().default(true),
  showFaq: boolean("show_faq").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── New admin tables ──────────────────────────────────────────────────────────

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coupleName: text("couple_name").notNull(),
  avatarInitials: text("avatar_initials").notNull().default(""),
  testimonialText: text("testimonial_text").notNull(),
  rating: integer("rating").notNull().default(5),
  weddingDateLabel: text("wedding_date_label").notNull().default(""),
  photo: text("photo"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("umum"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull().default(""),
  price: integer("price").notNull().default(0),
  billingType: billingTypeEnum("billing_type").notNull().default("monthly"),
  priceLabel: text("price_label").notNull().default(""),
  badgeText: text("badge_text").notNull().default(""),
  highlightColor: text("highlight_color").notNull().default("#e11d48"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isPopular: boolean("is_popular").notNull().default(false),
  ctaText: text("cta_text").notNull().default("Pilih Paket"),
  ctaLink: text("cta_link").notNull().default("/register"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pricingPlanFeatures = pgTable("pricing_plan_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => pricingPlans.id, { onDelete: "cascade" }),
  featureName: text("feature_name").notNull(),
  included: boolean("included").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull().default(""),
  entityId: text("entity_id").notNull().default(""),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const websiteSettings = pgTable("website_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("WedSaaS"),
  tagline: text("tagline").notNull().default("Platform Undangan Pernikahan Digital"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  supportEmail: text("support_email").notNull().default(""),
  supportWhatsapp: text("support_whatsapp").notNull().default(""),
  businessAddress: text("business_address").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#e11d48"),
  secondaryColor: text("secondary_color").notNull().default("#f43f5e"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  registrationEnabled: boolean("registration_enabled").notNull().default(true),
  trialEnabled: boolean("trial_enabled").notNull().default(false),
  privacyPolicyUrl: text("privacy_policy_url").notNull().default(""),
  termsUrl: text("terms_url").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  homepageMetaTitle: text("homepage_meta_title").notNull().default("WedSaaS — Undangan Pernikahan Digital"),
  homepageMetaDescription: text("homepage_meta_description").notNull().default(""),
  homepageMetaKeywords: text("homepage_meta_keywords").notNull().default(""),
  ogTitle: text("og_title").notNull().default(""),
  ogDescription: text("og_description").notNull().default(""),
  ogImageUrl: text("og_image_url"),
  twitterCard: text("twitter_card").notNull().default("summary_large_image"),
  canonicalUrl: text("canonical_url").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Wedding Theme Builder tables ──────────────────────────────────────────────

export const weddingThemes = pgTable("wedding_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("draft"),
  globalSettings: text("global_settings").notNull().default("{}"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const weddingThemeBlocks = pgTable("wedding_theme_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeId: varchar("theme_id").notNull().references(() => weddingThemes.id, { onDelete: "cascade" }),
  blockType: text("block_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  content: text("content").notNull().default("{}"),
  style: text("style").notNull().default("{}"),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Bank accounts (for manual transfer payment) ───────────────────────────────
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  branch: text("branch"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Payments (manual bank transfer invoices) ─────────────────────────────────
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(),
  uniqueCode: integer("unique_code").notNull(),
  finalAmount: integer("final_amount").notNull(),
  couponCode: text("coupon_code"),
  discountAmount: integer("discount_amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transferProofUrl: text("transfer_proof_url"),
  rejectedReason: text("rejected_reason"),
  adminNotes: text("admin_notes"),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── File Uploads ──────────────────────────────────────────────────────────────
export const fileUploads = pgTable("file_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Insert schemas ───────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true, createdAt: true, updatedAt: true, views: true });
export const insertCoupleSchema = createInsertSchema(invitationCouples).omit({ id: true });
export const insertEventsSchema = createInsertSchema(invitationEvents).omit({ id: true });
export const insertContentSchema = createInsertSchema(invitationContent).omit({ id: true });
export const insertGallerySchema = createInsertSchema(invitationGallery).omit({ id: true, createdAt: true });
export const insertRsvpSchema = createInsertSchema(rsvps).omit({ id: true, createdAt: true });
export const insertGuestMessageSchema = createInsertSchema(guestMessages).omit({ id: true, createdAt: true });
export const insertGiftAccountSchema = createInsertSchema(giftAccounts).omit({ id: true, createdAt: true });
export const insertGiftConfirmationSchema = createInsertSchema(giftConfirmations).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWhiteLabelSchema = createInsertSchema(whiteLabelSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true, createdAt: true });
export const insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({ id: true, createdAt: true });
export const insertPricingPlanFeatureSchema = createInsertSchema(pricingPlanFeatures).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export const insertWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({ id: true, updatedAt: true });
export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({ id: true, updatedAt: true });
export const insertWeddingThemeSchema = createInsertSchema(weddingThemes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWeddingThemeBlockSchema = createInsertSchema(weddingThemeBlocks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, createdAt: true });
export const insertGuestSchema = createInsertSchema(guests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true });
export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usedCount: true });
export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({ id: true, createdAt: true });
export const insertReferralUsageSchema = createInsertSchema(referralUsages).omit({ id: true, createdAt: true });
export const insertLandingPageSettingsSchema = createInsertSchema(landingPageSettings).omit({ id: true, updatedAt: true });

// ── Types ────────────────────────────────────────────────────────────────────

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type InvitationCouple = typeof invitationCouples.$inferSelect;
export type InvitationEvents = typeof invitationEvents.$inferSelect;
export type InvitationContent = typeof invitationContent.$inferSelect;
export type GalleryImage = typeof invitationGallery.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type GuestMessage = typeof guestMessages.$inferSelect;
export type InsertGuestMessage = z.infer<typeof insertGuestMessageSchema>;
export type GiftAccount = typeof giftAccounts.$inferSelect;
export type InsertGiftAccount = z.infer<typeof insertGiftAccountSchema>;
export type GiftConfirmation = typeof giftConfirmations.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type WhiteLabelSettings = typeof whiteLabelSettings.$inferSelect;
export type InsertWhiteLabel = z.infer<typeof insertWhiteLabelSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;
export type PricingPlanFeature = typeof pricingPlanFeatures.$inferSelect;
export type InsertPricingPlanFeature = z.infer<typeof insertPricingPlanFeatureSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type SeoSettings = typeof seoSettings.$inferSelect;

export type WeddingTheme = typeof weddingThemes.$inferSelect;
export type InsertWeddingTheme = z.infer<typeof insertWeddingThemeSchema>;
export type WeddingThemeBlock = typeof weddingThemeBlocks.$inferSelect;
export type InsertWeddingThemeBlock = z.infer<typeof insertWeddingThemeBlockSchema>;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type ReferralUsage = typeof referralUsages.$inferSelect;
export type LandingPageSettings = typeof landingPageSettings.$inferSelect;
export type InsertLandingPageSettings = z.infer<typeof insertLandingPageSettingsSchema>;

// ── Love Story Timeline ──────────────────────────────────────────────────────
export const loveStoryItems = pgTable("love_story_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dateLabelText: text("date_label").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoveStoryItemSchema = createInsertSchema(loveStoryItems).omit({ id: true, createdAt: true });
export type LoveStoryItem = typeof loveStoryItems.$inferSelect;
export type InsertLoveStoryItem = z.infer<typeof insertLoveStoryItemSchema>;

// ── Guest Event Assignments ───────────────────────────────────────────────────
export const guestEventAssignments = pgTable("guest_event_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull().unique().references(() => guests.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull().default("both"), // akad | reception | both
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuestEventAssignmentSchema = createInsertSchema(guestEventAssignments).omit({ id: true, createdAt: true });
export type GuestEventAssignment = typeof guestEventAssignments.$inferSelect;
export type InsertGuestEventAssignment = z.infer<typeof insertGuestEventAssignmentSchema>;

export type FullInvitation = Invitation & {
  couple: InvitationCouple | null;
  events: InvitationEvents | null;
  content: InvitationContent | null;
  gallery: GalleryImage[];
  giftAccounts: GiftAccount[];
};
