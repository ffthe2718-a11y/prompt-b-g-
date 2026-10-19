# Velvet Salon Studio

A white-label salon website builder. Every owner signs up, builds their salon, previews it privately and publishes a personalised website at a unique live address — with their own logo, colours, services, prices, team, gallery, contact details and copy.

Nothing is shared between salons: each owner has exactly one salon record, and every service, staff profile, gallery image, booking and review is scoped to that salon and checked on the server for every request.

---

## What's inside

**Public platform & accounts**
- Marketing home, pricing and a live directory of published salon sites
- **Email + password** and **Google Sign-In** accounts (JWT sessions, bcrypt hashing, rate limiting)
- **Email verification** with single-use, 24-hour links (required before a website can be submitted for review)
- Three roles — **Super Admin**, **Salon Owner** and **Public Visitor** — with server-enforced permissions
- Password reset by email (single-use, one-hour tokens)
- Visitors browse every published salon website without an account

**Owner onboarding & dashboard**
- A four-step guided setup with a live preview, draft saving and a launch checklist
- **Website editor** — brand copy, hero/about images, templates, colours, contact details, opening hours, booking rules, section order and visibility, SEO, custom domain
- **Services** — full CRUD, categories, durations, prices, visibility, ordering
- **Team** — profiles, photos, specialties, experience, availability, ordering
- **Gallery** — uploads, captions, ordering
- **Bookings** — filters, search, date range, status transitions, CSV export
- **Reviews** — moderation, owner replies, star summary
- **Analytics** — page views, 14-day bookings, revenue, popular services, rating distribution
- **Settings** — account, password, public address, plan, publish/unpublish

**Every salon website**
- Fully responsive, theme-aware design (Luxury, Blush, Noir, Emerald) with per-salon colours
- Hero, about, services, team, gallery (with lightbox), reviews, booking and contact sections
- Real-time availability that respects opening hours, existing bookings, staff capacity, notice periods and booking windows
- WhatsApp, call, map and social links
- SEO title/description plus structured data (`HairSalon`) injected on the server for published sites

**Super admin console**
- **Overview** — accounts, salons, live sites, plan mix, MRR, pending approvals, bookings and an audit trail
- **Approvals** — a review queue with the owner's preview, completeness checks, submission history and one-click approve / request changes / reject
- **Salons** — search/filter every website; approve, publish, unpublish, suspend, restore or delete any salon, with custom domains shown
- **Users** — every account, its Google/email provider, salon, last sign-in; promote to super admin, suspend, reactivate or delete
- **Subscriptions** — plan catalog, MRR, and per-salon plan/status changes
- **Settings** — platform name, support email, announcement, sign-up and directory switches, default plan

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 4, Motion, React Router 7 |
| Backend | Express 4, TypeScript (run with `tsx`) |
| Database | SQLite via `better-sqlite3` (WAL), schema created automatically |
| Auth | JWT + bcryptjs, Google OAuth 2.0, per-IP rate limiting |
| Uploads | Multer → `data/uploads`, served from `/uploads` (path-traversal safe) |
| Email | Nodemailer (SMTP); booking and reset emails fall back to console logs |
| Scheduling | `node-cron` daily appointment reminders |

No external services are required to run the platform. SMTP is optional.

---

## Quick start

```bash
npm install
cp .env.example .env       # optional for local development
npm run dev                # http://localhost:3000
```

The database and uploads directory are created on first boot.

### Demo content (optional)

> Demo accounts use a published password. Only run this on a local or disposable environment.

The app starts completely empty — real owners always begin with a blank salon. To explore the product with two fully populated demo salons:

```bash
npm run seed
```

```
anaya@velvet.demo   /  velvet-demo   →  http://localhost:3000/house-of-lumen
naina@velvet.demo   /  velvet-demo   →  http://localhost:3000/ochre-and-ink
admin@velvet.demo   /  velvet-demo   →  http://localhost:3000/admin  (super admin, no salon)
```

The seeder is idempotent: running it again recreates the three demo accounts and leaves other data untouched. It never runs automatically, and it refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`. Never keep these credentials in a real deployment.

---

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` / `HOST` | Server binding (default `3000` / `0.0.0.0`) |
| `NODE_ENV` | `production` serves the built `dist/` with server-side SEO injection |
| `DATABASE_PATH` | SQLite file location (default `./data/salon-studio.db`) |
| `JWT_SECRET` | Signing secret. **Set this in production.** Without it a secret is generated and persisted to `data/.jwt-secret` — fine locally, not for a real deployment |
| `ADMIN_EMAILS` | Comma-separated emails auto-promoted to **super admin after Google verifies the address**. Empty leaves `/admin` closed until an account is promoted with `npm run make-admin` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 web client. When unset, the Google button is disabled and email + password keeps working |
| `GOOGLE_REDIRECT_URI` | Optional explicit redirect URI. Defaults to `<PUBLIC_SITE_ORIGIN>/api/auth/google/callback` |
| `SUPPORT_EMAIL` | Default support address until a super admin edits it in Settings |
| `PUBLIC_SITE_ORIGIN` | Canonical origin used in share links, reset emails, sitemap and metadata, e.g. `https://velvetstudio.com` |
| `PUBLIC_BASE_DOMAIN` | Optional wildcard domain; `<slug>.yourdomain.com` then serves each salon automatically |
| `PLATFORM_NAME` | Display name used in emails and platform config |
| `MAX_UPLOAD_MB` | Upload limit per image (default `6`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outbound email. Without these, emails are logged to the console |
| `APP_URL` | Fallback origin for password-reset links when `PUBLIC_SITE_ORIGIN` is unset |

---

## Authentication & roles

| Role | Who | Can do | Cannot do |
| --- | --- | --- | --- |
| **Super Admin** (`super_admin`) | Platform staff, bootstrapped via `ADMIN_EMAILS` or promoted in **Admin → Users** | See and manage **all** users, salons, plans, subscriptions, published websites and platform settings; read the audit log | Edit a salon's content through the owner API (they use the admin console), and cannot demote, suspend or delete their own account. The platform always keeps one active super admin |
| **Salon Owner** (`owner`) | Anyone who registers or signs in with Google | Create **one** salon; edit its website, services, prices, staff, gallery, address and contact details; preview, publish, unpublish and manage bookings/reviews | See or modify any other salon. Every `/api/salons/me/*` route resolves the salon from the JWT user id and child rows are re-checked with `assertOwnedResource` (cross-salon ids return `404 not_found`) |
| **Public Visitor** | Anonymous | Browse published salon websites and the directory, view details/services/prices/staff, request bookings, leave reviews | Reach `/dashboard`, `/admin`, or any private draft. Drafts, unpublished sites and suspended salons return 404 publicly |

### Sign-in options

- **Email + password** — bcrypt (cost 12), 8–128 character passwords, rate-limited.
- **Google** — OAuth 2.0 authorization-code flow handled entirely server-side:
  1. `/api/auth/google/start` signs a short-lived `state` JWT and sets an httpOnly, SameSite=Lax nonce cookie (login-CSRF protection), then redirects to Google.
  2. `/api/auth/google/callback` verifies the state + cookie, exchanges the code, and reads the verified profile from Google's userinfo endpoint.
  3. Accounts are matched by `google_id`, then by **verified** email (linking Google to an existing password account rather than duplicating it). New emails create an owner account.
  4. The browser receives a **2-minute, single-use exchange code in the URL fragment**; the SPA trades it at `/api/auth/google/exchange` for a normal session token. Session tokens never appear in a URL.
- Google-only accounts have no usable password (`password_set = 0`); they can add one in **Dashboard → Settings → Set a password**.
- Suspended accounts are rejected on every request (`account_suspended`) and cannot sign in with either method.
- `ADMIN_EMAILS` promotes matching accounts to `super_admin` only when the address is **verified** (Google sign-in). Password sign-ups are never auto-promoted, because anyone could type an admin address at registration.

### Try it locally without real Google credentials

`scripts/fake-google.mjs` is a loopback-only stand-in for Google's OAuth endpoints, and `scripts/test-auth.mjs`
exercises the whole flow plus RBAC and tenant isolation (59 assertions):

```bash
npm run seed                       # creates the demo accounts, incl. admin@velvet.demo
node scripts/fake-google.mjs 4100 &
# Run against a disposable copy of the database.
cp data/salon-studio.db /tmp/auth-test.db
DATABASE_PATH=/tmp/auth-test.db PORT=3200 PUBLIC_SITE_ORIGIN=http://localhost:3200 \
  GOOGLE_CLIENT_ID=test-client GOOGLE_CLIENT_SECRET=test-secret \
  GOOGLE_OAUTH_BASE=http://127.0.0.1:4100 ADMIN_EMAILS=admin2@velvet.demo npx tsx server.ts &
BASE=http://localhost:3200 node scripts/test-auth.mjs
```

The suite covers 59 assertions: Google sign-up/linking/hand-off, rejected OAuth attempts, safe super-admin promotion,
every admin endpoint, suspension, cross-salon access to services/staff/gallery/reviews/bookings, plans, settings and the
audit trail. It mutates the database, so point it at a throwaway copy.

The approval workflow has its own suite (`scripts/test-approval.mjs`, 78 assertions) covering the full state matrix:
blockers, email-verification gating, stale submissions, withdraw, reject/request-changes notes, approval → publish,
post-approval edits, public snapshot immutability, unpublish, suspension and the audit trail. A third script
(`scripts/test-google.mjs`, 17 assertions) drives the OAuth flow end to end against the fake Google server.
The audit suite (`scripts/test-audit.mjs`, 66 assertions) covers the health probe, draft/unknown-tenant 404s, the
capacity/duration grid, double-booking and reassignment conflicts, owner isolation, and the owner tools
(subscribers, reminders, booking deletion):

```bash
cp data/salon-studio.db /tmp/audit.db
DATABASE_PATH=/tmp/audit.db PORT=3200 PUBLIC_SITE_ORIGIN=http://localhost:3200 npx tsx server.ts &
BASE=http://localhost:3200 node scripts/test-audit.mjs
```

Both extra suites read the database directly to simulate suspension and insert a known verification token, so pass the same
throwaway `DATABASE_PATH`. Restart the API between full runs: sign-in rate limits are held in memory.

The `GOOGLE_OAUTH_BASE` override only accepts loopback hosts and is ignored when `NODE_ENV=production`.

### Google Cloud setup

1. Create an **OAuth consent screen** (External is fine; add test users while unverified).
2. Create an **OAuth 2.0 Client ID → Web application**.
3. Add the authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
   (and `http://localhost:3000/api/auth/google/callback` for local development).
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then restart. The button appears automatically once configured.

### Bootstrap the first super admin

- **With Google configured (recommended):** add your address to `ADMIN_EMAILS`, restart, then sign in with Google. Google
  verifies the address, so the account is promoted on first sign-in. Requiring a verified address is deliberate —
  self-service promotion from a password sign-up would let anyone claim the operator's email before they register.
- **Password only:** register normally, then promote yourself from the server console:

  ```bash
  npm run make-admin -- you@example.com          # grant super admin
  npm run make-admin -- you@example.com --revoke # back to salon owner
  ```

- **Demo data:** `npm run seed` creates `admin@velvet.demo` (`velvet-demo`) as a super admin with no salon.

Afterwards you can promote or demote anyone from **Admin → Users**. The platform always keeps at least one active
super admin alive.

---

## Approval workflow

Nothing reaches the public without a super admin's approval.

```
Registered → Onboarding → Draft → Pending approval → Approved → Published
                                      │                 │
                                      ├→ Rejected ──────┤ (editable, resubmit)
                                      └→ Changes requested
```

| Status | Owner can | Public can see |
| --- | --- | --- |
| `draft` | Edit, preview, submit | Nothing |
| `pending` | Edit drafts (flagged stale), withdraw | Nothing |
| `approved` | Publish, unpublish, edit | The site once published |
| `rejected` / `changes_requested` | Edit and resubmit, read the reviewer note | Nothing |
| suspended (by an admin) | Read-only; cannot submit or publish | Nothing (404) |

- **Submit for approval** (`POST /api/salons/me/submit`) requires a verified email, an unsuspended salon, a name, at least one active service and a contact method/address. Missing items come back as a readable checklist (`not_ready`).
- **Approval pins content** — `approved_hash` is a SHA-256 of everything a visitor can see (copy, images, colours, hours, services, staff, gallery). Owners can keep editing after approval, but the live site keeps the approved snapshot and publishing is refused (`changes_need_approval`) until the new version is approved.
- **Pending edits are stale** — if the draft changes while a submission is waiting, the submission is marked stale and an admin cannot approve it (`submission_stale`); the owner withdraws or resubmits.
- **Reviewer notes** are required for reject and request-changes, stored in `salon_reviews`, emailed to the owner and shown in their dashboard.
- **Publish** (`POST /api/salons/me/publish`) re-checks `approval_status = 'approved'` and `approved_hash = current content` server-side, then snapshots the public bundle into `published_json`. Only `published` + `approved` salons are served publicly.
- **Unpublish** (`POST /api/salons/me/unpublish`) hides the site immediately; a super admin can do the same from the console (`POST /api/admin/salons/:id/unpublish`).
- **Suspend** blocks the public site, submissions and publishing for that salon.
- Salons published before this workflow existed are backfilled as approved at boot, so upgrading never takes a live site offline.

### Publishing details

- The live site and directory read the snapshot, so visitors never see half-finished edits.
- Reviews are always live; the dashboard flags `hasUnpublishedChanges` when the draft is newer than the snapshot.
- Suspended salons are blocked at both the public API and the admin level.

### Notifications & owner tools

- **Guests hear back.** A booking request emails the salon, then every status change emails the client: `confirmed`, `cancelled`, `completed` (`sendBookingStatusEmail`). A daily cron sends tomorrow's reminders, and owners can send one immediately from **Bookings → Send reminder** (`POST /api/salons/me/bookings/:id/reminder`).
- **Website decisions reach the owner.** Submit, approve, reject, request-changes, admin unpublish and suspension all send email (falling back to a server log when SMTP is unset); reject/request-changes notes are included.
- **Newsletter list is usable.** Footer sign-ups land in `subscribers`; the owner's **Analytics** tab lists them with Copy and **Export CSV** (`GET /api/salons/me/subscribers`).
- **Admins can unlock accounts.** **Admin → Users → key icon** emails a single-use reset link (`POST /api/admin/users/:id/reset-password`); the password itself is never generated or shown.
- **Platform settings are public.** `platformName`, `supportEmail`, the announcement strip and the signups switch are read from `/api/public/config` and reflected on the marketing site, footer and sign-up screen.
- **Unverified owners are nagged, not blocked silently.** A banner in the wizard and dashboard resends the verification link; submit/publish stay blocked until the address is confirmed.

### Booking integrity

- **One grid, two callers.** `computeAvailability` builds the slot list for `GET /api/public/salons/:slug/availability` and is re-run *inside* the booking transaction (`BEGIN IMMEDIATE`), so a stale browser can never double-book.
- **Duration-aware.** A booking reserves its full service window, not just its start minute: a 3-hour colour hides every 30-minute slot underneath it. Slots also stop at `close − duration`.
- **Real capacity.** With N active team members the salon can host N simultaneous appointments. Requests booked without a staff preference still consume one seat. Picking a specific member only clears when *that* member is free and a seat remains.
- **Conflicts are 409s.** A taken slot returns `409 slot_unavailable`; the public form refreshes the grid and asks the guest to pick again. Reassigning a booking onto a busy member (or restoring a cancelled one onto a rebooked slot) is refused the same way.
- **Database backstop.** `idx_bookings_staff_slot` is a partial unique index on `(salon_id, date, time, staff_id)` for live bookings. Any regression that slips past the application check surfaces as `409 conflict`, never a 500.
- **Errors are not “closed”.** If the availability request fails (offline, 5xx, rate limit) the public form shows the reason plus **Try again** instead of pretending the salon is shut.

### Live addresses

| Mode | Example | Setup |
| --- | --- | --- |
| Path | `https://yourdomain.com/house-of-lumen` | Works out of the box |
| Subdomain | `https://house-of-lumen.yourdomain.com` | Set `PUBLIC_BASE_DOMAIN` and add a wildcard DNS record |
| Custom domain | `https://www.houseoflumen.com` | Owner adds a domain in **Website → Visibility**; the platform returns a TXT verification record and CNAME target. Once verified (`_velvet.<domain>` TXT), the Host header routes to that salon |

---

## Production deployment

```bash
npm ci
npm run build              # outputs dist/
NODE_ENV=production npm start
```

1. **Set `JWT_SECRET`** to a long random value and `PUBLIC_SITE_ORIGIN` to your canonical HTTPS origin.
2. **Persist `data/`** on a volume. It contains the SQLite database and uploaded images.
3. **Terminate TLS** at your proxy/load balancer and forward `Host` unchanged (custom-domain routing depends on it).
4. Put the process behind a supervisor (systemd, Docker, Fly/Render/Railway) and send `SIGTERM` for graceful shutdown.
5. Back up `data/salon-studio.db` (use `sqlite3 .backup` or copy while WAL is checkpointed) and `data/uploads/`.

Health check: `GET /api/health` runs a real `SELECT 1` against SQLite and reports `{ status, database, publishedSalons, uptimeSeconds }`; it returns `503` if the database is unreachable.

For subdomain or custom-domain traffic, point DNS at the same service and make sure your proxy passes the original `Host` header. Wildcard TLS is required for subdomains.

Unknown tenants are real 404s in production: a slug or subdomain that is not `published` **and** `approved` returns the SPA shell with `404` and `X-Robots-Tag: noindex`, missing assets return a plain-text 404, and `/dashboard`/`/admin` pages are served with `noindex`. `sitemap.xml` lists only live, approved salons.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server with Vite middleware and HMR |
| `npm run build` | Production client build into `dist/` |
| `npm start` | Run the server (`NODE_ENV=production` to serve `dist/`) |
| `npm run seed` | Create the two demo salons (optional, destructive for those accounts only) |
| `npm run typecheck` / `npm run lint` | Strict TypeScript check |
| `npm run clean` | Remove `dist/` |
| `node scripts/test-auth.mjs` | End-to-end auth/RBAC/isolation suite (59 assertions; see the local Google section) |
| `node scripts/test-approval.mjs` | Approval workflow matrix (78 assertions; pass the same `DATABASE_PATH`) |
| `node scripts/test-google.mjs` | Google OAuth flow against the fake IdP (17 assertions) |
| `node scripts/test-audit.mjs` | Health, tenant 404s, booking capacity/conflicts and owner isolation (66 assertions) |
| `node scripts/fake-google.mjs 4100` | Loopback-only Google OAuth stand-in for local testing |

---

## Project structure

```
server.ts                Express entry: API mounts, host routing, SEO injection, cron, shutdown
server/db.ts             SQLite schema, migrations-by-addition, helpers
server/auth.ts           JWT, bcrypt, rate limiting, RBAC and ownership checks
server/google.ts         Google OAuth 2.0 flow, account linking, handoff codes
server/settings.ts       Platform settings, plans and audit trail
server/validation.ts     Text/URL/date/time validators, defaults, slug rules
server/serializers.ts    Public, published-snapshot, private and directory payloads
server/emails.ts         Booking, reminder and password-reset templates
server/routes/           auth · salons · public · uploads · admin
scripts/seed.ts          Optional demo data
src/pages/               Platform pages, onboarding, public salon, Google callback, owner dashboard
src/pages/admin/         Super admin tabs: overview, salons, users, subscriptions, settings
src/pages/owner/         Overview, website editor, services, team, gallery, bookings, reviews, analytics, settings
src/components/site/     Public salon renderer (theme, chrome, booking, reviews)
src/components/dashboard/ui.tsx  Dashboard design primitives
src/lib/api.ts           Typed API client
src/types/salon.ts       Shared domain types and formatters
```

---

## Data isolation & security

- **RBAC on the server, not just the UI**: `requireAuth` → `requireAdmin` (`super_admin` only) / `requireSalonOwner`, enforced on every API route. The `/admin` UI is only a shell around those endpoints.
- Every dashboard route resolves the caller's salon from their JWT user id; child rows are verified with `assertOwnedResource` before read/write, so guessing another salon's id returns 404 rather than leaking data.
- OAuth state is HMAC-signed, expires in 10 minutes, is bound to an httpOnly cookie, and the SPA handoff uses a 2-minute signed code in the fragment — no session token in URLs or logs.
- Suspended accounts are blocked at `requireAuth` time, so existing tokens stop working immediately.
- Privileged actions (role changes, suspensions, deletions, plan changes, settings updates, Google sign-ins) are written to `admin_audit` and shown in the admin Overview.
- One salon per owner is enforced by a `UNIQUE` constraint on `salons.owner_id`.
- Uploads are namespaced per salon, extension-checked, size-limited and served with `X-Content-Type-Options: nosniff`.
- Public endpoints are rate limited; login and password reset have stricter limits.
- Password reset responses are identical whether or not an account exists.
- Reviews and bookings are validated server-side (rating range, slot availability, capacity, required contact fields).
- `robots.txt` disallows `/dashboard`, `/admin` and `/api/`.

---

## Roadmap / deliberate limits

- Plans, subscriptions and MRR are tracked and editable by super admins, but no payment gateway is connected — nobody is charged automatically.
- SMS notifications are not sent — email (or console logging when SMTP is unconfigured) only.
- SQLite is a single-node datastore. For multi-instance deployments, migrate the data layer to Postgres; the serializers isolate most of the SQL.
- Booking times are stored as salon-local wall-clock times; the reminder cron resolves "tomorrow" per salon timezone but runs on the server's 09:00 schedule.
