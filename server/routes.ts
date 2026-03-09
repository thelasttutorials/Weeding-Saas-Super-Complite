import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, createStorage } from "./storage";
import { withUserContext } from "./db";
import { insertUserSchema, insertInvitationSchema, insertRsvpSchema, insertGuestMessageSchema, insertGiftAccountSchema } from "@shared/schema";
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

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "wedsaas-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 },
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
