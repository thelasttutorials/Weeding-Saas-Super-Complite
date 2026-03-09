import { db as defaultDb, type DrizzleDB } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users, invitations, invitationCouples, invitationEvents,
  invitationContent, invitationGallery, rsvps, guestMessages,
  giftAccounts, giftConfirmations,
  type User, type InsertUser, type Invitation, type InsertInvitation,
  type InvitationCouple, type InvitationEvents, type InvitationContent,
  type GalleryImage, type Rsvp, type InsertRsvp, type GuestMessage,
  type InsertGuestMessage, type GiftAccount, type InsertGiftAccount,
  type GiftConfirmation, type FullInvitation,
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

  // Stats
  getUserStats(userId: string): Promise<{
    totalInvitations: number;
    totalRsvp: number;
    totalMessages: number;
    totalViews: number;
    attendingCount: number;
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
    await this.db.insert(invitationCouples).values({ id: randomUUID(), invitationId: inv.id, brideName: "", groomName: "", brideParents: "", groomParents: "", loveStory: "" });
    await this.db.insert(invitationEvents).values({ id: randomUUID(), invitationId: inv.id, akadDate: "", akadTime: "", akadVenue: "", akadMapsLink: "", receptionDate: "", receptionTime: "", receptionVenue: "", receptionMapsLink: "" });
    await this.db.insert(invitationContent).values({ id: randomUUID(), invitationId: inv.id, openingQuote: "", closingMessage: "", hashtag: "", livestreamLink: "", backgroundMusic: "", enableRsvp: true, rsvpDeadline: "", maxGuests: 2 });
    return inv;
  }

  async updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined> {
    const [updated] = await this.db.update(invitations).set({ ...data, updatedAt: new Date() }).where(eq(invitations.id, id)).returning();
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
    return this.db.select().from(guestMessages).where(and(eq(guestMessages.invitationId, invId), eq(guestMessages.isVisible, true))).orderBy(desc(guestMessages.createdAt));
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
    return this.db.select().from(giftConfirmations).where(eq(giftConfirmations.invitationId, invId)).orderBy(desc(giftConfirmations.createdAt));
  }

  async createGiftConfirmation(data: Omit<GiftConfirmation, "id" | "createdAt">): Promise<GiftConfirmation> {
    const [conf] = await this.db.insert(giftConfirmations).values({ ...data, id: randomUUID() }).returning();
    return conf;
  }

  async getUserStats(userId: string) {
    const userInvitations = await this.getInvitationsByUser(userId);
    let totalRsvp = 0, totalMessages = 0, totalViews = 0, attendingCount = 0;
    for (const inv of userInvitations) {
      totalViews += inv.views;
      const rsvpList = await this.getRsvpsByInvitation(inv.id);
      totalRsvp += rsvpList.length;
      attendingCount += rsvpList.filter(r => r.status === "attending").length;
      const msgs = await this.getAllMessagesByInvitation(inv.id);
      totalMessages += msgs.length;
    }
    return {
      totalInvitations: userInvitations.length,
      totalRsvp,
      totalMessages,
      totalViews,
      attendingCount,
    };
  }
}

export const storage = new DatabaseStorage();

export function createStorage(dbInstance?: DrizzleDB): DatabaseStorage {
  return new DatabaseStorage(dbInstance);
}
