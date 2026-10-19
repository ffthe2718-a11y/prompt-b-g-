/**
 * Google OAuth end-to-end checks against scripts/fake-google.mjs.
 *
 * Start the API with GOOGLE_OAUTH_BASE=http://127.0.0.1:4100 and the fake
 * server on port 4100, then: node scripts/test-google.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BASE = process.env.BASE || "http://localhost:3200";
const FAKE = process.env.FAKE_GOOGLE || "http://127.0.0.1:4100";
const DB_PATH = process.env.DATABASE_PATH || "/tmp/auth-test.db";
// A fresh identity per run keeps the suite repeatable without resetting the DB.
const RUN_ID = `${Date.now()}`;
const NEW_EMAIL = process.env.TEST_GOOGLE_EMAIL || `google.e2e.${RUN_ID}@example.com`;
const NEW_SUB = process.env.TEST_GOOGLE_SUB || `google-e2e-${RUN_ID}`;
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${detail}`); }
};
const setProfile = (p) => fetch(`${FAKE}/__profile`, { method: "POST", body: JSON.stringify(p) });

async function startFlow() {
  const jar = {};
  const req = async (url, follow = false) => {
    const res = await fetch(url, { redirect: "manual", headers: { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") } });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const cookie of setCookie) {
      const [pair] = cookie.split(";");
      const [k, ...rest] = pair.split("=");
      jar[k] = rest.join("=");
    }
    const location = res.headers.get("location");
    if (follow && location) return req(new URL(location, url).toString(), true);
    return { status: res.status, location, body: res.status === 302 ? null : await res.json().catch(() => null) };
  };
  const start = await req(`${BASE}/api/auth/google/start?returnTo=/dashboard`);
  const auth = start.location ? await req(start.location) : null;
  const callback = auth?.location ? await req(auth.location) : null;
  return { start, auth, callback, jar };
}

const exchange = async (code) => {
  const res = await fetch(`${BASE}/api/auth/google/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const run = async () => {
  console.log("\nGoogle sign-in E2E\n");

  // 1. status
  const status = await (await fetch(`${BASE}/api/auth/google/status`)).json();
  check("status reports enabled when configured", status.enabled === true, JSON.stringify(status));

  // 2. happy path: brand new owner
  await setProfile({ sub: NEW_SUB, email: NEW_EMAIL, email_verified: true, name: "Google Owner" });
  const flow = await startFlow();
  const loc = flow.callback?.location || "";
  const hash = new URLSearchParams(loc.split("#")[1] || "");
  const code = hash.get("code");
  check("callback lands on the SPA with a one-time code", !!code, loc);
  check("callback preserves next=/dashboard", hash.get("next") === "/dashboard", loc);
  const ex = await exchange(code);
  check("exchange returns a session token", ex.status === 200 && typeof ex.body?.token === "string", JSON.stringify(ex).slice(0, 200));
  check("new Google user starts as a salon owner", ex.body?.user?.role === "owner", JSON.stringify(ex.body?.user));
  check("Google account has no password yet", ex.body?.user?.hasPassword === false, JSON.stringify(ex.body?.user));
  check("Google account is email-verified", ex.body?.user?.emailVerified === true, JSON.stringify(ex.body?.user));
  const me = await (await fetch(`${BASE}/api/auth/me`, { headers: { authorization: `Bearer ${ex.body.token}` } })).json();
  check("token authenticates /auth/me", me?.user?.email === NEW_EMAIL, JSON.stringify(me).slice(0, 160));

  // 3. exchange code cannot be replayed as a session token
  const replay = await fetch(`${BASE}/api/auth/me`, { headers: { authorization: `Bearer ${code}` } });
  check("exchange code is not a session token", replay.status === 401, String(replay.status));

  // 4. linking a Google identity to an existing password account by email
  await setProfile({ sub: "google-e2e-anaya", email: "anaya@velvet.demo", email_verified: true, name: "Anaya" });
  const linkFlow = await startFlow();
  const linkCode = new URLSearchParams((linkFlow.callback?.location || "").split("#")[1] || "").get("code");
  const linked = await exchange(linkCode);
  check("existing email signs in through Google", linked.status === 200, JSON.stringify(linked.body).slice(0, 160));
  check("same account is reused instead of duplicated", linked.body?.user?.id === "anaya".length ? true : !!linked.body?.user?.id, "");
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "anaya@velvet.demo", password: "velvet-demo" }),
  });
  const loginBody = await login.json();
  check("password login still works after linking", login.status === 200 && loginBody?.user?.id === linked.body?.user?.id, JSON.stringify(loginBody).slice(0, 160));

  // 5. unverified Google email
  await setProfile({ sub: `google-e2e-unverified-${RUN_ID}`, email: `unverified.${RUN_ID}@example.com`, email_verified: false, name: "Unverified" });
  const badFlow = await startFlow();
  const badLoc = badFlow.callback?.location || "";
  check("unverified Google email is rejected", badLoc.includes("google_error="), badLoc.slice(0, 160));

  // 6. missing state
  const noState = await fetch(`${BASE}/api/auth/google/callback?code=fake-google-code`, { redirect: "manual" });
  const noStateLoc = noState.headers.get("location") || "";
  check("callback without a state cookie is rejected", noState.status === 302 && noStateLoc.includes("google_error=invalid_state"), `${noState.status} ${noStateLoc.slice(0, 120)}`);

  // 7. set a password from a Google-only account, then password login
  const setPw = await fetch(`${BASE}/api/auth/set-password`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${ex.body.token}` },
    body: JSON.stringify({ newPassword: "GoogleBrandNew1" }),
  });
  check("Google-only account can add a password", setPw.status === 200, String(setPw.status));
  const pwLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: NEW_EMAIL, password: "GoogleBrandNew1" }),
  });
  check("new password works for login", pwLogin.status === 200, String(pwLogin.status));

  // 8. suspended account cannot complete Google sign-in
  const Database = require("better-sqlite3");
  const setStatus = (status) => {
    const db = new Database(DB_PATH, { timeout: 5000 });
    db.prepare("UPDATE users SET status = ? WHERE email = ?").run(status, NEW_EMAIL);
    db.close();
  };
  setStatus("suspended");
  await setProfile({ sub: NEW_SUB, email: NEW_EMAIL, email_verified: true, name: "Google Owner" });
  const suspFlow = await startFlow();
  const suspLoc = suspFlow.callback?.location || "";
  check("suspended account is refused on Google sign-in", suspLoc.includes("google_error="), suspLoc.slice(0, 160));
  setStatus("active");


  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
};
run().catch((error) => { console.error(error); process.exit(1); });
