# End-to-end audit — 19 October 2026

**Scope note.** The brief that triggered this round named `templateapp67-oss/fanal-templetes-app`, a different
Vite + Supabase application. Per the decision taken in this session, the same checklist was applied to **this**
repository (Velvet Salon Studio: React + Vite + Express + SQLite) and mapped onto its actual stack. Items that only
exist in the other codebase are called out as *not applicable* rather than being faked here.

## Checklist

| Area | Result | Evidence |
| --- | --- | --- |
| Routing, subdomains, white-label URLs | **Fixed**: unknown slugs, subdomains and deep paths return real 404s in production | `server.ts` `findPublicSalon` / `sendShell`, manual prod probes below |
| Booking modal, slot generation, state validation | **Fixed**: duration-aware grid, per-staff capacity, server re-check in a `BEGIN IMMEDIATE` transaction | `server/routes/public.ts`, `scripts/test-audit.mjs` §3–4 |
| Retry & informative availability errors | **Fixed**: transport failures are distinct from "closed" and offer **Try again**; stale selections are dropped and re-checked | `src/components/site/BookingSection.tsx` |
| Buttons, toggles, interactive components | **Verified**: every client API method has a caller, no buttons without handlers; switches rely on Base UI's `role="switch"` / `aria-checked` and now all have accessible names | scan + `src/pages/owner/*`, `src/pages/admin/SalonsTab.tsx` |
| DB/security — RLS equivalent | **Verified**: FKs + CHECKs + `UNIQUE` constraints, per-owner scoping via `assertOwnedResource`, proven by cross-tenant tests | `server/db.ts`, `server/auth.ts:131`, audit §5 |
| Orphaned/dead AI or backend endpoints | **None exist** — the app has no AI routes. One admin endpoint was UI-orphaned and is now wired; all client methods have callers | `salonApproval` → `SalonsTab` history panel |
| TypeScript / build / regressions | **Clean** — `tsc --noEmit`, `vite build`, four API suites and four jsdom journeys | results below |

## Findings and fixes

### 1. Availability could double-book a team member (high)

`computeAvailability` compared a count of *all* live bookings against the number of active staff while only filtering
by staff when a member was explicitly chosen. With two team members, one booking for A still left the time
"available", and the same formula was used for the in-transaction re-check — so two guests could take the same
appointment with the same person.

**Fix:** the grid is now derived per slot from occupied **intervals**:

- each booking reserves `[start, start + service duration)`, so a 3-hour colour blocks every 30-minute start beneath it;
- a named staff member is available only when that member is free **and** capacity remains after unassigned requests;
- unassigned requests consume a seat but do not pin a person;
- the same function is re-run inside `BEGIN IMMEDIATE`, and a partial unique index
  (`idx_bookings_staff_slot`) is the database backstop. Constraint violations map to `409 conflict`, never `500`.

Malformed opening hours (`NaN`) and services longer than the opening window now return an explicit closed reason
instead of an empty or endless loop.

### 2. A failed availability call looked like "closed" (medium)

`BookingSection` caught every error and rendered `{closed: true, reason: err.message}` with no way to retry. A flaky
network therefore told guests the salon was shut.

**Fix:** separate `slotsError` state with the reason and a **Try again** button; selected times that disappear from a
refreshed grid are cleared; `slot_unavailable` on submit refreshes the grid immediately. Preview mode now mirrors the
live grid (full duration must fit, same guard against malformed hours).

### 3. Production answered 200 for unknown tenants (medium)

`app.get("/:slug")` served the salon shell for *any* single segment without checking the database, and `app.get("*")`
answered deep unknown paths with 200. On Vercel-style production that means unknown subdomains/slugs are indexable
soft-404s.

**Fix:** a tenant is served only when `status = 'published' AND approval_status = 'approved'`. Unknown slugs,
subdomains and deep paths return the SPA shell with HTTP **404** and `X-Robots-Tag: noindex`; missing assets return a
plain-text 404. `/dashboard` and `/admin` are `noindex`, `sitemap.xml` lists only live approved salons, and the
custom-domain lookup uses the same gate.

### 4. Booking reassignment could create a conflict (medium)

`PATCH /api/salons/me/bookings/:id` allowed changing the assigned staff member or restoring a cancelled booking
without checking the target window.

**Fix:** `assertBookingSlotFree` rejects overlapping assignments and restores with `409 slot_unavailable`.

### 5. Accessibility of switches (low)

Base UI already emits `role="switch"` and `aria-checked`, but four switches had no accessible name. Added
`aria-label`s for the booking toggle, section visibility, service "bookable" and team visibility.

### 6. Health endpoint did not touch the database (low)

`GET /api/health` returned a static payload. It now runs `SELECT 1`, reports `publishedSalons` and `uptimeSeconds`,
and returns `503` when SQLite is unreachable.

### 7. Admin approval history was unreachable (low)

`GET /api/admin/salons/:id/approval` existed but no UI called it. `SalonsTab` now opens an **Approval history** panel
from each row, so all events (not just the six embedded in the queue response) are visible.

### 8. Reminder cron used the server's date (low)

The daily reminder sweep computed "tomorrow" in UTC for every salon. It now resolves tomorrow per salon timezone and
only emails matching bookings.

## Deliberately not applicable

- **Supabase RLS / policies** — this app has no Supabase. The equivalent controls are SQLite foreign keys, CHECK
  constraints, `UNIQUE(owner_id)` / `UNIQUE(slug)` / `UNIQUE(custom_domain)`, and `assertOwnedResource(table, id,
  salonId)` on every owner-scoped route. All are exercised by `test-auth` and `test-audit`.
- **`primary-action` / `secondary-action` classes** — these belong to the other repository. This app styles with
  Tailwind v4 tokens and shadcn primitives; adding unused CSS classes would be dead code. Instead every interactive
  element was checked for a handler, and the automated scan found none without one.
- **AI endpoints** — there are no Gemini/AI routes or clients here, so there is nothing to wire or delete.

## Verification (all on throwaway database copies)

| Suite | Result |
| --- | --- |
| `scripts/test-auth.mjs` | 59 passed, 0 failed |
| `scripts/test-approval.mjs` | 78 passed, 0 failed |
| `scripts/test-google.mjs` | 17 passed, 0 failed |
| `scripts/test-audit.mjs` (new) | 66 passed, 0 failed |
| jsdom owner journey | 18 passed, 0 failed |
| jsdom public journey | 17 passed, 0 failed |
| jsdom wiring check | 21 passed, 0 failed |
| jsdom page harness | 24 passed, 0 failed |
| `npm run lint` (`tsc --noEmit`) | clean |
| `npm run build` | clean |

Production routing probes (`NODE_ENV=production`, `dist/`):

| Request | Status | Notes |
| --- | --- | --- |
| `/house-of-lumen` | 200 | injected `<title>House of Lumen — Hair studio in Jaipur</title>` |
| `/random-xyz` | 404 | `X-Robots-Tag: noindex` |
| `/dashboard`, `/dashboard/settings`, `/admin` | 200 | `noindex` |
| `/deep/unknown/path` | 404 | `noindex` |
| `/assets/missing.js` | 404 | `text/plain` |
| `Host: house-of-lumen.localhost` → `/` | 200 | salon title injected |
| `Host: ghost-tenant.localhost` → `/` | 404 | |
| draft salon slug | 404 | not in `sitemap.xml` |

## Residual risks / deliberate limits

- SQLite is single-node; the capacity check is serialised with `BEGIN IMMEDIATE`, which is correct for one process,
  but a multi-instance deployment needs a relational store with row locking.
- Reviews publish immediately (no moderation queue). Owners can hide them; there is no pre-approval step by design.
- The reminder cron runs at the server's 09:00; only the date calculation is timezone-aware.
- No payment gateway is connected; plans and MRR are tracked manually by super admins.
