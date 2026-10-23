import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import db from "./server/db";
import { ApiError } from "./server/validation";
import { publishedSalonBundle } from "./server/serializers";
import { sendReminderEmail } from "./server/emails";
import authRoutes from "./server/routes/auth";
import salonRoutes from "./server/routes/salons";
import publicRoutes from "./server/routes/public";
import uploadRoutes from "./server/routes/uploads";
import adminRoutes from "./server/routes/admin";
import { googleConfigured } from "./server/google";
import { backfillLegacyApprovals } from "./server/approval";
import { startWhatsAppScheduler } from "./server/whatsappScheduler";


const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";
const baseDomain = (process.env.PUBLIC_BASE_DOMAIN || "").toLowerCase().trim();

function dateInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Mirrors the public API: a site is live only when published *and* approved. */
function findPublicSalon(slug: string): any {
  return db
    .prepare(
      "SELECT * FROM salons WHERE slug = ? COLLATE NOCASE AND status = 'published' AND approval_status = 'approved'"
    )
    .get(slug);
}

function injectSalonMeta(html: string, slug: string): string {
  const row = findPublicSalon(slug);
  if (!row) return html;
  const salon = publishedSalonBundle(row);
  const title = salon.seoTitle || `${salon.name}${salon.city ? ` — Salon in ${salon.city}` : ""}`;
  const description =
    salon.seoDescription ||
    salon.tagline ||
    salon.description ||
    `Book an appointment at ${salon.name}${salon.city ? ` in ${salon.city}` : ""}.`;
  const origin = (process.env.PUBLIC_SITE_ORIGIN || "").replace(/\/$/, "");
  const rawImage = salon.heroImageUrl || salon.logoUrl;
  const image = rawImage && rawImage.startsWith("/") && origin ? `${origin}${rawImage}` : rawImage;
  const url = origin ? `${origin}/${salon.slug}` : `/${salon.slug}`;
  const tags = `
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      name: salon.name,
      description,
      url,
      image: image || undefined,
      telephone: salon.phone || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: salon.address || undefined,
        addressLocality: salon.city || undefined,
        addressRegion: salon.state || undefined,
        postalCode: salon.postalCode || undefined,
        addressCountry: salon.country || undefined,
      },
      aggregateRating:
        salon.ratingCount > 0
          ? { "@type": "AggregateRating", ratingValue: salon.rating, reviewCount: salon.ratingCount }
          : undefined,
    })
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")}</script>
  `;
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta[^>]*name=["']description["'][^>]*>/gi,
      `<meta name="description" content="${escapeHtml(description)}" />`
    )
    .replace(/<meta[^>]*(?:property|name)=["'](?:og:|twitter:)[^>]*>\s*/gi, "");

  return cleaned.replace(/<\/head>/i, `${tags}</head>`);
}

async function startServer() {
  backfillLegacyApprovals();
  startWhatsAppScheduler();
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  /* ---------------------------------------------------------------- */
  /* Subdomain + custom domain routing                                */
  /* ---------------------------------------------------------------- */
  app.use((req, _res, next) => {
    if (req.method !== "GET") return next();
    const requestPath = req.path;
    if (
      requestPath.startsWith("/api/") ||
      requestPath.startsWith("/uploads/") ||
      requestPath.startsWith("/assets/") ||
      requestPath.startsWith("/images/") ||
      requestPath.startsWith("/@") ||
      requestPath.startsWith("/src/") ||
      requestPath.startsWith("/node_modules/") ||
      requestPath.startsWith("/.well-known/") ||
      requestPath === "/robots.txt" ||
      requestPath === "/sitemap.xml" ||
      requestPath === "/favicon.ico" ||
      // Never rewrite requests for static files (they carry an extension).
      /\.[a-z0-9]{2,6}$/i.test(requestPath)
    ) {
      return next();
    }
    const host = req.hostname.toLowerCase();
    /** Owners and clients on a salon domain should reach the platform for account pages. */
    const redirectToPlatform = (res: Response) => {
      const origin = (process.env.PUBLIC_SITE_ORIGIN || "").replace(/\/$/, "");
      if (!origin) return false;
      try {
        const originHost = new URL(origin).host.toLowerCase();
        if (originHost === host) return false;
      } catch {
        return false;
      }
      const platformPaths = [
        "/dashboard",
        "/admin",
        "/login",
        "/signup",
        "/onboarding",
        "/forgot-password",
        "/reset-password",
        "/pricing",
        "/marketplace",
      ];
      const isPlatformPath = platformPaths.some(
        (prefix) => requestPath === prefix || requestPath.startsWith(`${prefix}/`)
      );
      if (!isPlatformPath) return false;
      res.redirect(302, `${origin}${req.originalUrl}`);
      return true;
    };

    if (baseDomain && host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.slice(0, -(baseDomain.length + 1));
      if (subdomain && !["www", "api", "app"].includes(subdomain)) {
        if (redirectToPlatform(req.res)) return;
        req.url = `/${subdomain}${req.url}`;
      }
      return next();
    }
    if (!["localhost", "127.0.0.1"].includes(host) && !host.endsWith(".e2b.app")) {
      const custom = db
        .prepare(
          "SELECT slug FROM salons WHERE custom_domain = ? COLLATE NOCASE AND custom_domain_verified = 1 AND status = 'published' AND approval_status = 'approved'"
        )
        .get(host) as any;
      if (custom?.slug) {
        if (redirectToPlatform(req.res)) return;
        req.url = `/${custom.slug}${req.url === "/" ? "" : req.url}`;
      }
    }
    next();
  });

  /* ---------------------------------------------------------------- */
  /* API                                                              */
  /* ---------------------------------------------------------------- */
  app.get("/api/health", (_req, res) => {
    try {
      const probe = db.prepare("SELECT 1 AS ok").get() as { ok: number };
      const published = db
        .prepare("SELECT COUNT(*) AS count FROM salons WHERE status = 'published' AND approval_status = 'approved'")
        .get() as { count: number };
      res.json({
        status: probe?.ok === 1 ? "ok" : "degraded",
        database: probe?.ok === 1 ? "sqlite" : "unreachable",
        publishedSalons: published?.count ?? 0,
        uptimeSeconds: Math.round(process.uptime()),
        time: new Date().toISOString(),
      });
    } catch (error: any) {
      res
        .status(503)
        .setHeader("Cache-Control", "no-store")
        .json({ status: "error", database: "unreachable", message: error?.message || "Database check failed." });
    }
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/salons", salonRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { message: "API endpoint not found.", code: "not_found" } });
  });

  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "data", "uploads"), {
      maxAge: "30d",
      immutable: true,
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    })
  );

  /* ---------------------------------------------------------------- */
  /* SEO files                                                        */
  /* ---------------------------------------------------------------- */

  const siteOrigin = () => (process.env.PUBLIC_SITE_ORIGIN || "").replace(/\/$/, "");

  app.get("/robots.txt", (req, res) => {
    const origin = siteOrigin() || `${req.protocol}://${req.get("host")}`;
    const lines = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /dashboard",
      "Disallow: /admin",
      "Disallow: /api/",
      "",
      `Sitemap: ${origin}/sitemap.xml`,
      "",
    ];
    res.type("text/plain").setHeader("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
  });

  app.get("/sitemap.xml", (req, res) => {
    const origin = siteOrigin() || `${req.protocol}://${req.get("host")}`;
    const rows = db
      .prepare(
        "SELECT slug, updated_at FROM salons WHERE status = 'published' AND approval_status = 'approved' ORDER BY published_at DESC"
      )
      .all() as { slug: string; updated_at: string }[];
    const urls = [
      { loc: `${origin}/`, lastmod: undefined as string | undefined },
      { loc: `${origin}/marketplace`, lastmod: undefined },
      { loc: `${origin}/pricing`, lastmod: undefined },
      ...rows.map((row) => ({ loc: `${origin}/${row.slug}`, lastmod: row.updated_at?.slice(0, 10) })),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) =>
      `  <url><loc>${entry.loc.replace(/&/g, "&amp;")}</loc>${
        entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""
      }</url>`
  )
  .join("\n")}
</urlset>`;
    res
      .type("application/xml")
      .setHeader("Cache-Control", "public, max-age=3600")
      .send(body);
  });

  /* ---------------------------------------------------------------- */
  /* Frontend                                                         */
  /* ---------------------------------------------------------------- */
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        host: HOST,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
    app.use(
      express.static(distPath, {
        maxAge: "1h",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
        },
      })
    );
    /**
     * Client-side routes. Everything else that is not a live salon is a real
     * 404 — an unknown slug or subdomain must not answer 200, or search
     * engines index empty tenant pages.
     */
    const appRoutes = [
      /^\/$/,
      /^\/pricing\/?$/,
      /^\/marketplace\/?$/,
      /^\/login\/?$/,
      /^\/signup\/?$/,
      /^\/auth(\/.*)?$/,
      /^\/forgot-password\/?$/,
      /^\/reset-password\/?$/,
      /^\/verify-email\/?$/,
      /^\/onboarding\/?$/,
      /^\/dashboard(\/.*)?$/,
      /^\/admin(\/.*)?$/,
    ];
    const isAppRoute = (requestPath: string) =>
      appRoutes.some((pattern) => pattern.test(requestPath)) ||
      (requestPath.startsWith("/s/") && requestPath.split("/").length === 3);

    const sendShell = (res: Response, status: number, requestPath = "") => {
      res.status(status);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      const isPrivate = requestPath === "/dashboard" || requestPath.startsWith("/dashboard/") ||
        requestPath === "/admin" || requestPath.startsWith("/admin/");
      if (status === 404 || isPrivate) res.setHeader("X-Robots-Tag", "noindex");
      res.send(indexHtml);
    };

    const serveSalon = (req: Request, res: Response) => {
      const slug = String(req.params.slug);
      if (!findPublicSalon(slug)) return sendShell(res, 404);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=30");
      res.send(injectSalonMeta(indexHtml, slug));
    };

    app.get("/s/:slug", serveSalon);
    app.get("/:slug", (req, res, next) => {
      if (req.path.includes(".")) return next();
      if (isAppRoute(req.path)) return sendShell(res, 200, req.path);
      return serveSalon(req, res);
    });
    app.get("*", (req, res) => {
      // Missing static assets should stay 404s, never an HTML page.
      if (/\.[a-z0-9]{2,6}$/i.test(req.path)) {
        return res.status(404).type("text/plain").send("Not found");
      }
      return sendShell(res, isAppRoute(req.path) ? 200 : 404, req.path);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Errors                                                           */
  /* ---------------------------------------------------------------- */
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      return res.status(error.status).json({
        error: { message: error.message, code: error.code, details: error.details },
      });
    }
    if (error?.name === "MulterError") {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `Image is too large. Maximum size is ${process.env.MAX_UPLOAD_MB || 6}MB.`
          : "Upload failed. Please choose a different image.";
      return res.status(400).json({ error: { message, code: "upload_error" } });
    }
    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: { message: "Request is too large.", code: "payload_too_large" } });
    }
    // Last line of defence for the unique booking index: a slot that slipped
    // past the application check is a conflict, not a server failure.
    if (typeof error?.code === "string" && error.code.startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).json({
        error: { message: "That record conflicts with an existing one. Please refresh and try again.", code: "conflict" },
      });
    }
    console.error("[api] Unhandled error:", error);
    res.status(500).json({
      error: { message: "Something went wrong on our side. Please try again.", code: "server_error" },
    });
  });

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n  Velvet Salon Studio`);
    console.log(`  → http://localhost:${PORT}`);
    console.log(`  → database: ${process.env.DATABASE_PATH || "data/salon-studio.db"}`);
    console.log(`  → ${isProduction ? "production" : "development"} mode`);
    if (baseDomain) console.log(`  → salon subdomains: *.${baseDomain}`);
    if (!process.env.JWT_SECRET) {
      console.log("  → JWT_SECRET not set; using a persisted development secret.");
    }
    if (process.env.ADMIN_EMAILS) {
      const count = process.env.ADMIN_EMAILS.split(",").filter((email) => email.trim()).length;
      console.log(`  → super admins bootstrapped from ADMIN_EMAILS: ${count}`);
    } else {
      console.log("  → ADMIN_EMAILS not set; promote super admins from the database or set it to bootstrap one.");
    }
    console.log(
      googleConfigured()
        ? "  → Google sign-in: enabled"
        : "  → Google sign-in: disabled (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)"
    );
    if (!process.env.SMTP_HOST) {
      console.log("  → SMTP not configured; booking emails are logged to the console.");
    }
  });

  const shutdown = () => {
    server.close(() => {
      try {
        db.close();
      } catch {
        /* noop */
      }
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  /* Daily reminder sweep for tomorrow's appointments. */
  cron.schedule("0 9 * * *", async () => {
    try {
      const utcDate = new Date().toISOString().slice(0, 10);
      const windowEnd = new Date(`${utcDate}T12:00:00Z`);
      windowEnd.setUTCDate(windowEnd.getUTCDate() + 2);
      const rows = db
        .prepare(
          `SELECT b.*, s.name AS salon_name, s.email AS salon_email, s.phone AS salon_phone,
                  s.address AS salon_address, s.city AS salon_city, s.slug AS salon_slug,
                  s.currency AS salon_currency, s.timezone AS salon_timezone
           FROM bookings b JOIN salons s ON s.id = b.salon_id
           WHERE b.date BETWEEN ? AND ? AND b.status IN ('pending','confirmed') AND b.customer_email <> ''`
        )
        .all(utcDate, windowEnd.toISOString().slice(0, 10)) as any[];
      let sent = 0;
      for (const row of rows) {
        // "Tomorrow" is a different calendar day per salon timezone; sending a
        // day early or late would be wrong for owners outside the server zone.
        const salonToday = dateInTimezone(row.salon_timezone || "UTC");
        const tomorrow = new Date(`${salonToday}T12:00:00Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        if (row.date !== tomorrow.toISOString().slice(0, 10)) continue;
        await sendReminderEmail({
          salon: {
            name: row.salon_name,
            email: row.salon_email,
            phone: row.salon_phone,
            address: row.salon_address,
            city: row.salon_city,
            slug: row.salon_slug,
            currency: row.salon_currency,
            timezone: row.salon_timezone,
          },
          booking: {
            id: row.id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            serviceName: row.service_name,
            staffName: row.staff_name,
            date: row.date,
            time: row.time,
            notes: row.notes,
            price: row.price_cents / 100,
          },
        });
        sent++;
      }
      if (sent) console.log(`[reminders] processed ${sent} appointment reminder(s).`);
    } catch (error: any) {
      console.warn("[reminders] failed:", error?.message || error);
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
