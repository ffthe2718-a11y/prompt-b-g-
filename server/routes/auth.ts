import { Router } from "express";
import { createHash, randomBytes } from "crypto";
import db, { newId, nowIso } from "../db";
import {
  AuthedRequest,
  findUserByEmail,
  hashPassword,
  rateLimit,
  requireAuth,
  signToken,
  validateRegistration,
  verifyPassword,
} from "../auth";
import { ApiError, cleanText, isEmail, normalizeEmail } from "../validation";
import { userPayload } from "../serializers";
import { sendPasswordResetEmail, sendVerificationEmail } from "../emails";
import { getSettings } from "../settings";
import {
  buildAuthUrl,
  createExchangeCode,
  exchangeCode,
  googleConfigured,
  publicOrigin,
  readExchangeCode,
  readState,
  redirectUri,
  safeReturnTo,
  signInWithGoogle,
} from "../google";

const router = Router();

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many verification requests. Please try again in a few minutes.",
  key: (req) => `verify:${req.ip ?? "unknown"}`,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: "Too many password reset requests. Please try again later.",
  key: (req) => `reset:${req.ip ?? "unknown"}`,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many sign-in attempts. Please wait a few minutes.",
  key: (req) => `auth:${req.ip ?? "unknown"}`,
});

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}


/**
 * Role-based access control.
 *
 * - `owner`       salon owner (one salon per account)
 * - `super_admin` platform staff; may manage every user, salon, plan and setting
 * - visitors are simply unauthenticated requests to public endpoints
 *
 * `ADMIN_EMAILS` lets an operator bootstrap super admins without touching the
 * database by hand. Any `admin` value from an older build is normalised here.
 */
function ensureAdminRole(row: any) {
  if (!row) return row;
  const email = String(row.email || "").toLowerCase();
  if (row.role === "admin") {
    db.prepare("UPDATE users SET role = 'super_admin', updated_at = ? WHERE id = ?").run(nowIso(), row.id);
    row.role = "super_admin";
    return row;
  }
  // Only promote addresses we know are owned by the account holder. Password
  // sign-ups do not verify email, so promoting them here would let anyone claim
  // an ADMIN_EMAILS address before the real operator registers.
  if (email && adminEmails().includes(email) && row.email_verified === 1 && row.role !== "super_admin") {
    db.prepare("UPDATE users SET role = 'super_admin', updated_at = ? WHERE id = ?").run(nowIso(), row.id);
    row.role = "super_admin";
  }
  return row;
}

function assertAccountActive(row: any) {
  if (row?.status === "suspended") {
    throw new ApiError(403, "This account has been suspended. Please contact support.", "account_suspended");
  }
  return row;
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const name = cleanText(req.body?.name, 80);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (name.length < 2) throw new ApiError(400, "Please enter your full name.", "invalid_name");
    validateRegistration(email, password);
    if (!getSettings().signupsEnabled) {
      throw new ApiError(403, "New sign-ups are paused right now. Please try again later.", "signups_disabled");
    }
    if (findUserByEmail(email)) {
      throw new ApiError(409, "An account with this email already exists. Please sign in.", "email_taken");
    }

    const id = newId();
    const now = nowIso();
    // Never grant platform rights to an unverified email address.
    const role = "owner";
    db.prepare(
      "INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, email, hashPassword(password), name, role, now, now);

    const user = ensureAdminRole(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
    // Password sign-ups start unverified; the email link unlocks submitting and publishing.
    await sendVerification(user, req).catch((error) =>
      console.warn("[email] could not send verification:", error?.message || error)
    );
    res.status(201).json({
      token: signToken(user),
      user: userPayload(user),
      verificationRequired: true,
      verificationSent: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new ApiError(401, "Invalid email or password.", "invalid_credentials");
    }
    assertAccountActive(user);
    ensureAdminRole(user);
    db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), user.id);
    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as AuthedRequest).user!;
  const row = ensureAdminRole(db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
  if (!row) throw new ApiError(401, "Your account no longer exists.", "unauthorized");
  assertAccountActive(row);
  res.json({ user: userPayload(row) });
});

router.patch("/profile", requireAuth, (req, res, next) => {
  try {
    const authUser = (req as AuthedRequest).user!;
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(authUser.id) as any;
    if (!row) throw new ApiError(404, "Account not found.", "not_found");

    const name = req.body?.name === undefined ? row.name : cleanText(req.body.name, 80);
    const email = req.body?.email === undefined ? row.email : normalizeEmail(req.body.email);
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (name.length < 2) throw new ApiError(400, "Name must be at least 2 characters.", "invalid_name");
    if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");
    const emailChanged = email !== row.email;
    if (emailChanged) {
      const existing = findUserByEmail(email);
      if (existing && existing.id !== row.id) {
        throw new ApiError(409, "That email is already in use.", "email_taken");
      }
    }

    let passwordHash = row.password_hash;
    if (newPassword) {
      if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters.", "weak_password");
      }
      if (!verifyPassword(currentPassword, row.password_hash)) {
        throw new ApiError(400, "Current password is incorrect.", "invalid_password");
      }
      passwordHash = hashPassword(newPassword);
    }

    const now = nowIso();
    db.prepare(
      `UPDATE users
          SET name = ?, email = ?, password_hash = ?, password_set = ?,
              email_verified = ?, updated_at = ?
        WHERE id = ?`
    ).run(
      name,
      email,
      passwordHash,
      newPassword ? 1 : row.password_set,
      emailChanged ? 0 : row.email_verified,
      now,
      row.id
    );
    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(row.id) as any;
    if (emailChanged) void sendVerification(updated, req);
    res.json({
      user: userPayload(updated),
      verificationRequired: emailChanged,
      verificationSent: emailChanged,
    });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function requestOrigin(req: any): string {
  return (
    process.env.PUBLIC_SITE_ORIGIN ||
    process.env.APP_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
}

/**
 * Email ownership check. Tokens are hashed at rest, single-use and expire in
 * 24 hours. With SMTP unconfigured the link is logged so local setup still works.
 */
async function sendVerification(user: any, req: any) {
  const token = randomBytes(32).toString("hex");
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM email_verifications WHERE user_id = ? AND used_at IS NULL").run(user.id);
  db.prepare(
    "INSERT INTO email_verifications (token_hash, user_id, email, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)"
  ).run(hashToken(token), user.id, user.email, expiresAt, now);
  const url = `${requestOrigin(req)}/verify-email?token=${token}`;
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl: url });
}

router.post("/forgot-password", resetLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");

    const user = findUserByEmail(email);
    // Always respond the same way so the endpoint cannot be used to discover accounts.
    const message = "If an account exists for that email, a reset link is on its way.";

    if (user) {
      const token = randomBytes(32).toString("hex");
      const now = nowIso();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.prepare("DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL").run(user.id);
      db.prepare(
        "INSERT INTO password_resets (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)"
      ).run(hashToken(token), user.id, expiresAt, now);

      const origin = (
        process.env.PUBLIC_SITE_ORIGIN ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");
      const path = `/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: origin ? `${origin}${path}` : path,
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", resetLimiter, (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!token) throw new ApiError(400, "This reset link is incomplete. Please request a new one.", "invalid_token");
    if (password.length < 8) {
      throw new ApiError(400, "Your new password must be at least 8 characters.", "weak_password");
    }

    const record = db
      .prepare("SELECT * FROM password_resets WHERE token_hash = ?")
      .get(hashToken(token)) as any;
    if (!record) {
      throw new ApiError(400, "This reset link is not valid. Please request a new one.", "invalid_token");
    }
    if (record.used_at) {
      throw new ApiError(400, "This reset link has already been used. Please request a new one.", "used_token");
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new ApiError(400, "This reset link has expired. Please request a new one.", "expired_token");
    }

    const now = nowIso();
    const update = db.transaction(() => {
      db.prepare("UPDATE users SET password_hash = ?, password_set = 1, updated_at = ? WHERE id = ?").run(
        hashPassword(password),
        now,
        record.user_id
      );
      db.prepare("UPDATE password_resets SET used_at = ? WHERE token_hash = ?").run(now, record.token_hash);
    });
    update();

    res.json({ success: true, message: "Your password has been updated. You can sign in now." });
  } catch (error) {
    next(error);
  }
});


/* ------------------------------------------------------------------ */
/* Email verification                                                  */
/* ------------------------------------------------------------------ */

router.post("/send-verification", requireAuth, verificationLimiter, async (req, res, next) => {
  try {
    const authUser = (req as AuthedRequest).user!;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(authUser.id) as any;
    if (!user) throw new ApiError(404, "Account not found.", "not_found");
    if (user.email_verified === 1) {
      return res.json({ success: true, alreadyVerified: true, message: "Your email is already confirmed." });
    }
    await sendVerification(user, req);
    res.json({
      success: true,
      message: "Verification email sent. Check your inbox (and spam folder).",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-email", verificationLimiter, (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token) {
      throw new ApiError(400, "This verification link is incomplete. Request a new one.", "invalid_token");
    }
    const record = db
      .prepare("SELECT * FROM email_verifications WHERE token_hash = ?")
      .get(hashToken(token)) as any;
    if (!record) {
      throw new ApiError(400, "This verification link is not valid. Request a new one.", "invalid_token");
    }
    if (record.used_at) {
      throw new ApiError(400, "This link has already been used. Request a new one.", "used_token");
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new ApiError(400, "This link has expired. Request a new one.", "expired_token");
    }

    const now = nowIso();
    const verify = db.transaction(() => {
      db.prepare("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?").run(now, record.user_id);
      db.prepare("UPDATE email_verifications SET used_at = ? WHERE token_hash = ?").run(now, record.token_hash);
    });
    verify();

    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(record.user_id) as any;
    ensureAdminRole(user);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(record.user_id) as any;

    res.json({
      success: true,
      message: "Email confirmed. You can now submit your website for approval.",
      user: userPayload(user),
    });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Google Sign-In                                                      */
/* ------------------------------------------------------------------ */

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many sign-in attempts. Please wait a few minutes.",
  key: (req) => `google:${req.ip ?? "unknown"}`,
});

function readCookie(req: any, name: string): string {
  const header = String(req.headers?.cookie || "");
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function appUrl(req: any): string {
  return (process.env.PUBLIC_SITE_ORIGIN || process.env.APP_URL || "").trim().replace(/\/$/, "") || publicOrigin(req);
}

function failRedirect(req: any, res: any, code: string, message: string) {
  const params = new URLSearchParams({ google_error: code, google_message: message.slice(0, 180) });
  res.redirect(302, `${appUrl(req)}/login?${params.toString()}`);
}

router.get("/google/status", (_req, res) => {
  res.json({ enabled: googleConfigured() });
});

/**
 * Step 1 — send the browser to Google.
 * State is signed (tamper-proof) and mirrored in an httpOnly cookie so a
 * callback cannot be replayed from a different browser (login CSRF).
 */
router.get("/google/start", googleLimiter, (req, res, next) => {
  try {
    if (!googleConfigured()) {
      throw new ApiError(503, "Google sign-in is not configured on this server.", "google_not_configured");
    }
    const nonce = randomBytes(24).toString("hex");
    const origin = publicOrigin(req);
    const returnTo = safeReturnTo(req.query.returnTo);
    const redirect = redirectUri(req);

    res.cookie("velvet_oauth_nonce", nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      maxAge: 10 * 60 * 1000,
      path: "/api/auth/google",
    });
    res.redirect(302, buildAuthUrl({ nonce, origin, returnTo, redirectUri: redirect }));
  } catch (error) {
    next(error);
  }
});

/** Step 2 — Google returns here. Resolve the account, then hand a code to the SPA. */
router.get("/google/callback", googleLimiter, async (req, res) => {
  try {
    if (!googleConfigured()) {
      return failRedirect(req, res, "google_not_configured", "Google sign-in is not configured on this server.");
    }

    const state = readState(typeof req.query.state === "string" ? req.query.state : undefined);
    if (!state) {
      return failRedirect(req, res, "invalid_state", "That sign-in link expired. Please try again.");
    }

    const cookieNonce = readCookie(req, "velvet_oauth_nonce");
    res.clearCookie("velvet_oauth_nonce", { path: "/api/auth/google" });
    if (!cookieNonce || cookieNonce !== state.nonce) {
      return failRedirect(
        req,
        res,
        "invalid_state",
        "We couldn't verify that sign-in attempt. Please try again in the same browser."
      );
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      return failRedirect(req, res, "access_denied", "Google sign-in was cancelled.");
    }

    const accessToken = await exchangeCode(code, redirectUri(req));
    const { user } = await signInWithGoogle(accessToken);
    ensureAdminRole(user);

    const handoff = createExchangeCode(user.id);
    const destination = `${appUrl(req)}/auth/google/callback#code=${encodeURIComponent(handoff)}&next=${encodeURIComponent(
      state.returnTo
    )}`;
    res.redirect(302, destination);
  } catch (error: any) {
    const code = typeof error?.code === "string" ? error.code : "google_failed";
    const message = typeof error?.message === "string" ? error.message : "Google sign-in failed. Please try again.";
    console.warn("[google] callback failed:", code, message);
    return failRedirect(req, res, code, message);
  }
});

/** Step 3 — the SPA trades the short-lived code for a normal session token. */
router.post("/google/exchange", googleLimiter, (req, res, next) => {
  try {
    const userId = readExchangeCode(typeof req.body?.code === "string" ? req.body.code : undefined);
    if (!userId) {
      throw new ApiError(400, "That sign-in handoff expired. Please sign in with Google again.", "invalid_code");
    }
    const row = ensureAdminRole(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
    if (!row) throw new ApiError(401, "Your account no longer exists.", "unauthorized");
    assertAccountActive(row);
    res.json({ token: signToken(row), user: userPayload(row) });
  } catch (error) {
    next(error);
  }
});

/** Lets a signed-in account without a password set one (Google-only accounts). */
router.post("/set-password", requireAuth, (req, res, next) => {
  try {
    const authUser = (req as AuthedRequest).user!;
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(authUser.id) as any;
    if (!row) throw new ApiError(404, "Account not found.", "not_found");
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (newPassword.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters.", "weak_password");
    }
    if (newPassword.length > 128) {
      throw new ApiError(400, "Password is too long.", "weak_password");
    }
    if (row.password_set) {
      if (!verifyPassword(currentPassword, row.password_hash)) {
        throw new ApiError(400, "Current password is incorrect.", "invalid_password");
      }
    }
    db.prepare("UPDATE users SET password_hash = ?, password_set = 1, updated_at = ? WHERE id = ?").run(
      hashPassword(newPassword),
      nowIso(),
      row.id
    );
    res.json({ success: true, message: "Password set. You can now sign in with email and password too." });
  } catch (error) {
    next(error);
  }
});

export default router;
