import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import db from "./db";
import { ApiError, isEmail, normalizeEmail } from "./validation";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "super_admin";
  avatar_url: string;
  status: "active" | "suspended";
  created_at: string;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

function loadJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 24) return fromEnv;

  // Persist a generated secret so development / small deployments keep
  // sessions valid across restarts. Always set JWT_SECRET in production.
  const secretPath = path.join(process.cwd(), "data", ".jwt-secret");
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, "utf8").trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(48).toString("hex");
    fs.mkdirSync(path.dirname(secretPath), { recursive: true });
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(48).toString("hex");
  }
}

const JWT_SECRET = loadJwtSecret();
/** Shared signing material for short-lived, non-session tokens (OAuth state, codes). */
export const signingSecret = JWT_SECRET;
const TOKEN_TTL = "30d";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: Pick<AuthUser, "id" | "email" | "role">): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
    issuer: "velvet-salon-studio",
  });
}

export function readUserFromToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: "velvet-salon-studio" }) as jwt.JwtPayload;
    if (!payload.sub) return null;
    // Short-lived OAuth handoff tokens are not sessions, even though they share
    // a signing key. Refuse anything that declares another purpose.
    if (payload.purpose) return null;
    const row = db
      .prepare("SELECT id, email, name, role, avatar_url, status, created_at FROM users WHERE id = ?")
      .get(payload.sub) as AuthUser | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const user = readUserFromToken(token);
    if (user) (req as AuthedRequest).user = user;
  }
  next();
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(new ApiError(401, "Please sign in to continue.", "unauthorized"));
  }
  const user = readUserFromToken(token);
  if (!user) {
    return next(new ApiError(401, "Your session has expired. Please sign in again.", "session_expired"));
  }
  if (user.status === "suspended") {
    return next(
      new ApiError(403, "This account has been suspended. Please contact support.", "account_suspended")
    );
  }
  (req as AuthedRequest).user = user;
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  const user = (req as AuthedRequest).user;
  if (!user) return next(new ApiError(401, "Please sign in to continue.", "unauthorized"));
  if (user.role !== "super_admin") {
    return next(new ApiError(403, "Super admin access required.", "forbidden"));
  }
  next();
};

export function requireSalonOwner(userId: string) {
  const salon = db.prepare("SELECT * FROM salons WHERE owner_id = ?").get(userId) as any;
  if (!salon) {
    throw new ApiError(404, "Create your salon profile first.", "no_salon");
  }
  return salon;
}

export function assertOwnedResource(table: "services" | "staff" | "gallery" | "bookings" | "reviews" | "service_addons", resourceId: string, salonId: string) {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND salon_id = ?`).get(resourceId, salonId) as any;
  if (!row) throw new ApiError(404, "Item not found.", "not_found");
  return row;
}

export function findUserByEmail(email: string): any {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email));
}

export function validateRegistration(email: string, password: string): void {
  if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.", "weak_password");
  }
  if (password.length > 128) {
    throw new ApiError(400, "Password is too long.", "weak_password");
  }
}

/** Small in-memory rate limiter suitable for a single-node deployment. */
export function rateLimit(options: { windowMs: number; max: number; message?: string; key?: (req: Request) => string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (value.resetAt <= now) hits.delete(key);
    }
  }, 60_000);
  cleanup.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.key?.(req) ?? req.ip ?? "unknown";
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader("X-RateLimit-Limit", options.max);
      return next();
    }
    entry.count += 1;
    if (entry.count > options.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return next(new ApiError(429, options.message ?? "Too many requests. Please try again shortly.", "rate_limited"));
    }
    next();
  };
}
