/**
 * Minimal Google OAuth stand-in for local end-to-end tests.
 *
 *   node scripts/fake-google.mjs 4100
 *   GOOGLE_OAUTH_BASE=http://127.0.0.1:4100 npm run dev
 *
 * The profile returned by /userinfo is read from /tmp/fake-google-profile.json
 * on every request so tests can switch identities without restarting. Tests can
 * also POST a JSON profile to /__profile to update that file.
 */
import http from "http";
import fs from "fs";

const port = Number(process.argv[2] || 4100);
const PROFILE_FILE = process.env.FAKE_GOOGLE_PROFILE || "/tmp/fake-google-profile.json";

function profile() {
  try {
    return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf8"));
  } catch {
    return {
      sub: "google-test-1",
      email: "google.owner@example.com",
      email_verified: true,
      name: "Google Owner",
      picture: "https://example.com/avatar.png",
    };
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname === "/__profile" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const next = { ...profile(), ...JSON.parse(body || "{}") };
        fs.writeFileSync(PROFILE_FILE, JSON.stringify(next, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, profile: next }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_profile" }));
      }
    });
    return;
  }

  if (url.pathname === "/o/oauth2/v2/auth") {
    const redirect = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    const target = new URL(redirect);
    target.searchParams.set("code", "fake-auth-code");
    target.searchParams.set("state", state);
    res.writeHead(302, { Location: target.toString() });
    return res.end();
  }

  if (url.pathname === "/token" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ access_token: "fake-access-token", token_type: "Bearer", expires_in: 3600 }));
    });
    return;
  }

  if (url.pathname === "/userinfo") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(profile()));
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(port, "127.0.0.1", () => console.log(`fake google on :${port}`));
