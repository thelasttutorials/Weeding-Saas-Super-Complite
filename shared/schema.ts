import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const planEnum = pgEnum("plan", ["free", "premium", "business"]);
export const statusEnum = pgEnum("invitation_status", ["draft", "published", "archived"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["pending", "attending", "not_attending"]);
export const themeEnum = pgEnum("theme", ["classic_elegant", "minimal_modern", "romantic_floral", "luxury_gold"]);
export const giftTypeEnum = pgEnum("gift_type", ["bank", "wallet"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "cancelled", "expired"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull().default(""),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  plan: planEnum("plan").notNull().default("free"),
  isAdmin: boolean("is_admin").notNull().default(false),
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
  views: integer("views").notNull().default(0),
  publishedAt: timestamp("published_at"),
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
  enableRsvp: boolean("enable_rsvp").notNull().default(true),
  rsvpDeadline: text("rsvp_deadline").notNull().default(""),
  maxGuests: integer("max_guests").notNull().default(2),
});

export const invitationGallery = pgTable("invitation_gallery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rsvps = pgTable("rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
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

export type FullInvitation = Invitation & {
  couple: InvitationCouple | null;
  events: InvitationEvents | null;
  content: InvitationContent | null;
  gallery: GalleryImage[];
  giftAccounts: GiftAccount[];
};
