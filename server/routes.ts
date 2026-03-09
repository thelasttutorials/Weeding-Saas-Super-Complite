import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";

// Express v5 changed ParamsDictionary to string | string[] — override to string for convenience
declare module "express-serve-static-core" {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
import { storage, createStorage } from "./storage";
import { withUserContext } from "./db";
import {
  insertUserSchema, insertInvitationSchema, insertRsvpSchema, insertGuestMessageSchema, insertGiftAccountSchema,
  insertTestimonialSchema, insertFaqSchema, insertPricingPlanSchema, insertWebsiteSettingsSchema, insertSeoSettingsSchema,
  insertPricingPlanFeatureSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

function userId(req: Request): string {
  return (req.user as Express.User).id;
}

const PgSession = connectPgSimple(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      fullName: string;
      plan: string;
      isAdmin: boolean;
      avatarUrl?: string | null;
      password: string;
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!(req.user as Express.User).isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Trust Replit's HTTPS reverse proxy so secure cookies work in production
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "wedsaas-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      },
    })
  );

  // Auth operations use the global storage (no user context yet, users table bypasses RLS)
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

  // ── Auth routes (no user context needed) ────────────────────────────────────

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
    const { password: _, ...safe } = req.user!;
    res.json(safe);
  });

  // ── Invitation routes (RLS-scoped) ───────────────────────────────────────────

  app.get("/api/invitations/check-slug", requireAuth, async (req, res) => {
    const slug = String(req.query.slug || "").toLowerCase().trim();
    const excludeId = req.query.excludeId ? String(req.query.excludeId) : undefined;
    if (!slug) return res.status(400).json({ message: "slug required" });
    const available = await storage.checkSlugAvailable(slug, excludeId);
    res.json({ available });
  });

  app.get("/api/invitations", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const list = await s.getInvitationsByUser(userId(req));
      res.json(list);
    });
  });

  app.post("/api/invitations", requireAuth, async (req, res) => {
    try {
      const data = insertInvitationSchema.parse({ ...req.body, userId: userId(req) });
      // Check slug availability before inserting
      const slugAvailable = await storage.checkSlugAvailable(data.slug);
      if (!slugAvailable) {
        return res.status(400).json({ message: "URL undangan sudah dipakai, coba yang lain", field: "slug" });
      }
      await withUserContext(userId(req), async (userDb) => {
        const s = createStorage(userDb);
        const inv = await s.createInvitation(data);
        res.status(201).json(inv);
      });
    } catch (err: any) {
      const msg = err.message || "Gagal membuat undangan";
      const isDupSlug = msg.includes("unique") && msg.includes("slug");
      res.status(400).json({ message: isDupSlug ? "URL undangan sudah dipakai, coba yang lain" : msg, field: isDupSlug ? "slug" : undefined });
    }
  });

  app.get("/api/invitations/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(inv);
    });
  });

  app.patch("/api/invitations/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      const updated = await s.updateInvitation(req.params.id, req.body);
      res.json(updated);
    });
  });

  app.delete("/api/invitations/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      await s.deleteInvitation(req.params.id);
      res.json({ success: true });
    });
  });

  app.post("/api/invitations/:id/publish", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }

      const errors: string[] = [];
      if (!inv.slug || inv.slug.length < 3) errors.push("URL undangan tidak valid");

      const couple = await s.getCoupleByInvitation(req.params.id);
      if (!couple || !couple.brideName?.trim() || !couple.groomName?.trim()) {
        errors.push("Nama mempelai wanita dan pria wajib diisi (tab Pasangan)");
      }

      const events = await s.getEventsByInvitation(req.params.id);
      if (!events || (!events.receptionDate?.trim() && !events.akadDate?.trim())) {
        errors.push("Tanggal acara (Akad atau Resepsi) wajib diisi (tab Acara)");
      }

      if (errors.length > 0) {
        return res.status(422).json({ message: "Data undangan belum lengkap", errors });
      }

      const updated = await s.updateInvitation(req.params.id, {
        status: "published",
        publishedAt: new Date(),
      });
      res.json(updated);
    });
  });

  app.post("/api/invitations/:id/unpublish", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      const updated = await s.updateInvitation(req.params.id, {
        status: "draft",
        publishedAt: null,
      });
      res.json(updated);
    });
  });

  // ── Builder detail routes (RLS-scoped) ──────────────────────────────────────

  app.get("/api/invitations/:id/couple", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getCoupleByInvitation(req.params.id) || {});
    });
  });

  app.put("/api/invitations/:id/couple", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.upsertCouple({ ...req.body, invitationId: req.params.id }));
    });
  });

  app.get("/api/invitations/:id/events", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getEventsByInvitation(req.params.id) || {});
    });
  });

  app.put("/api/invitations/:id/events", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.upsertEvents({ ...req.body, invitationId: req.params.id }));
    });
  });

  app.get("/api/invitations/:id/content", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getContentByInvitation(req.params.id) || {});
    });
  });

  app.put("/api/invitations/:id/content", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.upsertContent({ ...req.body, invitationId: req.params.id }));
    });
  });

  app.get("/api/invitations/:id/gallery", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getGalleryByInvitation(req.params.id));
    });
  });

  app.post("/api/invitations/:id/gallery", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.addGalleryImage({ ...req.body, invitationId: req.params.id }));
    });
  });

  app.delete("/api/invitations/:id/gallery/:imageId", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      await s.deleteGalleryImage(req.params.imageId);
      res.json({ success: true });
    });
  });

  // ── RSVP / Messages / Gifts (RLS-scoped) ────────────────────────────────────

  app.get("/api/invitations/:id/rsvps", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getRsvpsByInvitation(req.params.id));
    });
  });

  app.get("/api/invitations/:id/messages", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getAllMessagesByInvitation(req.params.id));
    });
  });

  app.patch("/api/messages/:id/visibility", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      await s.updateMessageVisibility(req.params.id, req.body.visible);
      res.json({ success: true });
    });
  });

  app.get("/api/invitations/:id/gifts", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getGiftAccountsByInvitation(req.params.id));
    });
  });

  app.post("/api/invitations/:id/gifts", requireAuth, async (req, res) => {
    try {
      const data = insertGiftAccountSchema.parse({ ...req.body, invitationId: req.params.id });
      await withUserContext(userId(req), async (userDb) => {
        const s = createStorage(userDb);
        const inv = await s.getInvitationById(req.params.id);
        if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
        res.json(await s.createGiftAccount(data));
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/gifts/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      await s.deleteGiftAccount(req.params.id);
      res.json({ success: true });
    });
  });

  app.get("/api/invitations/:id/gift-confirmations", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      res.json(await s.getGiftConfirmationsByInvitation(req.params.id));
    });
  });

  // ── Stats & Analytics (RLS-scoped) ──────────────────────────────────────────

  app.get("/api/stats", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      res.json(await s.getUserStats(userId(req)));
    });
  });

  app.get("/api/invitations/:id/analytics", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { res.status(404).json({ message: "Not found" }); return; }
      const rsvpList = await s.getRsvpsByInvitation(req.params.id);
      const msgs = await s.getAllMessagesByInvitation(req.params.id);
      const confs = await s.getGiftConfirmationsByInvitation(req.params.id);
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
  });

  // ── User profile (users table is not FORCE RLS, global storage is fine) ──────

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const updated = await storage.updateUser(userId(req), {
      fullName: req.body.fullName,
      email: req.body.email,
    });
    if (!updated) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safe } = updated;
    res.json(safe);
  });

  app.patch("/api/users/me/password", requireAuth, async (req, res) => {
    const user = await storage.getUser(userId(req));
    if (!user) return res.status(404).json({ message: "Not found" });
    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(req.body.newPassword, 10);
    await storage.updateUser(user.id, { password: hashed });
    res.json({ success: true });
  });

  // ── Admin routes ─────────────────────────────────────────────────────────────

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const stats = await storage.getPlatformStats();
    const recentUsers = await storage.getAllUsers();
    const recentInvitations = await storage.getAllInvitations();
    res.json({
      ...stats,
      recentUsers: recentUsers.slice(0, 5),
      recentInvitations: recentInvitations.slice(0, 5),
    });
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    res.json(await storage.getAllUsers());
  });

  app.get("/api/admin/invitations", requireAdmin, async (req, res) => {
    res.json(await storage.getAllInvitations());
  });

  app.patch("/api/admin/users/:id/plan", requireAdmin, async (req, res) => {
    const updated = await storage.updateUser(req.params.id, { plan: req.body.plan });
    if (!updated) return res.status(404).json({ message: "User not found" });
    await storage.createAuditLog({
      adminId: userId(req),
      action: "update",
      entity: "user",
      entityId: req.params.id,
      description: `Changed user ${updated.username} plan to ${req.body.plan}`,
    });
    const { password: _, ...safe } = updated;
    res.json(safe);
  });

  // ── Admin Testimonials ───────────────────────────────────────────────────

  app.get("/api/admin/testimonials", requireAdmin, async (req, res) => {
    res.json(await storage.getTestimonials());
  });

  app.post("/api/admin/testimonials", requireAdmin, async (req, res) => {
    try {
      const data = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(data);
      await storage.createAuditLog({
        adminId: userId(req),
        action: "create",
        entity: "testimonial",
        entityId: testimonial.id,
        description: `Created testimonial for ${testimonial.coupleName}`,
      });
      res.status(201).json(testimonial);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateTestimonial(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Testimonial not found" });
    await storage.createAuditLog({
      adminId: userId(req),
      action: "update",
      entity: "testimonial",
      entityId: req.params.id,
      description: `Updated testimonial for ${updated.coupleName}`,
    });
    res.json(updated);
  });

  app.delete("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
    await storage.deleteTestimonial(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "delete",
      entity: "testimonial",
      entityId: req.params.id,
      description: `Deleted testimonial ${req.params.id}`,
    });
    res.json({ success: true });
  });

  // ── Admin FAQ ────────────────────────────────────────────────────────────

  app.get("/api/admin/faqs", requireAdmin, async (req, res) => {
    res.json(await storage.getFaqs());
  });

  app.post("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const data = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(data);
      await storage.createAuditLog({
        adminId: userId(req),
        action: "create",
        entity: "faq",
        entityId: faq.id,
        description: `Created FAQ: ${faq.question}`,
      });
      res.status(201).json(faq);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateFaq(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "FAQ not found" });
    await storage.createAuditLog({
      adminId: userId(req),
      action: "update",
      entity: "faq",
      entityId: req.params.id,
      description: `Updated FAQ: ${updated.question}`,
    });
    res.json(updated);
  });

  app.delete("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    await storage.deleteFaq(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "delete",
      entity: "faq",
      entityId: req.params.id,
      description: `Deleted FAQ ${req.params.id}`,
    });
    res.json({ success: true });
  });

  // ── Admin Pricing ─────────────────────────────────────────────────────────

  app.get("/api/admin/pricing", requireAdmin, async (req, res) => {
    res.json(await storage.getPricingPlans());
  });

  app.post("/api/admin/pricing", requireAdmin, async (req, res) => {
    try {
      const data = insertPricingPlanSchema.parse(req.body);
      const plan = await storage.createPricingPlan(data);
      await storage.createAuditLog({
        adminId: userId(req),
        action: "create",
        entity: "pricing_plan",
        entityId: plan.id,
        description: `Created pricing plan: ${plan.name}`,
      });
      res.status(201).json(plan);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/pricing/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updatePricingPlan(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Pricing plan not found" });
    await storage.createAuditLog({
      adminId: userId(req),
      action: "update",
      entity: "pricing_plan",
      entityId: req.params.id,
      description: `Updated pricing plan: ${updated.name}`,
    });
    res.json(updated);
  });

  app.delete("/api/admin/pricing/:id", requireAdmin, async (req, res) => {
    await storage.deletePricingPlan(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "delete",
      entity: "pricing_plan",
      entityId: req.params.id,
      description: `Deleted pricing plan ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.get("/api/admin/pricing/:id/features", requireAdmin, async (req, res) => {
    res.json(await storage.getPricingPlanFeatures(req.params.id));
  });

  app.put("/api/admin/pricing/:id/features", requireAdmin, async (req, res) => {
    await storage.upsertPricingPlanFeatures(req.params.id, req.body);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "update",
      entity: "pricing_plan_features",
      entityId: req.params.id,
      description: `Updated features for plan ${req.params.id}`,
    });
    res.json({ success: true });
  });

  // ── Admin Audit Logs ─────────────────────────────────────────────────────

  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    res.json(await storage.getAuditLogs(limit));
  });

  // ── Admin Settings ────────────────────────────────────────────────────────

  app.get("/api/admin/settings/website", requireAdmin, async (req, res) => {
    res.json(await storage.getWebsiteSettings());
  });

  app.put("/api/admin/settings/website", requireAdmin, async (req, res) => {
    try {
      const data = insertWebsiteSettingsSchema.parse(req.body);
      const settings = await storage.updateWebsiteSettings(data);
      await storage.createAuditLog({
        adminId: userId(req),
        action: "update",
        entity: "website_settings",
        entityId: "1",
        description: "Updated website settings",
      });
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/settings/seo", requireAdmin, async (req, res) => {
    res.json(await storage.getSeoSettings());
  });

  app.put("/api/admin/settings/seo", requireAdmin, async (req, res) => {
    try {
      const data = insertSeoSettingsSchema.parse(req.body);
      const settings = await storage.updateSeoSettings(data);
      await storage.createAuditLog({
        adminId: userId(req),
        action: "update",
        entity: "seo_settings",
        entityId: "1",
        description: "Updated SEO settings",
      });
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── Admin Users Management ────────────────────────────────────────────────

  app.patch("/api/admin/users/:id/suspend", requireAdmin, async (req, res) => {
    await storage.suspendUser(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "suspend",
      entity: "user",
      entityId: req.params.id,
      description: `Suspended user ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.patch("/api/admin/users/:id/unsuspend", requireAdmin, async (req, res) => {
    await storage.unsuspendUser(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "unsuspend",
      entity: "user",
      entityId: req.params.id,
      description: `Unsuspended user ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.patch("/api/admin/users/:id/toggle-admin", requireAdmin, async (req, res) => {
    await storage.toggleAdminStatus(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "toggle-admin",
      entity: "user",
      entityId: req.params.id,
      description: `Toggled admin status for user ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.get("/api/admin/users/:id/detail", requireAdmin, async (req, res) => {
    const detail = await storage.getAdminUserDetail(req.params.id);
    if (!detail) return res.status(404).json({ message: "User not found" });
    res.json(detail);
  });

  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    res.json(await storage.getAdminSubscriptions());
  });

  // ── Admin Invitations Management ──────────────────────────────────────────

  app.post("/api/admin/invitations/:id/publish", requireAdmin, async (req, res) => {
    await storage.adminPublishInvitation(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "publish",
      entity: "invitation",
      entityId: req.params.id,
      description: `Published invitation ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.post("/api/admin/invitations/:id/unpublish", requireAdmin, async (req, res) => {
    await storage.adminUnpublishInvitation(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "unpublish",
      entity: "invitation",
      entityId: req.params.id,
      description: `Unpublished invitation ${req.params.id}`,
    });
    res.json({ success: true });
  });

  app.post("/api/admin/invitations/:id/archive", requireAdmin, async (req, res) => {
    await storage.adminArchiveInvitation(req.params.id);
    await storage.createAuditLog({
      adminId: userId(req),
      action: "archive",
      entity: "invitation",
      entityId: req.params.id,
      description: `Archived invitation ${req.params.id}`,
    });
    res.json({ success: true });
  });

  // ── Public invitation routes (no auth, RLS allows published data) ────────────

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
      res.json(await storage.createRsvp(data));
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/public/:slug/messages", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
      const data = insertGuestMessageSchema.parse({ ...req.body, invitationId: inv.id });
      res.json(await storage.createGuestMessage(data));
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/public/:slug/messages", async (req, res) => {
    const inv = await storage.getInvitationBySlug(req.params.slug);
    if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
    res.json(await storage.getMessagesByInvitation(inv.id));
  });

  app.post("/api/public/:slug/gift-confirmation", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv || inv.status !== "published") return res.status(404).json({ message: "Not found" });
      res.json(await storage.createGiftConfirmation({ ...req.body, invitationId: inv.id }));
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  return httpServer;
}
