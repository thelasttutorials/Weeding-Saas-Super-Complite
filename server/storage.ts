import { db as defaultDb, type DrizzleDB } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users, invitations, invitationCouples, invitationEvents,
  invitationContent, invitationGallery, rsvps, guestMessages,
  giftAccounts, giftConfirmations, subscriptions, whiteLabelSettings,
  testimonials, faqs, pricingPlans, pricingPlanFeatures, auditLogs,
  websiteSettings, seoSettings, weddingThemes, weddingThemeBlocks,
  type User, type InsertUser, type Invitation, type InsertInvitation,
  type InvitationCouple, type InvitationEvents, type InvitationContent,
  type GalleryImage, type Rsvp, type InsertRsvp, type GuestMessage,
  type InsertGuestMessage, type GiftAccount, type InsertGiftAccount,
  type GiftConfirmation, type FullInvitation,
  type Subscription, type InsertSubscription,
  type WhiteLabelSettings, type InsertWhiteLabel,
  type Testimonial, type InsertTestimonial,
  type Faq, type InsertFaq,
  type PricingPlan, type InsertPricingPlan,
  type PricingPlanFeature, type InsertPricingPlanFeature,
  type AuditLog, type InsertAuditLog,
  type WebsiteSettings, type SeoSettings,
  type WeddingTheme, type InsertWeddingTheme,
  type WeddingThemeBlock, type InsertWeddingThemeBlock,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Invitations
  getInvitationsByUser(userId: string): Promise<Invitation[]>;
  getInvitationById(id: string): Promise<Invitation | undefined>;
  getInvitationBySlug(slug: string): Promise<Invitation | undefined>;
  getFullInvitationBySlug(slug: string): Promise<FullInvitation | undefined>;
  checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;
  createInvitation(inv: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined>;
  deleteInvitation(id: string): Promise<void>;
  incrementViews(id: string): Promise<void>;

  // Couple
  getCoupleByInvitation(invId: string): Promise<InvitationCouple | undefined>;
  upsertCouple(data: Omit<InvitationCouple, "id">): Promise<InvitationCouple>;

  // Events
  getEventsByInvitation(invId: string): Promise<InvitationEvents | undefined>;
  upsertEvents(data: Omit<InvitationEvents, "id">): Promise<InvitationEvents>;

  // Content
  getContentByInvitation(invId: string): Promise<InvitationContent | undefined>;
  upsertContent(data: Omit<InvitationContent, "id">): Promise<InvitationContent>;

  // Gallery
  getGalleryByInvitation(invId: string): Promise<GalleryImage[]>;
  addGalleryImage(data: Omit<GalleryImage, "id" | "createdAt">): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;

  // RSVPs
  getRsvpsByInvitation(invId: string): Promise<Rsvp[]>;
  createRsvp(data: InsertRsvp): Promise<Rsvp>;

  // Guest Messages
  getMessagesByInvitation(invId: string): Promise<GuestMessage[]>;
  getAllMessagesByInvitation(invId: string): Promise<GuestMessage[]>;
  createGuestMessage(data: InsertGuestMessage): Promise<GuestMessage>;
  updateMessageVisibility(id: string, visible: boolean): Promise<void>;

  // Gift Accounts
  getGiftAccountsByInvitation(invId: string): Promise<GiftAccount[]>;
  createGiftAccount(data: InsertGiftAccount): Promise<GiftAccount>;
  deleteGiftAccount(id: string): Promise<void>;

  // Gift Confirmations
  getGiftConfirmationsByInvitation(invId: string): Promise<GiftConfirmation[]>;
  createGiftConfirmation(data: Omit<GiftConfirmation, "id" | "createdAt">): Promise<GiftConfirmation>;

  // Subscriptions
  getSubscriptionByUser(userId: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;

  // White Label
  getWhiteLabelByUser(userId: string): Promise<WhiteLabelSettings | undefined>;
  upsertWhiteLabel(data: InsertWhiteLabel): Promise<WhiteLabelSettings>;

  // Stats
  getUserStats(userId: string): Promise<{
    totalInvitations: number;
    totalRsvp: number;
    totalMessages: number;
    totalViews: number;
    attendingCount: number;
    totalGiftConfirmations: number;
  }>;

  // Admin
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(data: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<void>;

  getFaqs(): Promise<Faq[]>;
  createFaq(data: InsertFaq): Promise<Faq>;
  updateFaq(id: string, data: Partial<Faq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<void>;

  getPricingPlans(): Promise<PricingPlan[]>;
  createPricingPlan(data: InsertPricingPlan): Promise<PricingPlan>;
  updatePricingPlan(id: string, data: Partial<PricingPlan>): Promise<PricingPlan | undefined>;
  deletePricingPlan(id: string): Promise<void>;

  getPricingPlanFeatures(planId: string): Promise<PricingPlanFeature[]>;
  upsertPricingPlanFeatures(planId: string, features: Omit<PricingPlanFeature, "id" | "planId">[]): Promise<void>;

  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<(AuditLog & { adminUsername: string })[]>;

  getWebsiteSettings(): Promise<WebsiteSettings>;
  updateWebsiteSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings>;

  getSeoSettings(): Promise<SeoSettings>;
  updateSeoSettings(data: Partial<SeoSettings>): Promise<SeoSettings>;

  suspendUser(id: string): Promise<void>;
  unsuspendUser(id: string): Promise<void>;
  toggleAdminStatus(id: string): Promise<void>;

  getAdminSubscriptions(): Promise<(Subscription & { username: string, email: string })[]>;

  adminPublishInvitation(id: string): Promise<void>;
  adminUnpublishInvitation(id: string): Promise<void>;
  adminArchiveInvitation(id: string): Promise<void>;

  getAdminUserDetail(id: string): Promise<{ user: User; invitations: Invitation[] } | undefined>;

  getAllUsers(): Promise<Omit<User, "password">[]>;
  getAllInvitations(): Promise<(Invitation & { ownerUsername: string })[]>;

  // Wedding Theme Builder
  getWeddingThemes(): Promise<WeddingTheme[]>;
  getWeddingTheme(id: string): Promise<WeddingTheme | undefined>;
  getWeddingThemeBySlug(slug: string): Promise<WeddingTheme | undefined>;
  createWeddingTheme(data: InsertWeddingTheme): Promise<WeddingTheme>;
  updateWeddingTheme(id: string, data: Partial<WeddingTheme>): Promise<WeddingTheme | undefined>;
  deleteWeddingTheme(id: string): Promise<void>;
  duplicateWeddingTheme(id: string, createdBy: string): Promise<WeddingTheme>;
  getThemeBlocks(themeId: string): Promise<WeddingThemeBlock[]>;
  createThemeBlock(data: InsertWeddingThemeBlock): Promise<WeddingThemeBlock>;
  updateThemeBlock(id: string, data: Partial<WeddingThemeBlock>): Promise<WeddingThemeBlock | undefined>;
  deleteThemeBlock(id: string): Promise<void>;
  reorderThemeBlocks(themeId: string, blockIds: string[]): Promise<void>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalInvitations: number;
    totalRsvp: number;
    totalMessages: number;
    totalGiftConfirmations: number;
    publishedInvitations: number;
    totalTestimonials: number;
    totalFaqs: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  private db: DrizzleDB;

  constructor(dbInstance: DrizzleDB = defaultDb) {
    this.db = dbInstance;
  }

  async getUser(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await this.db.insert(users).values({ ...user, id: randomUUID() }).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getInvitationsByUser(userId: string): Promise<Invitation[]> {
    return this.db.select().from(invitations).where(eq(invitations.userId, userId)).orderBy(desc(invitations.createdAt));
  }

  async getInvitationById(id: string): Promise<Invitation | undefined> {
    const [inv] = await this.db.select().from(invitations).where(eq(invitations.id, id));
    return inv;
  }

  async getInvitationBySlug(slug: string): Promise<Invitation | undefined> {
    const [inv] = await this.db.select().from(invitations).where(eq(invitations.slug, slug));
    return inv;
  }

  async checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.getInvitationBySlug(slug);
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  async getFullInvitationBySlug(slug: string): Promise<FullInvitation | undefined> {
    const inv = await this.getInvitationBySlug(slug);
    if (!inv) return undefined;

    const [couple] = await this.db.select().from(invitationCouples).where(eq(invitationCouples.invitationId, inv.id));
    const [events] = await this.db.select().from(invitationEvents).where(eq(invitationEvents.invitationId, inv.id));
    const [content] = await this.db.select().from(invitationContent).where(eq(invitationContent.invitationId, inv.id));
    const gallery = await this.db.select().from(invitationGallery).where(eq(invitationGallery.invitationId, inv.id)).orderBy(invitationGallery.sortOrder);
    const gifts = await this.db.select().from(giftAccounts).where(eq(giftAccounts.invitationId, inv.id));

    return {
      ...inv,
      couple: couple || null,
      events: events || null,
      content: content || null,
      gallery,
      giftAccounts: gifts,
    };
  }

  async createInvitation(data: InsertInvitation): Promise<Invitation> {
    const [inv] = await this.db.insert(invitations).values({ ...data, id: randomUUID() }).returning();
    // Auto-init child records so builder tabs always have data to load
    await this.db.insert(invitationCouples).values({
      id: randomUUID(), invitationId: inv.id,
      brideName: "", groomName: "", brideParents: "", groomParents: "", loveStory: "",
    });
    await this.db.insert(invitationEvents).values({
      id: randomUUID(), invitationId: inv.id,
      akadDate: "", akadTime: "", akadVenue: "", akadMapsLink: "",
      receptionDate: "", receptionTime: "", receptionVenue: "", receptionMapsLink: "",
    });
    await this.db.insert(invitationContent).values({
      id: randomUUID(), invitationId: inv.id,
      openingQuote: "", closingMessage: "", hashtag: "", livestreamLink: "",
      backgroundMusic: "", enableRsvp: true, rsvpDeadline: "", maxGuests: 2,
    });
    return inv;
  }

  async updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined> {
    const [updated] = await this.db.update(invitations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invitations.id, id))
      .returning();
    return updated;
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.db.delete(invitations).where(eq(invitations.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await this.db.execute(sql`SELECT increment_invitation_views(${id})`);
  }

  async getCoupleByInvitation(invId: string): Promise<InvitationCouple | undefined> {
    const [couple] = await this.db.select().from(invitationCouples).where(eq(invitationCouples.invitationId, invId));
    return couple;
  }

  async upsertCouple(data: Omit<InvitationCouple, "id">): Promise<InvitationCouple> {
    const existing = await this.getCoupleByInvitation(data.invitationId);
    if (existing) {
      const [updated] = await this.db.update(invitationCouples).set(data).where(eq(invitationCouples.invitationId, data.invitationId)).returning();
      return updated;
    }
    const [created] = await this.db.insert(invitationCouples).values({ ...data, id: randomUUID() }).returning();
    return created;
  }

  async getEventsByInvitation(invId: string): Promise<InvitationEvents | undefined> {
    const [events] = await this.db.select().from(invitationEvents).where(eq(invitationEvents.invitationId, invId));
    return events;
  }

  async upsertEvents(data: Omit<InvitationEvents, "id">): Promise<InvitationEvents> {
    const existing = await this.getEventsByInvitation(data.invitationId);
    if (existing) {
      const [updated] = await this.db.update(invitationEvents).set(data).where(eq(invitationEvents.invitationId, data.invitationId)).returning();
      return updated;
    }
    const [created] = await this.db.insert(invitationEvents).values({ ...data, id: randomUUID() }).returning();
    return created;
  }

  async getContentByInvitation(invId: string): Promise<InvitationContent | undefined> {
    const [content] = await this.db.select().from(invitationContent).where(eq(invitationContent.invitationId, invId));
    return content;
  }

  async upsertContent(data: Omit<InvitationContent, "id">): Promise<InvitationContent> {
    const existing = await this.getContentByInvitation(data.invitationId);
    if (existing) {
      const [updated] = await this.db.update(invitationContent).set(data).where(eq(invitationContent.invitationId, data.invitationId)).returning();
      return updated;
    }
    const [created] = await this.db.insert(invitationContent).values({ ...data, id: randomUUID() }).returning();
    return created;
  }

  async getGalleryByInvitation(invId: string): Promise<GalleryImage[]> {
    return this.db.select().from(invitationGallery).where(eq(invitationGallery.invitationId, invId)).orderBy(invitationGallery.sortOrder);
  }

  async addGalleryImage(data: Omit<GalleryImage, "id" | "createdAt">): Promise<GalleryImage> {
    const [img] = await this.db.insert(invitationGallery).values({ ...data, id: randomUUID() }).returning();
    return img;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await this.db.delete(invitationGallery).where(eq(invitationGallery.id, id));
  }

  async getRsvpsByInvitation(invId: string): Promise<Rsvp[]> {
    return this.db.select().from(rsvps).where(eq(rsvps.invitationId, invId)).orderBy(desc(rsvps.createdAt));
  }

  async createRsvp(data: InsertRsvp): Promise<Rsvp> {
    const [rsvp] = await this.db.insert(rsvps).values({ ...data, id: randomUUID() }).returning();
    return rsvp;
  }

  async getMessagesByInvitation(invId: string): Promise<GuestMessage[]> {
    return this.db.select().from(guestMessages)
      .where(and(eq(guestMessages.invitationId, invId), eq(guestMessages.isVisible, true)))
      .orderBy(desc(guestMessages.createdAt));
  }

  async getAllMessagesByInvitation(invId: string): Promise<GuestMessage[]> {
    return this.db.select().from(guestMessages).where(eq(guestMessages.invitationId, invId)).orderBy(desc(guestMessages.createdAt));
  }

  async createGuestMessage(data: InsertGuestMessage): Promise<GuestMessage> {
    const [msg] = await this.db.insert(guestMessages).values({ ...data, id: randomUUID() }).returning();
    return msg;
  }

  async updateMessageVisibility(id: string, visible: boolean): Promise<void> {
    await this.db.update(guestMessages).set({ isVisible: visible }).where(eq(guestMessages.id, id));
  }

  async getGiftAccountsByInvitation(invId: string): Promise<GiftAccount[]> {
    return this.db.select().from(giftAccounts).where(eq(giftAccounts.invitationId, invId));
  }

  async createGiftAccount(data: InsertGiftAccount): Promise<GiftAccount> {
    const [gift] = await this.db.insert(giftAccounts).values({ ...data, id: randomUUID() }).returning();
    return gift;
  }

  async deleteGiftAccount(id: string): Promise<void> {
    await this.db.delete(giftAccounts).where(eq(giftAccounts.id, id));
  }

  async getGiftConfirmationsByInvitation(invId: string): Promise<GiftConfirmation[]> {
    return this.db.select().from(giftConfirmations)
      .where(eq(giftConfirmations.invitationId, invId))
      .orderBy(desc(giftConfirmations.createdAt));
  }

  async createGiftConfirmation(data: Omit<GiftConfirmation, "id" | "createdAt">): Promise<GiftConfirmation> {
    const [conf] = await this.db.insert(giftConfirmations).values({ ...data, id: randomUUID() }).returning();
    return conf;
  }

  async getSubscriptionByUser(userId: string): Promise<Subscription | undefined> {
    const [sub] = await this.db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return sub;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [sub] = await this.db.insert(subscriptions).values({ ...data, id: randomUUID() }).returning();
    return sub;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await this.db.update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async getWhiteLabelByUser(userId: string): Promise<WhiteLabelSettings | undefined> {
    const [wl] = await this.db.select().from(whiteLabelSettings).where(eq(whiteLabelSettings.userId, userId));
    return wl;
  }

  async upsertWhiteLabel(data: InsertWhiteLabel): Promise<WhiteLabelSettings> {
    const existing = await this.getWhiteLabelByUser(data.userId);
    if (existing) {
      const [updated] = await this.db.update(whiteLabelSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(whiteLabelSettings.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(whiteLabelSettings).values({ ...data, id: randomUUID() }).returning();
    return created;
  }

  async getUserStats(userId: string) {
    const userInvitations = await this.getInvitationsByUser(userId);
    let totalRsvp = 0, totalMessages = 0, totalViews = 0, attendingCount = 0, totalGiftConfirmations = 0;
    for (const inv of userInvitations) {
      totalViews += inv.views;
      const rsvpList = await this.getRsvpsByInvitation(inv.id);
      totalRsvp += rsvpList.length;
      attendingCount += rsvpList.filter(r => r.status === "attending").length;
      const msgs = await this.getAllMessagesByInvitation(inv.id);
      totalMessages += msgs.length;
      const confs = await this.getGiftConfirmationsByInvitation(inv.id);
      totalGiftConfirmations += confs.length;
    }
    return {
      totalInvitations: userInvitations.length,
      totalRsvp,
      totalMessages,
      totalViews,
      attendingCount,
      totalGiftConfirmations,
    };
  }

  // ── Admin implementation ───────────────────────────────────────────────────

  async getTestimonials(): Promise<Testimonial[]> {
    return this.db.select().from(testimonials).orderBy(desc(testimonials.sortOrder), desc(testimonials.createdAt));
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [res] = await this.db.insert(testimonials).values({ ...data, id: randomUUID() }).returning();
    return res;
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const [res] = await this.db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return res;
  }

  async deleteTestimonial(id: string): Promise<void> {
    await this.db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async getFaqs(): Promise<Faq[]> {
    return this.db.select().from(faqs).orderBy(desc(faqs.sortOrder), desc(faqs.createdAt));
  }

  async createFaq(data: InsertFaq): Promise<Faq> {
    const [res] = await this.db.insert(faqs).values({ ...data, id: randomUUID() }).returning();
    return res;
  }

  async updateFaq(id: string, data: Partial<Faq>): Promise<Faq | undefined> {
    const [res] = await this.db.update(faqs).set(data).where(eq(faqs.id, id)).returning();
    return res;
  }

  async deleteFaq(id: string): Promise<void> {
    await this.db.delete(faqs).where(eq(faqs.id, id));
  }

  async getPricingPlans(): Promise<PricingPlan[]> {
    return this.db.select().from(pricingPlans).orderBy(desc(pricingPlans.sortOrder), desc(pricingPlans.createdAt));
  }

  async createPricingPlan(data: InsertPricingPlan): Promise<PricingPlan> {
    const [res] = await this.db.insert(pricingPlans).values({ ...data, id: randomUUID() }).returning();
    return res;
  }

  async updatePricingPlan(id: string, data: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    const [res] = await this.db.update(pricingPlans).set(data).where(eq(pricingPlans.id, id)).returning();
    return res;
  }

  async deletePricingPlan(id: string): Promise<void> {
    await this.db.delete(pricingPlans).where(eq(pricingPlans.id, id));
  }

  async getPricingPlanFeatures(planId: string): Promise<PricingPlanFeature[]> {
    return this.db.select().from(pricingPlanFeatures).where(eq(pricingPlanFeatures.planId, planId)).orderBy(pricingPlanFeatures.sortOrder);
  }

  async upsertPricingPlanFeatures(planId: string, features: Omit<PricingPlanFeature, "id" | "planId">[]): Promise<void> {
    await this.db.delete(pricingPlanFeatures).where(eq(pricingPlanFeatures.planId, planId));
    if (features.length > 0) {
      await this.db.insert(pricingPlanFeatures).values(
        features.map(f => ({ ...f, id: randomUUID(), planId }))
      );
    }
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [res] = await this.db.insert(auditLogs).values({ ...data, id: randomUUID() }).returning();
    return res;
  }

  async getAuditLogs(limit: number = 100): Promise<(AuditLog & { adminUsername: string })[]> {
    const res = await this.db
      .select({
        id: auditLogs.id,
        adminId: auditLogs.adminId,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        adminUsername: users.username,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.adminId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    return res.map(r => ({ ...r, adminUsername: r.adminUsername || "system" }));
  }

  async getWebsiteSettings(): Promise<WebsiteSettings> {
    let [settings] = await this.db.select().from(websiteSettings).where(eq(websiteSettings.id, 1));
    if (!settings) {
      [settings] = await this.db.insert(websiteSettings).values({ id: 1 }).returning();
    }
    return settings;
  }

  async updateWebsiteSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const [updated] = await this.db.update(websiteSettings).set({ ...data, updatedAt: new Date() }).where(eq(websiteSettings.id, 1)).returning();
    return updated;
  }

  async getSeoSettings(): Promise<SeoSettings> {
    let [settings] = await this.db.select().from(seoSettings).where(eq(seoSettings.id, 1));
    if (!settings) {
      [settings] = await this.db.insert(seoSettings).values({ id: 1 }).returning();
    }
    return settings;
  }

  async updateSeoSettings(data: Partial<SeoSettings>): Promise<SeoSettings> {
    const [updated] = await this.db.update(seoSettings).set({ ...data, updatedAt: new Date() }).where(eq(seoSettings.id, 1)).returning();
    return updated;
  }

  async suspendUser(id: string): Promise<void> {
    await this.db.update(users).set({ isSuspended: true }).where(eq(users.id, id));
  }

  async unsuspendUser(id: string): Promise<void> {
    await this.db.update(users).set({ isSuspended: false }).where(eq(users.id, id));
  }

  async toggleAdminStatus(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      await this.db.update(users).set({ isAdmin: !user.isAdmin }).where(eq(users.id, id));
    }
  }

  async getAdminSubscriptions(): Promise<(Subscription & { username: string, email: string })[]> {
    const res = await this.db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        paymentRef: subscriptions.paymentRef,
        amount: subscriptions.amount,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        username: users.username,
        email: users.email,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));
    return res.map(r => ({ ...r, username: r.username || "unknown", email: r.email || "unknown" }));
  }

  async adminPublishInvitation(id: string): Promise<void> {
    await this.db.update(invitations).set({ status: "published", publishedAt: new Date() }).where(eq(invitations.id, id));
  }

  async adminUnpublishInvitation(id: string): Promise<void> {
    await this.db.update(invitations).set({ status: "draft", publishedAt: null }).where(eq(invitations.id, id));
  }

  async adminArchiveInvitation(id: string): Promise<void> {
    await this.db.update(invitations).set({ status: "archived" }).where(eq(invitations.id, id));
  }

  async getAdminUserDetail(id: string): Promise<{ user: User; invitations: Invitation[] } | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const invList = await this.getInvitationsByUser(id);
    return { user, invitations: invList };
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    const result = await this.db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      plan: users.plan,
      isAdmin: users.isAdmin,
      isSuspended: users.isSuspended,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return result;
  }

  async getAllInvitations(): Promise<(Invitation & { ownerUsername: string })[]> {
    const result = await this.db
      .select({
        id: invitations.id,
        userId: invitations.userId,
        title: invitations.title,
        slug: invitations.slug,
        theme: invitations.theme,
        status: invitations.status,
        coverImage: invitations.coverImage,
        giftAddress: invitations.giftAddress,
        views: invitations.views,
        publishedAt: invitations.publishedAt,
        createdAt: invitations.createdAt,
        updatedAt: invitations.updatedAt,
        ownerUsername: users.username,
      })
      .from(invitations)
      .leftJoin(users, eq(invitations.userId, users.id))
      .orderBy(desc(invitations.createdAt));
    return result.map(r => ({ ...r, ownerUsername: r.ownerUsername || "unknown" }));
  }

  async getPlatformStats() {
    const [uCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [iCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(invitations);
    const [pubCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(invitations).where(eq(invitations.status, "published"));
    const [rCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(rsvps);
    const [mCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(guestMessages);
    const [gCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(giftConfirmations);
    const [tCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(testimonials);
    const [fCount] = await this.db.select({ count: sql<number>`count(*)::int` }).from(faqs);
    return {
      totalUsers: uCount.count,
      totalInvitations: iCount.count,
      publishedInvitations: pubCount.count,
      totalRsvp: rCount.count,
      totalMessages: mCount.count,
      totalGiftConfirmations: gCount.count,
      totalTestimonials: tCount.count,
      totalFaqs: fCount.count,
    };
  }

  // ── Wedding Theme Builder ─────────────────────────────────────────────────

  async getWeddingThemes(): Promise<WeddingTheme[]> {
    return this.db.select().from(weddingThemes).orderBy(desc(weddingThemes.createdAt));
  }

  async getWeddingTheme(id: string): Promise<WeddingTheme | undefined> {
    const [theme] = await this.db.select().from(weddingThemes).where(eq(weddingThemes.id, id));
    return theme;
  }

  async getWeddingThemeBySlug(slug: string): Promise<WeddingTheme | undefined> {
    const [theme] = await this.db.select().from(weddingThemes).where(eq(weddingThemes.slug, slug));
    return theme;
  }

  async createWeddingTheme(data: InsertWeddingTheme): Promise<WeddingTheme> {
    const [theme] = await this.db.insert(weddingThemes).values({ ...data, id: randomUUID() }).returning();
    return theme;
  }

  async updateWeddingTheme(id: string, data: Partial<WeddingTheme>): Promise<WeddingTheme | undefined> {
    const [theme] = await this.db.update(weddingThemes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(weddingThemes.id, id))
      .returning();
    return theme;
  }

  async deleteWeddingTheme(id: string): Promise<void> {
    await this.db.delete(weddingThemes).where(eq(weddingThemes.id, id));
  }

  async duplicateWeddingTheme(id: string, createdBy: string): Promise<WeddingTheme> {
    const original = await this.getWeddingTheme(id);
    if (!original) throw new Error("Theme not found");
    const blocks = await this.getThemeBlocks(id);
    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const [newTheme] = await this.db.insert(weddingThemes).values({
      id: randomUUID(),
      name: `${original.name} (Copy)`,
      slug: newSlug,
      description: original.description,
      thumbnailUrl: original.thumbnailUrl,
      status: "draft",
      globalSettings: original.globalSettings,
      createdBy,
    }).returning();
    for (const block of blocks) {
      await this.db.insert(weddingThemeBlocks).values({
        id: randomUUID(),
        themeId: newTheme.id,
        blockType: block.blockType,
        sortOrder: block.sortOrder,
        content: block.content,
        style: block.style,
        isVisible: block.isVisible,
      });
    }
    return newTheme;
  }

  async getThemeBlocks(themeId: string): Promise<WeddingThemeBlock[]> {
    return this.db.select().from(weddingThemeBlocks)
      .where(eq(weddingThemeBlocks.themeId, themeId))
      .orderBy(weddingThemeBlocks.sortOrder);
  }

  async createThemeBlock(data: InsertWeddingThemeBlock): Promise<WeddingThemeBlock> {
    const [block] = await this.db.insert(weddingThemeBlocks).values({ ...data, id: randomUUID() }).returning();
    return block;
  }

  async updateThemeBlock(id: string, data: Partial<WeddingThemeBlock>): Promise<WeddingThemeBlock | undefined> {
    const [block] = await this.db.update(weddingThemeBlocks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(weddingThemeBlocks.id, id))
      .returning();
    return block;
  }

  async deleteThemeBlock(id: string): Promise<void> {
    await this.db.delete(weddingThemeBlocks).where(eq(weddingThemeBlocks.id, id));
  }

  async reorderThemeBlocks(themeId: string, blockIds: string[]): Promise<void> {
    for (let i = 0; i < blockIds.length; i++) {
      await this.db.update(weddingThemeBlocks)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(weddingThemeBlocks.id, blockIds[i]), eq(weddingThemeBlocks.themeId, themeId)));
    }
  }
}

export const storage = new DatabaseStorage();

export function createStorage(dbInstance?: DrizzleDB): DatabaseStorage {
  return new DatabaseStorage(dbInstance);
}
