import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertInvitationSchema, insertRsvpSchema, insertGuestMessageSchema, insertGiftAccountSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const PgSession = connectPgSimple(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      fullName: string;
      plan: string;
      avatarUrl?: string | null;
    }
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "wedsaas-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid credentials" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "Invalid credentials" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(body.username);
      if (existing) return res.status(400).json({ message: "Username already taken" });
      const existingEmail = await storage.getUserByEmail(body.email);
      if (existingEmail) return res.status(400).json({ message: "Email already registered" });
      const hashed = await bcrypt.hash(body.password, 10);
      const user = await storage.createUser({ ...body, password: hashed });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as any;
    const { password: _, ...safe } = user;
    res.json(safe);
  });

  // Invitation routes
  app.get("/api/invitations", requireAuth, async (req, res) => {
    const invitations = await storage.getInvitationsByUser((req.user as any).id);
    res.json(invitations);
  });

  app.post("/api/invitations", requireAuth, async (req, res) => {
    try {
      const data = insertInvitationSchema.parse({ ...req.body, userId: (req.user as any).id });
      const inv = await storage.createInvitation(data);
      res.json(inv);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/invitations/:id", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    res.json(inv);
  });

  app.patch("/api/invitations/:id", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.updateInvitation(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/invitations/:id", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    await storage.deleteInvitation(req.params.id);
    res.json({ success: true });
  });

  // Builder detail routes
  app.get("/api/invitations/:id/couple", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const couple = await storage.getCoupleByInvitation(req.params.id);
    res.json(couple || {});
  });

  app.put("/api/invitations/:id/couple", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const couple = await storage.upsertCouple({ ...req.body, invitationId: req.params.id });
    res.json(couple);
  });

  app.get("/api/invitations/:id/events", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const events = await storage.getEventsByInvitation(req.params.id);
    res.json(events || {});
  });

  app.put("/api/invitations/:id/events", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const events = await storage.upsertEvents({ ...req.body, invitationId: req.params.id });
    res.json(events);
  });

  app.get("/api/invitations/:id/content", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const content = await storage.getContentByInvitation(req.params.id);
    res.json(content || {});
  });

  app.put("/api/invitations/:id/content", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const content = await storage.upsertContent({ ...req.body, invitationId: req.params.id });
    res.json(content);
  });

  app.get("/api/invitations/:id/gallery", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const gallery = await storage.getGalleryByInvitation(req.params.id);
    res.json(gallery);
  });

  app.post("/api/invitations/:id/gallery", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const img = await storage.addGalleryImage({ ...req.body, invitationId: req.params.id });
    res.json(img);
  });

  app.delete("/api/invitations/:id/gallery/:imageId", requireAuth, async (req, res) => {
    await storage.deleteGalleryImage(req.params.imageId);
    res.json({ success: true });
  });

  // RSVP routes
  app.get("/api/invitations/:id/rsvps", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const rsvpList = await storage.getRsvpsByInvitation(req.params.id);
    res.json(rsvpList);
  });

  // Guest messages routes
  app.get("/api/invitations/:id/messages", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const messages = await storage.getAllMessagesByInvitation(req.params.id);
    res.json(messages);
  });

  app.patch("/api/messages/:id/visibility", requireAuth, async (req, res) => {
    await storage.updateMessageVisibility(req.params.id, req.body.visible);
    res.json({ success: true });
  });

  // Gift routes
  app.get("/api/invitations/:id/gifts", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const gifts = await storage.getGiftAccountsByInvitation(req.params.id);
    res.json(gifts);
  });

  app.post("/api/invitations/:id/gifts", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    try {
      const data = insertGiftAccountSchema.parse({ ...req.body, invitationId: req.params.id });
      const gift = await storage.createGiftAccount(data);
      res.json(gift);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/gifts/:id", requireAuth, async (req, res) => {
    await storage.deleteGiftAccount(req.params.id);
    res.json({ success: true });
  });

  // Gift confirmations
  app.get("/api/invitations/:id/gift-confirmations", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const confs = await storage.getGiftConfirmationsByInvitation(req.params.id);
    res.json(confs);
  });

  // Stats
  app.get("/api/stats", requireAuth, async (req, res) => {
    const stats = await storage.getUserStats((req.user as any).id);
    res.json(stats);
  });

  // Analytics per invitation
  app.get("/api/invitations/:id/analytics", requireAuth, async (req, res) => {
    const inv = await storage.getInvitationById(req.params.id);
    if (!inv || inv.userId !== (req.user as any).id) return res.status(404).json({ message: "Not found" });
    const rsvpList = await storage.getRsvpsByInvitation(req.params.id);
    const msgs = await storage.getAllMessagesByInvitation(req.params.id);
    const confs = await storage.getGiftConfirmationsByInvitation(req.params.id);
    res.json({
      views: inv.views,
      totalRsvp: rsvpList.length,
      attending: rsvpList.filter(r => r.status === "attending").length,
      notAttending: rsvpList.filter(r => r.status === "not_attending").length,
      pending: rsvpList.filter(r => r.status === "pending").length,
      messages: msgs.length,
      giftConfirmations: confs.length,
    });
  });

  // User profile update
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const updated = await storage.updateUser((req.user as any).id, {
      fullName: req.body.fullName,
      email: req.body.email,
    });
    if (!updated) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safe } = updated;
    res.json(safe);
  });

  app.patch("/api/users/me/password", requireAuth, async (req, res) => {
    const user = await storage.getUser((req.user as any).id);
    if (!user) return res.status(404).json({ message: "Not found" });
    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(req.body.newPassword, 10);
    await storage.updateUser(user.id, { password: hashed });
    res.json({ success: true });
  });

  // Public invitation page routes (no auth needed)
  app.get("/api/public/:slug", async (req, res) => {
    const inv = await storage.getFullInvitationBySlug(req.params.slug);
    if (!inv || inv.status !== "published") return res.status(404).json({ message: "Invitation not found" });
    await storage.incrementViews(inv.id);
    res.json(inv);
  });

  app.post("/api/public/:slug/rsvp", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
      const data = insertRsvpSchema.parse({ ...req.body, invitationId: inv.id });
      const rsvp = await storage.createRsvp(data);
      res.json(rsvp);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/public/:slug/messages", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
      const data = insertGuestMessageSchema.parse({ ...req.body, invitationId: inv.id });
      const msg = await storage.createGuestMessage(data);
      res.json(msg);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/public/:slug/messages", async (req, res) => {
    const inv = await storage.getInvitationBySlug(req.params.slug);
    if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
    const messages = await storage.getMessagesByInvitation(inv.id);
    res.json(messages);
  });

  app.post("/api/public/:slug/gift-confirmation", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
      const conf = await storage.createGiftConfirmation({ ...req.body, invitationId: inv.id });
      res.json(conf);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  return httpServer;
}
