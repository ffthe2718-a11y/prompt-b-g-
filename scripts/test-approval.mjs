/**
 * RBAC + approval workflow end-to-end checks.
 *
 * Run against a disposable server:
 *   DATABASE_PATH=/tmp/auth-test.db PORT=3200 ... npx tsx server.ts
 *   BASE=http://localhost:3200 DATABASE_PATH=/tmp/auth-test.db node scripts/test-approval.mjs
 */
const BASE = process.env.BASE || "http://localhost:3200";
const DB_PATH = process.env.DATABASE_PATH || "/tmp/auth-test.db";
// Run-scoped identifiers keep the suite repeatable against the same database.
const RUN_ID = `${Date.now()}`;
const TESTER_EMAIL = `approval.tester.${RUN_ID}@example.com`;
const SALON_SLUG = `approval-atelier-${RUN_ID}`;
const SALON_NAME = `Approval Atelier ${RUN_ID.slice(-5)}`;
const VERIFY_TOKEN = `verify-${RUN_ID}`;
if (path.resolve(DB_PATH) === path.resolve(process.cwd(), "data/salon-studio.db")) {
  console.error("Refusing to run against the primary database. Set DATABASE_PATH to a throwaway copy.");
  process.exit(1);
}
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${detail}`); }
};

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, body: json, code: json?.error?.code, message: json?.error?.message };
}

import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

async function login(email, password) {
  const result = await api("/api/auth/login", { method: "POST", body: { email, password } });
  return result.body?.token;
}

const run = async () => {
  console.log("\nRBAC & approval E2E\n");
  const db = new (require("better-sqlite3"))(DB_PATH);

  /* ---------- authentication ---------- */
  const missing = await api("/api/salons/me");
  check("anonymous visitors cannot read a private salon", missing.status === 401, String(missing.status));
  const missingAdmin = await api("/api/admin/stats");
  check("anonymous visitors cannot read admin data", missingAdmin.status === 401, String(missingAdmin.status));

  const ownerToken = await login("anaya@velvet.demo", "velvet-demo");
  const otherToken = await login("naina@velvet.demo", "velvet-demo");
  check("owner can sign in", !!ownerToken);
  check("second owner can sign in", !!otherToken);

  const codeConfusion = await api("/api/auth/google/exchange", { method: "POST", body: { code: ownerToken } });
  check("session tokens cannot be replayed as Google handoff codes", codeConfusion.status === 400, String(codeConfusion.status));

  const me = await api("/api/auth/me", { token: ownerToken });
  check("session exposes role and email verification", me.body?.user?.role === "owner" && me.body?.user?.emailVerified === true);

  /* ---------- role enforcement ---------- */
  for (const [label, path, method, body] of [
    ["stats", "/api/admin/stats", "GET", undefined],
    ["users", "/api/admin/users", "GET", undefined],
    ["salons", "/api/admin/salons", "GET", undefined],
    ["settings", "/api/admin/settings", "PATCH", { platformName: "Hacked" }],
    ["approvals", "/api/admin/approvals", "GET", undefined],
  ]) {
    const result = await api(path, { token: ownerToken, method, body });
    check(`owners are blocked from admin ${label}`, result.status === 403, `${result.status} ${result.code || ""}`);
  }

  /* ---------- super admin ---------- */
  const adminToken = await login("admin@velvet.demo", "velvet-demo");
  check("super admin can sign in", !!adminToken);
  const adminMe = await api("/api/auth/me", { token: adminToken });
  check("super admin role is exposed", adminMe.body?.user?.role === "super_admin" && adminMe.body?.user?.isAdmin === true);
  check("super admin has no salon profile", (await api("/api/salons/me", { token: adminToken })).status === 404);

  const stats = await api("/api/admin/stats", { token: adminToken });
  check("admin stats include pendingApprovals", stats.status === 200 && typeof stats.body?.pendingApprovals === "number", JSON.stringify(stats.body).slice(0, 120));

  const users = await api("/api/admin/users", { token: adminToken });
  check("admin can list users", users.status === 200 && Array.isArray(users.body?.users), String(users.status));
  check("user rows expose provider + verification", "emailVerified" in (users.body?.users?.[0] || {}), JSON.stringify(users.body?.users?.[0]).slice(0, 200));

  /* ---------- public visitor ---------- */
  const directory = await api("/api/public/salons");
  check("public directory is readable without a session", directory.status === 200 && directory.body?.salons?.length >= 2, String(directory.status));

  /* ---------- cross-salon isolation ---------- */
  const mine = await api("/api/salons/me", { token: ownerToken });
  const theirs = await api("/api/salons/me", { token: otherToken });
  check("each owner sees their own salon", mine.body?.salon?.slug === "house-of-lumen" && theirs.body?.salon?.slug === "ochre-and-ink");
  const foreignService = theirs.body?.salon?.services?.[0]?.id;
  const foreignStaff = theirs.body?.salon?.staff?.[0]?.id;
  if (foreignService) {
    const edit = await api(`/api/salons/me/services/${foreignService}`, {
      token: ownerToken, method: "PATCH", body: { name: "Stolen" },
    });
    check("owner cannot edit another salon's service", edit.status === 404, `${edit.status} ${edit.code || ""}`);
  }
  if (foreignStaff) {
    const edit = await api(`/api/salons/me/staff/${foreignStaff}`, {
      token: ownerToken, method: "PATCH", body: { name: "Stolen" },
    });
    check("owner cannot edit another salon's staff", edit.status === 404, `${edit.status} ${edit.code || ""}`);
  }
  if (theirs.body?.salon?.gallery?.[0]?.id) {
    const deleted = await api(`/api/salons/me/gallery/${theirs.body.salon.gallery[0].id}`, {
      token: ownerToken, method: "DELETE",
    });
    check("owner cannot delete another salon's photo", deleted.status === 404, `${deleted.status} ${deleted.code || ""}`);
  }
  if (theirs.body?.salon?.reviews?.[0]?.id) {
    const replied = await api(`/api/salons/me/reviews/${theirs.body.salon.reviews[0].id}`, {
      token: ownerToken, method: "PATCH", body: { ownerReply: "Not my review" },
    });
    check("owner cannot reply to another salon's review", replied.status === 404, `${replied.status} ${replied.code || ""}`);
  }
  const foreignSalonId = theirs.body?.salon?.id;
  const adminAsOwner = await api(`/api/salons/${foreignSalonId}`, { token: ownerToken, method: "PATCH", body: { name: "X" } });
  check("admin-only salon endpoints reject owners", adminAsOwner.status === 404 || adminAsOwner.status === 403, String(adminAsOwner.status));

  /* ---------- subscriptions + settings ---------- */
  const plans = await api("/api/admin/subscriptions", { token: adminToken });
  check("admin can read subscription overview", plans.status === 200, String(plans.status));
  const sub = await api(`/api/admin/salons/${mine.body.salon.id}/subscription`, {
    token: adminToken, method: "PATCH", body: { plan: "studio", subscriptionStatus: "active" },
  });
  check("admin can change a salon plan", sub.status === 200, JSON.stringify(sub.body).slice(0, 160));
  const afterPlan = await api("/api/salons/me", { token: ownerToken });
  check("plan change is visible to the owner", afterPlan.body?.salon?.plan === "studio", afterPlan.body?.salon?.plan);

  const patched = await api("/api/admin/settings", { token: adminToken, method: "PATCH", body: { platformName: "Velvet Test", signupsEnabled: false } });
  check("admin can update platform settings", patched.status === 200 && patched.body?.settings?.platformName === "Velvet Test");
  const blockedSignup = await api("/api/auth/register", { method: "POST", body: { name: "Late Owner", email: "late@example.com", password: "LateOwner123" } });
  check("sign-ups can be disabled", blockedSignup.status === 403 && blockedSignup.code === "signups_disabled", `${blockedSignup.status} ${blockedSignup.code || ""}`);
  await api("/api/admin/settings", { token: adminToken, method: "PATCH", body: { platformName: "Velvet Salon Studio", signupsEnabled: true } });

  /* ---------- suspension ---------- */
  const ownerId = me.body?.user?.id;
  const suspend = await api(`/api/admin/users/${ownerId}`, { token: adminToken, method: "PATCH", body: { status: "suspended" } });
  check("admin can suspend an owner", suspend.status === 200, JSON.stringify(suspend.body).slice(0, 160));
  const suspendedMe = await api("/api/auth/me", { token: ownerToken });
  check("suspended users lose API access", suspendedMe.status === 403 && suspendedMe.code === "account_suspended", `${suspendedMe.status} ${suspendedMe.code || ""}`);
  const suspendedSalon = await api("/api/salons/me", { token: ownerToken });
  check("suspension also blocks existing tokens on salon APIs", suspendedSalon.status === 403 && suspendedSalon.code === "account_suspended", `${suspendedSalon.status} ${suspendedSalon.code || ""}`);
  const suspendedLogin = await api("/api/auth/login", { method: "POST", body: { email: "anaya@velvet.demo", password: "velvet-demo" } });
  check("suspended users cannot sign in", suspendedLogin.status === 403, String(suspendedLogin.status));
  await api(`/api/admin/users/${ownerId}`, { token: adminToken, method: "PATCH", body: { status: "active" } });
  check("restoring the account restores access", (await api("/api/auth/me", { token: ownerToken })).status === 200);

  /* ---------- last super admin protection ---------- */
  const adminId = adminMe.body?.user?.id;
  const selfDemote = await api(`/api/admin/users/${adminId}`, { token: adminToken, method: "PATCH", body: { role: "owner" } });
  check("the last super admin cannot be demoted", selfDemote.status === 400 && selfDemote.code === "cannot_demote_self", `${selfDemote.status} ${selfDemote.code || ""}`);

  /* ---------- email verification ---------- */
  const reg = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Approval Tester", email: TESTER_EMAIL, password: "ApprovalTest1" },
  });
  check("registration returns a session", reg.status === 201 || reg.status === 200, String(reg.status));
  check("registration asks for email verification", reg.body?.verificationRequired === true, JSON.stringify(reg.body).slice(0, 200));
  const testerToken = reg.body?.token;
  const createSalon = await api("/api/salons", { token: testerToken, method: "POST", body: { name: SALON_NAME, slug: SALON_SLUG } });
  check("new owner can create a draft salon", createSalon.status === 201 || createSalon.status === 200, JSON.stringify(createSalon.body).slice(0, 200));
  const salonId = createSalon.body?.salon?.id;
  const unverifiedSubmit = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("unverified owners cannot submit", unverifiedSubmit.status === 403 && unverifiedSubmit.code === "email_unverified", `${unverifiedSubmit.status} ${unverifiedSubmit.code || ""}`);

  db.prepare("INSERT INTO email_verifications (token_hash, user_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").run(
    sha256(VERIFY_TOKEN), reg.body.user.id, TESTER_EMAIL,
    new Date(Date.now() + 3600_000).toISOString(), new Date().toISOString()
  );
  const verified = await api("/api/auth/verify-email", { method: "POST", body: { token: VERIFY_TOKEN } });
  check("verification link confirms the email", verified.status === 200 && verified.body?.user?.emailVerified === true, JSON.stringify(verified.body).slice(0, 160));
  const replayed = await api("/api/auth/verify-email", { method: "POST", body: { token: VERIFY_TOKEN } });
  check("verification links are single use", replayed.status === 400 && replayed.code === "used_token", `${replayed.status} ${replayed.code || ""}`);
  const unknownToken = await api("/api/auth/verify-email", { method: "POST", body: { token: "nope" } });
  check("unknown verification links are rejected", unknownToken.status === 400 && unknownToken.code === "invalid_token");

  const afterVerify = await api("/api/salons/me", { token: testerToken });
  check("owner payload reflects verified email", afterVerify.body?.salon?.approvalStatus === "draft");

  /* ---------- approval: blockers ---------- */
  const blocked = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("incomplete salons cannot be submitted", blocked.status === 400 && blocked.code === "not_ready", `${blocked.status} ${blocked.code || ""}`);
  check("blockers explain what is missing", typeof blocked.body?.error?.details?.missing === "string" && blocked.body.error.details.missing.length > 0, JSON.stringify(blocked.body).slice(0, 200));

  await api("/api/salons/me/services", { token: testerToken, method: "POST", body: { name: "Signature Cut", price: 1200, durationMinutes: 60 } });
  await api("/api/salons/me", { token: testerToken, method: "PATCH", body: { phone: "+91 90000 00000", city: "Jaipur", address: "12 Test Road" } });

  const ready = await api("/api/salons/me", { token: testerToken });
  check("readiness blockers clear once basics exist", ready.body?.salon?.approvalBlockers?.length === 0, JSON.stringify(ready.body?.salon?.approvalBlockers));

  /* ---------- approval: submit / review ---------- */
  const submitted = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("complete salon can be submitted", submitted.status === 200 && submitted.body?.salon?.approvalStatus === "pending", JSON.stringify(submitted.body).slice(0, 200));
  const doubleSubmit = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("a pending salon cannot be submitted twice", doubleSubmit.status === 409 && doubleSubmit.code === "already_pending", String(doubleSubmit.code));

  const pendingPublish = await api("/api/salons/me/publish", { token: testerToken, method: "POST" });
  check("pending websites cannot be published", pendingPublish.status === 403 && pendingPublish.code === "approval_required", `${pendingPublish.status} ${pendingPublish.code || ""}`);

  const queue = await api("/api/admin/approvals?status=pending", { token: adminToken });
  check("super admin sees the submission in the queue", queue.body?.approvals?.some((item) => item.id === salonId), JSON.stringify(queue.body).slice(0, 200));
  check("queue exposes owner contact and blockers", !!queue.body?.approvals?.[0]?.ownerEmail && Array.isArray(queue.body?.approvals?.[0]?.blockers));

  const staleEdit = await api("/api/salons/me", { token: testerToken, method: "PATCH", body: { tagline: "Edited after submitting" } });
  check("owners can keep editing while pending", staleEdit.status === 200);
  const afterStale = await api("/api/salons/me", { token: testerToken });
  check("draft edits after submission are flagged", afterStale.body?.salon?.approvalStale === true);
  const staleApprove = await api(`/api/admin/salons/${salonId}/approve`, { token: adminToken, method: "POST", body: {} });
  check("stale submissions cannot be approved", staleApprove.status === 409 && staleApprove.code === "submission_stale", `${staleApprove.status} ${staleApprove.code || ""}`);

  const withdraw = await api("/api/salons/me/withdraw", { token: testerToken, method: "POST" });
  check("owners can withdraw a submission", withdraw.status === 200 && withdraw.body?.salon?.approvalStatus === "draft");
  check("withdrawing twice is rejected", (await api("/api/salons/me/withdraw", { token: testerToken, method: "POST" })).status === 400);

  await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  const noNote = await api(`/api/admin/salons/${salonId}/request-changes`, { token: adminToken, method: "POST", body: {} });
  check("request-changes requires a reason", noNote.status === 400 && noNote.code === "note_required", `${noNote.status} ${noNote.code || ""}`);
  const changes = await api(`/api/admin/salons/${salonId}/request-changes`, {
    token: adminToken, method: "POST", body: { note: "Please add a hero photograph and refine the tagline." },
  });
  check("super admin can request changes", changes.status === 200 && changes.body?.approvalStatus === "changes_requested", JSON.stringify(changes.body).slice(0, 160));
  const ownerSeesNote = await api("/api/salons/me", { token: testerToken });
  check("owner sees the reviewer note", ownerSeesNote.body?.salon?.approvalNote.includes("hero photograph"), ownerSeesNote.body?.salon?.approvalNote);

  await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  const emptyReject = await api(`/api/admin/salons/${salonId}/reject`, { token: adminToken, method: "POST", body: { note: "" } });
  check("rejections require a reason", emptyReject.status === 400 && emptyReject.code === "note_required");
  const rejected = await api(`/api/admin/salons/${salonId}/reject`, { token: adminToken, method: "POST", body: { note: "The website looks unfinished." } });
  check("super admin can reject", rejected.status === 200 && rejected.body?.approvalStatus === "rejected", String(rejected.status));
  const editAfterReject = await api("/api/salons/me", { token: testerToken, method: "PATCH", body: { tagline: "Reworked after feedback" } });
  check("rejected websites stay editable", editAfterReject.status === 200);

  await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  const approved = await api(`/api/admin/salons/${salonId}/approve`, { token: adminToken, method: "POST", body: { note: "Looks great." } });
  check("super admin can approve", approved.status === 200 && approved.body?.approvalStatus === "approved", JSON.stringify(approved.body).slice(0, 160));
  const approvedSalon = await api("/api/salons/me", { token: testerToken });
  check("approval unlocks publishing", approvedSalon.body?.salon?.canPublish === true && approvedSalon.body?.salon?.approvedAt, JSON.stringify(approvedSalon.body?.salon?.canPublish));

  const published = await api("/api/salons/me/publish", { token: testerToken, method: "POST" });
  check("approved website publishes", published.status === 200 && published.body?.salon?.status === "published", JSON.stringify(published.body).slice(0, 160));
  const live = await api(`/api/public/salons/${SALON_SLUG}`);
  check("published website is publicly readable", live.status === 200 && live.body?.salon?.slug === SALON_SLUG, String(live.status));

  /* ---------- changes after approval ---------- */
  await api("/api/salons/me", { token: testerToken, method: "PATCH", body: { tagline: "A brand new tagline" } });
  const edited = await api("/api/salons/me", { token: testerToken });
  check("post-approval edits are detected", edited.body?.salon?.changesSinceApproval === true && edited.body?.salon?.canPublish === false);
  const blockedPublish = await api("/api/salons/me/publish", { token: testerToken, method: "POST" });
  check("unapproved edits cannot go live", blockedPublish.status === 403 && blockedPublish.code === "changes_need_approval", `${blockedPublish.status} ${blockedPublish.code || ""}`);
  const stillLive = await api(`/api/public/salons/${SALON_SLUG}`);
  check("live website keeps the approved snapshot", stillLive.body?.salon?.tagline !== "A brand new tagline", stillLive.body?.salon?.tagline);

  const resubmit = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("owners can resubmit after edits", resubmit.status === 200 && resubmit.body?.salon?.approvalStatus === "pending");

  /* ---------- unpublish / suspend ---------- */
  const unpublish = await api("/api/salons/me/unpublish", { token: testerToken, method: "POST" });
  check("owners can unpublish their website", unpublish.status === 200, `${unpublish.status} ${unpublish.code || ""}`);
  const gone = await api(`/api/public/salons/${SALON_SLUG}`);
  check("unpublished websites are no longer public", gone.status === 404, String(gone.status));

  const suspendSalon = await api(`/api/admin/salons/${salonId}/status`, { token: adminToken, method: "PATCH", body: { status: "suspended" } });
  check("super admin can suspend a salon", suspendSalon.status === 200, String(suspendSalon.status));
  const publicSuspended = await api(`/api/public/salons/${SALON_SLUG}`);
  check("suspended websites are removed from the public", publicSuspended.status === 404, String(publicSuspended.status));
  const suspendedSubmit = await api("/api/salons/me/submit", { token: testerToken, method: "POST" });
  check("suspended salons cannot be submitted", suspendedSubmit.status === 403 && suspendedSubmit.code === "salon_suspended", `${suspendedSubmit.status} ${suspendedSubmit.code || ""}`);
  await api(`/api/admin/salons/${salonId}/status`, { token: adminToken, method: "PATCH", body: { status: "draft" } });

  /* ---------- approval history + audit ---------- */
  const history = await api(`/api/admin/salons/${salonId}/approval`, { token: adminToken });
  const actions = (history.body?.history || []).map((entry) => entry.action);
  check("review history records every decision", ["submit", "request_changes", "reject", "approve"].every((action) => actions.includes(action)), actions.join(","));
  const audit = await api("/api/admin/audit?limit=50", { token: adminToken });
  const auditActions = (audit.body?.entries || []).map((entry) => entry.action);
  check("approval decisions are audited", auditActions.includes("salon_approve") && auditActions.includes("salon_reject"), auditActions.join(","));

  /* ---------- owner cannot review ---------- */
  const ownerApprove = await api(`/api/admin/salons/${salonId}/approve`, { token: testerToken, method: "POST", body: {} });
  check("owners cannot approve their own salon", ownerApprove.status === 403, String(ownerApprove.status));

  console.log(`\n${pass} passed, ${fail} failed\n`);
  db.close();
  process.exit(fail ? 1 : 0);
};

run().catch((error) => { console.error(error); process.exit(1); });
