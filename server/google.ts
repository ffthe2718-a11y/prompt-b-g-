import crypto from "crypto";
import jwt from "jsonwebtoken";
import db, { newId, nowIso } from "./db";
import { ApiError, cleanText, normalizeEmail } from "./validation";
import { hashPassword, signingSecret } from "./auth";
import { getSettings, logAudit } from "./settings";

/**
 * Google Sign-In using the OAuth 2.0 authorization-code flow.
 *
 * Everything is handled server-side so the browser never sees the client
 * secret and the app can stay a normal SPA. After a successful round-trip the
 * user is redirected to the SPA with a one-time exchange code in the URL
 * fragment (never a session token, and never sent to a server or referrer).
 */

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

/**
 * Test seam used by scripts/fake-google.mjs. Only loopback hosts are accepted
 * and the override is ignored entirely in production, so a misconfigured
 * environment can never be pointed at a stranger's token endpoint.
 */
function endpoints() {
  const configured = process.env.NODE_ENV === "production" ? "" : process.env.GOOGLE_OAUTH_BASE?.trim();
  let base = "";
  if (configured) {
    try {
      const host = new URL(configured).hostname;
      if (host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]") base = configured;
      else console.warn("[google] GOOGLE_OAUTH_BASE must be loopback; ignoring", configured);
    } catch {
      console.warn("[google] GOOGLE_OAUTH_BASE is not a valid URL; ignoring");
    }
  }
  if (!base) return { auth: GOOGLE_AUTH, token: GOOGLE_TOKEN, userinfo: GOOGLE_USERINFO };
  const root = base.replace(/\/$/, "");
  return {
    auth: `${root}/o/oauth2/v2/auth`,
    token: `${root}/token`,
    userinfo: `${root}/userinfo`,
  };
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function clientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || "";
}
function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

export function publicOrigin(req: { protocol: string; get: (name: string) => string | undefined }): string {
  const configured = (process.env.PUBLIC_SITE_ORIGIN || process.env.APP_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");
  const host = req.get("host") || "localhost:3000";
  const proto = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol || "http";
  return `${proto}://${host}`;
}

export function redirectUri(req: { protocol: string; get: (name: string) => string | undefined }): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured;
  return `${publicOrigin(req)}/api/auth/google/callback`;
}

export interface OAuthState {
  nonce: string;
  returnTo: string;
  origin: string;
}

export function createState(state: OAuthState): string {
  return jwt.sign({ ...state, purpose: "google_oauth" }, signingSecret, {
    expiresIn: "10m",
    issuer: "velvet-salon-studio",
    audience: "google-oauth",
  });
}

export function readState(token: string | undefined): OAuthState | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, signingSecret, {
      issuer: "velvet-salon-studio",
      audience: "google-oauth",
    }) as jwt.JwtPayload;
    if (payload.purpose !== "google_oauth") return null;
    return {
      nonce: String(payload.nonce || ""),
      returnTo: String(payload.returnTo || "/dashboard"),
      origin: String(payload.origin || ""),
    };
  } catch {
    return null;
  }
}

/** Only same-app absolute paths are accepted as post-login destinations. */
export function safeReturnTo(value: unknown): string {
  const path = typeof value === "string" ? value.trim() : "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/dashboard";
  return path.slice(0, 300);
}

export function buildAuthUrl(options: { nonce: string; origin: string; returnTo: string; redirectUri: string }) {
  const state = createState({ nonce: options.nonce, origin: options.origin, returnTo: options.returnTo });
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `${endpoints().auth}?${params.toString()}`;
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

export async function exchangeCode(code: string, redirect: string): Promise<string> {
  const response = await fetch(endpoints().token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    console.warn("[google] token exchange failed:", payload.error || response.status, payload.error_description || "");
    throw new ApiError(400, "Google sign-in could not be completed. Please try again.", "google_exchange_failed");
  }
  return payload.access_token;
}

async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(endpoints().userinfo, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const profile = (await response.json().catch(() => ({}))) as Partial<GoogleProfile>;
  if (!response.ok || !profile.sub) {
    throw new ApiError(400, "We couldn't read your Google account details.", "google_profile_failed");
  }
  return {
    sub: String(profile.sub),
    email: normalizeEmail(profile.email),
    email_verified: profile.email_verified === true,
    name: cleanText(profile.name, 80),
    picture: typeof profile.picture === "string" ? profile.picture.slice(0, 500) : "",
  };
}

export interface GoogleSignInResult {
  user: any;
  created: boolean;
}

/**
 * Resolve a Google profile to a local account.
 * - Existing linked account: sign in.
 * - Email already registered: link Google after Google confirms the address.
 * - New email: create an owner account (unless signups are disabled).
 *
 * Passwords stay separate: a Google-only account gets an unguessable random
 * password hash so password login is impossible until the user sets one.
 */
export async function signInWithGoogle(accessToken: string): Promise<GoogleSignInResult> {
  const profile = await fetchProfile(accessToken);
  if (!profile.email) {
    throw new ApiError(400, "That Google account has no email address we can use.", "google_email_missing");
  }
  if (!profile.email_verified) {
    throw new ApiError(400, "Please verify the email address on your Google account first.", "google_email_unverified");
  }

  const now = nowIso();
  let row = db.prepare("SELECT * FROM users WHERE google_id = ?").get(profile.sub) as any;
  let created = false;

  if (!row) {
    row = db.prepare("SELECT * FROM users WHERE email = ?").get(profile.email) as any;
  }

  if (row) {
    db.prepare(
      `UPDATE users
          SET google_id = COALESCE(google_id, ?),
              avatar_url = CASE WHEN avatar_url = '' THEN ? ELSE avatar_url END,
              email_verified = 1,
              last_login_at = ?,
              updated_at = ?
        WHERE id = ?`
    ).run(profile.sub, profile.picture, now, now, row.id);
    row = db.prepare("SELECT * FROM users WHERE id = ?").get(row.id) as any;
  } else {
    const settings = getSettings();
    if (!settings.signupsEnabled) {
      throw new ApiError(403, "New sign-ups are paused right now. Please try again later.", "signups_disabled");
    }
    const id = newId();
    // Random 48-byte password: password login stays disabled for Google-only accounts.
    const unusable = hashPassword(crypto.randomBytes(48).toString("hex"));
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, role, google_id, avatar_url, password_set, email_verified, status, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'owner', ?, ?, 0, 1, 'active', ?, ?, ?)`
    ).run(
      id,
      profile.email,
      unusable,
      profile.name || profile.email.split("@")[0],
      profile.sub,
      profile.picture,
      now,
      now,
      now
    );
    row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    created = true;
  }

  if (row.status === "suspended") {
    throw new ApiError(403, "This account has been suspended. Please contact support.", "account_suspended");
  }

  logAudit({
    actorId: row.id,
    actorEmail: row.email,
    action: created ? "google_signup" : "google_login",
    targetType: "user",
    targetId: row.id,
  });

  return { user: row, created };
}

/** Short-lived, single-use handoff code handed to the SPA in the URL fragment. */
export function createExchangeCode(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "google_exchange" }, signingSecret, {
    expiresIn: "2m",
    issuer: "velvet-salon-studio",
    audience: "google-exchange",
  });
}

export function readExchangeCode(code: string | undefined): string | null {
  if (!code) return null;
  try {
    const payload = jwt.verify(code, signingSecret, {
      issuer: "velvet-salon-studio",
      audience: "google-exchange",
    }) as jwt.JwtPayload;
    if (payload.purpose !== "google_exchange" || !payload.sub) return null;
    return String(payload.sub);
  } catch {
    return null;
  }
}
