const BASE = process.env.BASE || "http://localhost:3200";
const PROFILE_FILE = "/tmp/fake-google-profile.json";
import fs from "fs";

let pass = 0;
let fail = 0;
function check(name, condition, extra = "") {
  if (condition) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${extra}`);
  }
}

function setProfile(profile) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile));
}

async function json(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
    redirect: "manual",
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  // API errors are nested as { error: { message, code } }; flatten for asserts.
  if (body && typeof body === "object" && body.error) {
    body = { ...body, message: body.error.message, code: body.error.code };
  }
  return { status: response.status, body, headers: response.headers };
}

/** Walk the OAuth redirect chain with a cookie jar, returning the SPA location. */
async function googleFlow(profile, { skipCookie = false, returnTo = "/dashboard" } = {}) {
  setProfile(profile);
  let cookie = "";
  const first = await fetch(`${BASE}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`, {
    redirect: "manual",
  });
  const setCookie = first.headers.get("set-cookie");
  if (setCookie && !skipCookie) cookie = setCookie.split(";")[0];
  const googleLocation = first.headers.get("location");
  if (!googleLocation) return { error: "no start redirect" };

  const second = await fetch(googleLocation, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const callbackLocation = second.headers.get("location");
  if (!callbackLocation) return { error: "no google redirect" };

  const third = await fetch(callbackLocation, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return { location: third.headers.get("location"), setCookie };
}

async function sessionFrom(chain) {
  if (!chain.location) return { error: chain.error || "no location" };
  const url = new URL(chain.location);
  if (url.searchParams.get("google_error")) {
    return {
      error: url.searchParams.get("google_error"),
      message: url.searchParams.get("google_message"),
    };
  }
  const params = new URLSearchParams(url.hash.replace(/^#/, ""));
  const code = params.get("code");
  if (!code) return { error: "no exchange code", location: chain.location };
  const exchanged = await json("/api/auth/google/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return { ...exchanged, code };
}

async function main() {
  console.log("\n1. Google OAuth configuration");
  const status = await json("/api/auth/google/status");
  check("status reports enabled", status.body?.enabled === true, JSON.stringify(status.body));

  console.log("\n2. New Google account");
  const chain = await googleFlow({
    sub: "g-new-1",
    email: "google.owner@example.com",
    email_verified: true,
    name: "Google Owner",
    picture: "https://example.com/p.png",
  });
  check("redirects to SPA callback", String(chain.location || "").includes("/auth/google/callback#code="));
  const session = await sessionFrom(chain);
  check("exchange returns a token", typeof session.body?.token === "string", JSON.stringify(session.body));
  check("provider is google", session.body?.user?.provider === "google");
  check("password not set", session.body?.user?.hasPassword === false);
  check("default role owner", session.body?.user?.role === "owner");
  check("avatar stored", session.body?.user?.avatarUrl === "https://example.com/p.png");
  const googleToken = session.body?.token;
  const handoffCode = session.code;

  const codeAsSession = await json("/api/auth/me", { headers: { Authorization: `Bearer ${handoffCode}` } });
  check("OAuth handoff code cannot act as a session", codeAsSession.status === 401);
  const sessionAsCode = await json("/api/auth/google/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: googleToken }),
  });
  check("session token cannot be swapped as a handoff code", sessionAsCode.status === 400);

  console.log("\n3. Set a password on a Google account");
  const setPassword = await json("/api/auth/set-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` },
    body: JSON.stringify({ newPassword: "google-pass-123" }),
  });
  check("set-password returns success", setPassword.status === 200, JSON.stringify(setPassword.body));
  const passwordLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "google.owner@example.com", password: "google-pass-123" }),
  });
  check("email + password login now works", passwordLogin.status === 200 && !!passwordLogin.body?.token);
  const meAfter = await json("/api/auth/me", { headers: { Authorization: `Bearer ${googleToken}` } });
  check("hasPassword flips to true", meAfter.body?.user?.hasPassword === true);

  console.log("\n4. Existing email gets linked, not duplicated");
  const linked = await sessionFrom(
    await googleFlow({ sub: "g-anaya", email: "anaya@velvet.demo", email_verified: true, name: "Anaya" })
  );
  check("signs into the existing account", linked.body?.user?.email === "anaya@velvet.demo");
  check("linked role stays owner", linked.body?.user?.role === "owner");
  const anayaId = linked.body?.user?.id;

  console.log("\n5. Rejected Google attempts");
  const noCookie = await googleFlow(
    { sub: "g-new-2", email: "nocookie@example.com", email_verified: true, name: "No Cookie" },
    { skipCookie: true }
  );
  check("missing CSRF cookie is rejected", noCookie.location?.includes("google_error=invalid_state"));

  const unverified = await googleFlow({
    sub: "g-unverified",
    email: "unverified@example.com",
    email_verified: false,
    name: "Unverified",
  });
  check("unverified email is rejected", unverified.location?.includes("google_error=google_email_unverified"));

  console.log("\n6. RBAC: owner tokens cannot reach the admin API");
  for (const path of ["/api/admin/stats", "/api/admin/users", "/api/admin/settings", "/api/admin/audit"]) {
    const denied = await json(path, { headers: { Authorization: `Bearer ${googleToken}` } });
    check(`GET ${path} → 403`, denied.status === 403, `got ${denied.status}`);
  }
  const deniedPatch = await json("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` },
    body: JSON.stringify({ platformName: "Hacked" }),
  });
  check("owner cannot patch settings", deniedPatch.status === 403);

  console.log("\n7. Super admin bootstrap and safe promotion");
  const adminLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@velvet.demo", password: "velvet-demo" }),
  });
  const adminToken = adminLogin.body?.token;
  check("seeded super admin can sign in", adminLogin.status === 200, JSON.stringify(adminLogin.body));
  check("role is super_admin", adminLogin.body?.user?.role === "super_admin");
  check("isAdmin flag set", adminLogin.body?.user?.isAdmin === true);

  // A password sign-up must never inherit platform rights from ADMIN_EMAILS.
  const sneaky = await json("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Sneaky Signup", email: "admin2@velvet.demo", password: "sneaky-pass-123" }),
  });
  check("password sign-up with an admin address stays an owner", sneaky.body?.user?.role === "owner");
  const sneakyLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin2@velvet.demo", password: "sneaky-pass-123" }),
  });
  check("password login does not promote an unverified address", sneakyLogin.body?.user?.role === "owner");

  // Google verifies the address, so the same account is promoted after linking.
  const verifiedAdmin = await sessionFrom(
    await googleFlow({ sub: "g-admin2", email: "admin2@velvet.demo", email_verified: true, name: "Verified Admin" })
  );
  check("Google verifies + promotes an ADMIN_EMAILS address", verifiedAdmin.body?.user?.role === "super_admin");

  const stats = await json("/api/admin/stats", { headers: { Authorization: `Bearer ${adminToken}` } });
  check("super admin reaches stats", stats.status === 200 && typeof stats.body?.users === "number");
  check("stats expose plan + MRR", typeof stats.body?.plans === "object" && typeof stats.body?.mrr === "number");

  console.log("\n8. Super admin manages users");
  const users = await json("/api/admin/users", { headers: { Authorization: `Bearer ${adminToken}` } });
  check("user list includes both providers", users.body?.users?.some((u) => u.provider === "google") && users.body?.users?.some((u) => u.provider === "password"));
  const googleUser = users.body.users.find((u) => u.email === "google.owner@example.com");

  const promote = await json(`/api/admin/users/${googleUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "super_admin" }),
  });
  check("can promote to super_admin", promote.body?.user?.role === "super_admin");

  const selfDemote = await json(`/api/admin/users/${adminLogin.body.user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "owner" }),
  });
  check("cannot demote self", selfDemote.status === 400 && selfDemote.body?.code === "cannot_demote_self");

  const suspend = await json(`/api/admin/users/${googleUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "suspended" }),
  });
  check("can suspend a user", suspend.body?.user?.status === "suspended");
  const suspendedMe = await json("/api/auth/me", { headers: { Authorization: `Bearer ${googleToken}` } });
  check("suspended session is rejected", suspendedMe.status === 403 && suspendedMe.body?.code === "account_suspended");
  const suspendedSalon = await json("/api/salons/me", { headers: { Authorization: `Bearer ${googleToken}` } });
  check("suspended token is rejected on every API route", suspendedSalon.status === 403);
  const suspendedLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "google.owner@example.com", password: "google-pass-123" }),
  });
  check("suspended login is rejected", suspendedLogin.status === 403);

  const suspendedGoogle = await googleFlow({
    sub: "g-new-1",
    email: "google.owner@example.com",
    email_verified: true,
    name: "Google Owner",
  });
  check("suspended Google sign-in is rejected", suspendedGoogle.location?.includes("google_error=account_suspended"));

  await json(`/api/admin/users/${googleUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "active", role: "owner" }),
  });
  const restored = await json("/api/auth/me", { headers: { Authorization: `Bearer ${googleToken}` } });
  check("reactivated session works again", restored.status === 200 && restored.body?.user?.status === "active");

  console.log("\n9. Tenant isolation");
  const anayaLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "anaya@velvet.demo", password: "velvet-demo" }),
  });
  const nainaLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "naina@velvet.demo", password: "velvet-demo" }),
  });
  const anayaToken = anayaLogin.body?.token;
  const nainaToken = nainaLogin.body?.token;
  const anayaSalon = await json("/api/salons/me", { headers: { Authorization: `Bearer ${anayaToken}` } });
  const nainaSalon = await json("/api/salons/me", { headers: { Authorization: `Bearer ${nainaToken}` } });
  check("each owner sees their own salon", anayaSalon.body?.salon?.slug !== nainaSalon.body?.salon?.slug);
  const nainaService = nainaSalon.body?.salon?.services?.[0];
  const crossPatch = await json(`/api/salons/me/services/${nainaService.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anayaToken}` },
    body: JSON.stringify({ name: "Stolen service" }),
  });
  check("cross-salon service edit → 404", crossPatch.status === 404 && crossPatch.body?.code === "not_found");
  const crossTargets = [
    ["staff", nainaSalon.body?.salon?.staff?.[0]?.id],
    ["gallery", nainaSalon.body?.salon?.gallery?.[0]?.id],
    ["reviews", nainaSalon.body?.salon?.reviews?.[0]?.id],
  ];
  for (const [kind, id] of crossTargets) {
    if (!id) continue;
    const body =
      kind === "staff" ? { name: "Stolen staff" } : kind === "gallery" ? { caption: "Stolen" } : { reply: "Stolen reply" };
    const path = kind === "reviews" ? `/api/salons/me/reviews/${id}` : `/api/salons/me/${kind}/${id}`;
    const result = await json(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anayaToken}` },
      body: JSON.stringify(body),
    });
    check(`cross-salon ${kind} edit → 404`, result.status === 404, `got ${result.status}`);
  }

  const anayaBookings = await json("/api/salons/me/bookings", { headers: { Authorization: `Bearer ${anayaToken}` } });
  const foreignBooking = (anayaBookings.body?.bookings || [])[0];
  if (foreignBooking) {
    const crossBooking = await json(`/api/salons/me/bookings/${foreignBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${nainaToken}` },
      body: JSON.stringify({ status: "cancelled" }),
    });
    check("cross-salon booking edit → 404", crossBooking.status === 404);
  }
  const noSalonAdmin = await json("/api/salons/me", { headers: { Authorization: `Bearer ${adminToken}` } });
  check("super admin has no salon profile", noSalonAdmin.status === 404 && noSalonAdmin.body?.code === "no_salon");

  console.log("\n10. Subscriptions + settings");
  const subs = await json("/api/admin/subscriptions", { headers: { Authorization: `Bearer ${adminToken}` } });
  check("subscription list loads", subs.status === 200 && Array.isArray(subs.body?.subscriptions));
  const target = subs.body.subscriptions[0];
  const planUpdate = await json(`/api/admin/salons/${target.salonId}/subscription`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ plan: "studio", status: "trialing", renewsAt: "2026-11-30T00:00:00.000Z" }),
  });
  check("plan change saved", planUpdate.status === 200);
  const subsAfter = await json("/api/admin/subscriptions", { headers: { Authorization: `Bearer ${adminToken}` } });
  const updated = subsAfter.body.subscriptions.find((s) => s.salonId === target.salonId);
  check("subscription reflects new plan", updated?.plan === "studio" && updated?.status === "trialing");
  check("MRR counts active/trialing plans", subsAfter.body.summary.mrr >= 1499);

  const settingsPatch = await json("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ platformName: "Atelier Cloud", signupsEnabled: false, directoryVisible: false }),
  });
  check("settings saved", settingsPatch.body?.settings?.platformName === "Atelier Cloud");

  const config = await json("/api/public/config");
  check("public config reflects settings", config.body?.platformName === "Atelier Cloud" && config.body?.signupsEnabled === false);
  const directory = await json("/api/public/salons");
  check("directory hides when disabled", Array.isArray(directory.body?.salons) && directory.body.salons.length === 0);

  const blockedRegister = await json("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Late Owner", email: "late@example.com", password: "late-pass-123" }),
  });
  check("sign-up blocked when disabled", blockedRegister.status === 403 && blockedRegister.body?.code === "signups_disabled");

  const blockedGoogle = await googleFlow({
    sub: "g-late",
    email: "late@example.com",
    email_verified: true,
    name: "Late Owner",
  });
  check("Google sign-up blocked when disabled", blockedGoogle.location?.includes("google_error=signups_disabled"));

  const reenable = await json("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ signupsEnabled: true, directoryVisible: true }),
  });
  check("sign-ups can be re-enabled", reenable.body?.settings?.signupsEnabled === true);

  console.log("\n11. Audit trail");
  const audit = await json("/api/admin/audit", { headers: { Authorization: `Bearer ${adminToken}` } });
  const actions = new Set((audit.body?.entries || []).map((entry) => entry.action));
  for (const action of ["google_signup", "user_updated", "subscription_updated", "settings_updated"]) {
    check(`audited ${action}`, actions.has(action));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
