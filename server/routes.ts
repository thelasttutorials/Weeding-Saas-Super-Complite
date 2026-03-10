import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { uploadMiddleware, validateAndSaveFile } from "./upload";

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
  insertPricingPlanFeatureSchema, insertWeddingThemeSchema, insertWeddingThemeBlockSchema,
  insertCouponSchema, insertCustomDomainSchema, insertMediaAssetSchema, insertGuestSchema
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "./upload";

import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

function userId(req: Request): string {
  return (req.user as Express.User).id;
}

// ── Payment helpers ───────────────────────────────────────────────────────────
function generateInvoiceNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${date}-${rand}`;
}

async function generateUniqueCode(amount: number): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const code = Math.floor(Math.random() * 900) + 100; // 100–999
    const conflict = await storage.getUniqueCodeConflict(amount, code);
    if (!conflict) return code;
  }
  return Math.floor(Math.random() * 900) + 100;
}

const PLAN_AMOUNTS: Record<string, number> = {
  premium: 99000,
  business: 299000,
};

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
      const referralCode = req.body.referralCode;

      const existing = await storage.getUserByUsername(body.username);
      if (existing) return res.status(400).json({ message: "Username already taken" });
      const existingEmail = await storage.getUserByEmail(body.email);
      if (existingEmail) return res.status(400).json({ message: "Email already registered" });
      
      const hashed = await bcrypt.hash(body.password, 10);
      const user = await storage.createUser({ ...body, password: hashed });

      // Handle referral if provided
      if (referralCode) {
        const referrer = await storage.db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
        if (referrer.length > 0) {
          await storage.createReferralUsage(referrer[0].id, user.id);
        }
      }

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
    const excludeId = req.query.excludeId ? (Array.isArray(req.query.excludeId) ? String(req.query.excludeId[0]) : String(req.query.excludeId)) : undefined;
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

  // Preview route — owner/admin only, no status check, no view increment
  app.get("/api/invitations/:id/preview-data", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      const user = req.user as Express.User;
      if (!inv || (inv.userId !== user.id && !user.isAdmin)) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      const full = await s.getFullInvitationBySlug(inv.slug);
      res.json(full || inv);
    });
  });

  app.post("/api/invitations/:id/duplicate", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) {
        res.status(404).json({ message: "Invitation not found" });
        return;
      }
      const duplicated = await s.duplicateInvitation(req.params.id);
      res.json(duplicated);
    });
  });

  app.post("/api/ai/generate", requireAuth, async (req, res) => {
    const { type, groomName, brideName, tone, language, length } = req.body;
    const generated = storage.generateAICopy(type, groomName, brideName, tone, language, length);
    res.json({ text: generated, info: "Generated by template engine" });
  });

  app.get("/api/public/landing-settings", async (req, res) => {
    const settings = await storage.getLandingPageSettings();
    res.json(settings);
  });

  app.get("/api/admin/cms/landing", requireAdmin, async (req, res) => {
    const settings = await storage.getLandingPageSettings();
    res.json(settings);
  });

  app.put("/api/admin/cms/landing", requireAdmin, async (req, res) => {
    const updated = await storage.updateLandingPageSettings(req.body);
    res.json(updated);
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
      const guestStats = await s.getGuestStats(req.params.id);
      res.json({
        views: inv.views,
        totalRsvp: rsvpList.length,
        attending: rsvpList.filter(r => r.status === "attending").length,
        notAttending: rsvpList.filter(r => r.status === "not_attending").length,
        pending: rsvpList.filter(r => r.status === "pending").length,
        messages: msgs.length,
        giftConfirmations: confs.length,
        guestStats,
      });
    });
  });

  // ── Guest Management Routes ──────────────────────────────────────────────────

  app.get("/api/invitations/:id/guests", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const inv = await s.getInvitationById(req.params.id);
      if (!inv || inv.userId !== userId(req)) { return res.status(404).json({ message: "Not found" }); }
      
      const list = await s.getGuestsByInvitation(req.params.id);
      const stats = await s.getGuestStats(req.params.id);
      res.json({ list, stats });
    });
  });

  app.post("/api/invitations/:id/guests", requireAuth, async (req, res) => {
    try {
      const data = insertGuestSchema.parse({ ...req.body, invitationId: req.params.id });
      await withUserContext(userId(req), async (userDb) => {
        const s = createStorage(userDb);
        const inv = await s.getInvitationById(req.params.id);
        if (!inv || inv.userId !== userId(req)) { return res.status(404).json({ message: "Not found" }); }
        
        const guest = await s.createGuest(data);
        res.status(201).json(guest);
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/guests/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const guest = await s.getGuestById(req.params.id);
      if (!guest) return res.status(404).json({ message: "Guest not found" });
      
      const inv = await s.getInvitationById(guest.invitationId);
      if (!inv || inv.userId !== userId(req)) return res.status(403).json({ message: "Forbidden" });

      const updated = await s.updateGuest(req.params.id, req.body);
      res.json(updated);
    });
  });

  app.delete("/api/guests/:id", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const guest = await s.getGuestById(req.params.id);
      if (!guest) return res.status(404).json({ message: "Guest not found" });

      const inv = await s.getInvitationById(guest.invitationId);
      if (!inv || inv.userId !== userId(req)) return res.status(403).json({ message: "Forbidden" });

      await s.deleteGuest(req.params.id);
      res.json({ success: true });
    });
  });

  app.post("/api/guests/:id/checkin", requireAuth, async (req, res) => {
    await withUserContext(userId(req), async (userDb) => {
      const s = createStorage(userDb);
      const guest = await s.getGuestById(req.params.id);
      if (!guest) return res.status(404).json({ message: "Guest not found" });

      const inv = await s.getInvitationById(guest.invitationId);
      if (!inv || inv.userId !== userId(req)) return res.status(403).json({ message: "Forbidden" });

      const updated = await s.updateGuest(req.params.id, {
        checkedIn: true,
        checkedInAt: new Date(),
      });
      res.json(updated);
    });
  });

  app.get("/api/guests/token/:token", async (req, res) => {
    const guest = await storage.getGuestByToken(req.params.token);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
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

  // ── Media Library routes ───────────────────────────────────────────────────

  app.get("/api/media", requireAuth, async (req, res) => {
    const assets = await storage.getMediaAssetsByUser(userId(req));
    res.json(assets);
  });

  app.post("/api/media/upload", requireAuth, (req, res) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      try {
        const saved = validateAndSaveFile(req.file);
        const mediaType = saved.mimeType.startsWith("audio/") ? "audio" : "image";
        const asset = await storage.createMediaAsset({
          userId: userId(req),
          fileName: saved.storedName,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          size: saved.size,
          url: saved.url,
          mediaType,
        });
        res.status(201).json(asset);
      } catch (err: any) {
        res.status(400).json({ message: err.message });
      }
    });
  });

  app.delete("/api/media/:id", requireAuth, async (req, res) => {
    const asset = await storage.getMediaAsset(req.params.id);
    if (!asset || asset.userId !== userId(req)) {
      return res.status(404).json({ message: "Media asset not found" });
    }

    try {
      // Delete file from disk
      const filePath = path.join(UPLOAD_DIR, asset.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Delete from DB
      await storage.deleteMediaAsset(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to delete media asset" });
    }
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

  // ── Wedding Theme Builder routes (admin only) ────────────────────────────────

  app.get("/api/admin/themes", requireAdmin, async (req, res) => {
    res.json(await storage.getWeddingThemes());
  });

  app.post("/api/admin/themes", requireAdmin, async (req, res) => {
    try {
      const data = insertWeddingThemeSchema.parse({ ...req.body, createdBy: userId(req) });
      const theme = await storage.createWeddingTheme(data);
      await storage.createAuditLog({ adminId: userId(req), action: "create", entity: "wedding_theme", entityId: theme.id, description: `Tema baru dibuat: ${theme.name}` });
      res.json(theme);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/themes/:id", requireAdmin, async (req, res) => {
    const theme = await storage.getWeddingTheme(req.params.id);
    if (!theme) return res.status(404).json({ message: "Theme not found" });
    const blocks = await storage.getThemeBlocks(theme.id);
    res.json({ ...theme, blocks });
  });

  app.patch("/api/admin/themes/:id", requireAdmin, async (req, res) => {
    try {
      const theme = await storage.updateWeddingTheme(req.params.id, req.body);
      if (!theme) return res.status(404).json({ message: "Theme not found" });
      await storage.createAuditLog({ adminId: userId(req), action: "update", entity: "wedding_theme", entityId: theme.id, description: `Tema diperbarui: ${theme.name}` });
      res.json(theme);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/themes/:id", requireAdmin, async (req, res) => {
    await storage.deleteWeddingTheme(req.params.id);
    await storage.createAuditLog({ adminId: userId(req), action: "delete", entity: "wedding_theme", entityId: req.params.id, description: "Tema dihapus" });
    res.json({ success: true });
  });

  app.post("/api/admin/themes/:id/duplicate", requireAdmin, async (req, res) => {
    try {
      const newTheme = await storage.duplicateWeddingTheme(req.params.id, userId(req));
      await storage.createAuditLog({ adminId: userId(req), action: "create", entity: "wedding_theme", entityId: newTheme.id, description: `Tema diduplikasi: ${newTheme.name}` });
      res.json(newTheme);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/admin/themes/:id/publish", requireAdmin, async (req, res) => {
    const theme = await storage.updateWeddingTheme(req.params.id, { status: "published" });
    if (!theme) return res.status(404).json({ message: "Theme not found" });
    await storage.createAuditLog({ adminId: userId(req), action: "publish", entity: "wedding_theme", entityId: theme.id, description: `Tema dipublish: ${theme.name}` });
    res.json(theme);
  });

  app.post("/api/admin/themes/:id/archive", requireAdmin, async (req, res) => {
    const theme = await storage.updateWeddingTheme(req.params.id, { status: "archived" });
    if (!theme) return res.status(404).json({ message: "Theme not found" });
    res.json(theme);
  });

  // Theme Blocks
  app.get("/api/admin/themes/:id/blocks", requireAdmin, async (req, res) => {
    res.json(await storage.getThemeBlocks(req.params.id));
  });

  app.post("/api/admin/themes/:id/blocks", requireAdmin, async (req, res) => {
    try {
      const blocks = await storage.getThemeBlocks(req.params.id);
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.sortOrder)) + 1 : 0;
      const data = insertWeddingThemeBlockSchema.parse({
        ...req.body,
        themeId: req.params.id,
        sortOrder: req.body.sortOrder ?? maxOrder,
      });
      const block = await storage.createThemeBlock(data);
      res.json(block);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/themes/:themeId/blocks/:blockId", requireAdmin, async (req, res) => {
    try {
      const block = await storage.updateThemeBlock(req.params.blockId, req.body);
      if (!block) return res.status(404).json({ message: "Block not found" });
      res.json(block);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/themes/:themeId/blocks/:blockId", requireAdmin, async (req, res) => {
    await storage.deleteThemeBlock(req.params.blockId);
    res.json({ success: true });
  });

  app.post("/api/admin/themes/:id/blocks/reorder", requireAdmin, async (req, res) => {
    try {
      const { blockIds } = req.body as { blockIds: string[] };
      await storage.reorderThemeBlocks(req.params.id, blockIds);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── File upload ────────────────────────────────────────────────────────────

  app.post("/api/payments/:id/upload-proof", requireAuth, (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Ukuran file terlalu besar. Maksimal 5 MB." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diupload." });
    }
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Invoice tidak ditemukan." });
    if (payment.userId !== userId(req)) return res.status(403).json({ message: "Forbidden." });
    if (["paid", "expired", "canceled", "rejected"].includes(payment.status)) {
      return res.status(400).json({ message: "Invoice ini tidak dapat diubah." });
    }

    let saved: import("./upload").SavedFile;
    try {
      saved = validateAndSaveFile(req.file);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }

    // Save file metadata
    await storage.createFileUpload({
      uploadedBy: userId(req),
      originalName: saved.originalName,
      storedName: saved.storedName,
      mimeType: saved.mimeType,
      size: saved.size,
      url: saved.url,
    });

    // Update payment
    const updated = await storage.updatePayment(payment.id, {
      transferProofUrl: saved.url,
      status: "waiting_confirmation",
    });
    res.json({ payment: updated, file: { url: saved.url, mimeType: saved.mimeType, size: saved.size, originalName: saved.originalName } });
  });

  // ── Bank accounts ──────────────────────────────────────────────────────────

  app.get("/api/bank-accounts", async (_req, res) => {
    res.json(await storage.getBankAccounts(true));
  });

  // Admin bank account management
  app.get("/api/admin/bank-accounts", requireAdmin, async (_req, res) => {
    res.json(await storage.getBankAccounts());
  });

  app.post("/api/admin/bank-accounts", requireAdmin, async (req, res) => {
    const data = req.body;
    if (!data.bankName || !data.accountName || !data.accountNumber) {
      return res.status(400).json({ message: "bankName, accountName, accountNumber required" });
    }
    res.status(201).json(await storage.createBankAccount(data));
  });

  app.patch("/api/admin/bank-accounts/:id", requireAdmin, async (req, res) => {
    const account = await storage.updateBankAccount(req.params.id, req.body);
    if (!account) return res.status(404).json({ message: "Not found" });
    res.json(account);
  });

  app.delete("/api/admin/bank-accounts/:id", requireAdmin, async (req, res) => {
    await storage.deleteBankAccount(req.params.id);
    res.json({ success: true });
  });

  // ── Payment invoices ───────────────────────────────────────────────────────

  // Create invoice (user)
  app.post("/api/payments", requireAuth, async (req, res) => {
    const { plan, couponCode } = req.body;
    if (!plan || !PLAN_AMOUNTS[plan]) {
      return res.status(400).json({ message: "Plan tidak valid. Pilih premium atau business." });
    }
    // Expire any overdue invoices first
    await storage.expireOverduePayments();
    // Check for existing active invoice for this user/plan
    const existingPayments = await storage.getPaymentsByUser(userId(req));
    const activeInvoice = existingPayments.find(p =>
      p.plan === plan && (p.status === "pending" || p.status === "waiting_confirmation")
    );
    if (activeInvoice) {
      return res.status(409).json({
        message: "Kamu sudah memiliki invoice aktif untuk paket ini.",
        paymentId: activeInvoice.id,
      });
    }
    const amount = PLAN_AMOUNTS[plan];

    let finalAmount = amount;
    let discountAmount = 0;

    if (couponCode) {
      const validation = await storage.validateCoupon(couponCode, plan as string, amount);
      if (validation.valid) {
        discountAmount = validation.discountAmount;
        finalAmount = amount - discountAmount;
      } else {
        return res.status(400).json({ message: validation.message });
      }
    }

    const uniqueCode = await generateUniqueCode(finalAmount);
    const totalWithCode = finalAmount + uniqueCode;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const payment = await storage.createPayment({
      userId: userId(req),
      plan,
      invoiceNumber: generateInvoiceNumber(),
      amount,
      uniqueCode,
      finalAmount: totalWithCode,
      couponCode: couponCode || null,
      discountAmount,
      paymentMethod: "bank_transfer",
      status: "pending",
      expiresAt,
    });

    // If coupon used, increment its usage
    if (couponCode && discountAmount > 0) {
      const coupon = await storage.getCouponByCode(couponCode);
      if (coupon) {
        await storage.updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
      }
    }

    res.status(201).json(payment);
  });

  // Get user's payment list
  app.get("/api/payments", requireAuth, async (req, res) => {
    await storage.expireOverduePayments();
    res.json(await storage.getPaymentsByUser(userId(req)));
  });

  // Get single payment detail (owner or admin)
  app.get("/api/payments/:id", requireAuth, async (req, res) => {
    await storage.expireOverduePayments();
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    const user = req.user as Express.User;
    if (payment.userId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(payment);
  });

  // Submit transfer proof URL
  app.patch("/api/payments/:id/proof", requireAuth, async (req, res) => {
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (payment.userId !== userId(req)) return res.status(403).json({ message: "Forbidden" });
    if (payment.status === "paid" || payment.status === "expired" || payment.status === "canceled") {
      return res.status(400).json({ message: "Invoice tidak dapat diubah." });
    }
    if (!req.body.transferProofUrl) {
      return res.status(400).json({ message: "URL bukti transfer wajib diisi." });
    }
    const updated = await storage.updatePayment(payment.id, {
      transferProofUrl: req.body.transferProofUrl,
      status: "waiting_confirmation",
    });
    res.json(updated);
  });

  // Cancel payment (user)
  app.patch("/api/payments/:id/cancel", requireAuth, async (req, res) => {
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (payment.userId !== userId(req)) return res.status(403).json({ message: "Forbidden" });
    if (payment.status !== "pending") {
      return res.status(400).json({ message: "Hanya invoice pending yang bisa dibatalkan." });
    }
    res.json(await storage.updatePayment(payment.id, { status: "canceled" }));
  });

  // Admin: get all payments
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    await storage.expireOverduePayments();
    const { status, search } = req.query as { status?: string; search?: string };
    res.json(await storage.getAdminPayments({ status, search }));
  });

  // Admin: approve payment
  app.post("/api/admin/payments/:id/approve", requireAdmin, async (req, res) => {
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (payment.status === "paid") return res.status(400).json({ message: "Already approved." });

    // Mark as paid
    const updated = await storage.updatePayment(payment.id, {
      status: "paid",
      paidAt: new Date(),
      adminNotes: req.body.notes || null,
    });
    // Update user plan
    await storage.updateUser(payment.userId, { plan: payment.plan });
    // Log audit
    await storage.createAuditLog({
      adminId: userId(req),
      action: "PAYMENT_APPROVED",
      entity: "payment",
      entityId: payment.id,
      description: `Approved ${payment.invoiceNumber} — plan ${payment.plan} — Rp ${payment.finalAmount.toLocaleString()}`,
    });
    res.json(updated);
  });

  // Admin: reject payment
  app.post("/api/admin/payments/:id/reject", requireAdmin, async (req, res) => {
    const payment = await storage.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (!req.body.reason) return res.status(400).json({ message: "Alasan penolakan wajib diisi." });

    const updated = await storage.updatePayment(payment.id, {
      status: "rejected",
      rejectedReason: req.body.reason,
      adminNotes: req.body.notes || null,
    });
    await storage.createAuditLog({
      adminId: userId(req),
      action: "PAYMENT_REJECTED",
      entity: "payment",
      entityId: payment.id,
      description: `Rejected ${payment.invoiceNumber} — reason: ${req.body.reason}`,
    });
    res.json(updated);
  });

  // ── Admin Coupons ──────────────────────────────────────────────────────────

  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    res.json(await storage.getCoupons());
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const data = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(data);
      res.status(201).json(coupon);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.updateCoupon(req.params.id, req.body);
      if (!coupon) return res.status(404).json({ message: "Coupon not found" });
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    await storage.deleteCoupon(req.params.id);
    res.json({ success: true });
  });

  // ── Admin Referrals ────────────────────────────────────────────────────────

  app.get("/api/admin/referrals", requireAdmin, async (req, res) => {
    res.json(await storage.getReferralUsages());
  });

  // ── Admin Domains ──────────────────────────────────────────────────────────

  app.get("/api/admin/domains", requireAdmin, async (req, res) => {
    res.json(await storage.getAllCustomDomains());
  });

  app.patch("/api/admin/domains/:id", requireAdmin, async (req, res) => {
    try {
      const domain = await storage.updateCustomDomainStatus(req.params.id, req.body.status, req.body.adminNotes);
      if (!domain) return res.status(404).json({ message: "Domain not found" });
      res.json(domain);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── User Coupon/Referral/Domain routes ──────────────────────────────────────

  app.post("/api/coupons/validate", requireAuth, async (req, res) => {
    const { code, plan } = req.body;
    if (!code || !plan) return res.status(400).json({ message: "Code and plan required" });
    
    const amount = PLAN_AMOUNTS[plan] || 0;
    const result = await storage.validateCoupon(code, plan, amount);
    res.json(result);
  });

  app.get("/api/referral/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(userId(req));
    if (!user) return res.status(404).json({ message: "User not found" });
    
    let code = user.referralCode;
    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await storage.updateUser(user.id, { referralCode: code });
    }
    res.json({ referralCode: code });
  });

  app.get("/api/referral/stats", requireAuth, async (req, res) => {
    res.json(await storage.getReferralStats(userId(req)));
  });

  app.get("/api/domain", requireAuth, async (req, res) => {
    const domain = await storage.getCustomDomainByUser(userId(req));
    res.json(domain || null);
  });

  app.post("/api/domain", requireAuth, async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) return res.status(400).json({ message: "Domain required" });
      const result = await storage.upsertCustomDomain(userId(req), domain);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── Public invitation routes (no auth, RLS allows published data) ────────────

  app.get("/api/public/themes/:id", async (req, res) => {
    const theme = await storage.getWeddingTheme(req.params.id);
    if (!theme || theme.status !== "published") return res.status(404).json({ message: "Theme not found" });
    const blocks = await storage.getThemeBlocks(theme.id);
    res.json({ ...theme, blocks });
  });

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
      
      const guestToken = req.query.guestToken as string | undefined;
      let guestId: string | undefined;
      if (guestToken) {
        const guest = await storage.getGuestByToken(guestToken);
        if (guest && guest.invitationId === inv.id) {
          guestId = guest.id;
          await storage.updateGuest(guest.id, {
            rsvpStatus: data.status,
            guestCount: data.guestCount,
          });
        }
      }

      res.json(await storage.createRsvp({ ...data, guestId }));
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
