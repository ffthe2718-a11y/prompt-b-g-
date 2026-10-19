/**
 * Audit suite: booking integrity, tenant isolation, health and public routing.
 *
 * Run against an isolated copy of the demo database:
 *   DATABASE_PATH=/tmp/audit.db PORT=3200 npx tsx server.ts
 *   BASE=http://localhost:3200 node scripts/test-audit.mjs
 */
const BASE = process.env.BASE || "http://localhost:3200";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, extra = "") {
  if (condition) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
}

async function json(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (body && typeof body === "object" && body.error) {
    body = { ...body, message: body.error.message, code: body.error.code };
  }
  return { status: response.status, body, headers: response.headers };
}

async function login(email, password = "velvet-demo") {
  const result = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (result.status !== 200 || !result.body?.token) {
    throw new Error(`Login failed for ${email}: ${result.status} ${JSON.stringify(result.body)}`);
  }
  return result.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekday(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`)
  );
}

/** First open day at least `offset` days out, honouring the salon's closed days. */
function nextOpenDate(salon, offset = 2) {
  const start = new Date().toISOString().slice(0, 10);
  for (let i = offset; i < offset + 10; i++) {
    const date = addDays(start, i);
    const hours = salon.hours.find((entry) => entry.day === weekday(date));
    if (hours && !hours.closed) return { date, hours };
  }
  throw new Error("No open day found in the next 10 days");
}

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function slotPlus(time, minutes) {
  const total = toMinutes(time) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

async function main() {
  console.log("1. Health & platform");
  const health = await json("/api/health");
  check("health returns 200", health.status === 200, health.status);
  check("health reports ok", health.body?.status === "ok", health.body?.status);
  check("health reports sqlite", health.body?.database === "sqlite");
  check("health counts published salons", typeof health.body?.publishedSalons === "number" && health.body.publishedSalons >= 2, health.body?.publishedSalons);
  check("health reports uptime", typeof health.body?.uptimeSeconds === "number");
  const unknownApi = await json("/api/nope");
  check("unknown API path is 404", unknownApi.status === 404 && unknownApi.body?.code === "not_found");
  const config = await json("/api/public/config");
  check("public config is served", config.status === 200 && !!config.body?.platformName);

  console.log("\n2. Tenant visibility");
  const missing = await json("/api/public/salons/does-not-exist-xyz");
  check("unknown slug is 404", missing.status === 404 && missing.body?.code === "not_found");

  const ownerA = await login("anaya@velvet.demo");
  const ownerB = await login("naina@velvet.demo");
  const admin = await login("admin@velvet.demo");

  const meA = await json("/api/salons/me", { headers: auth(ownerA) });
  const meB = await json("/api/salons/me", { headers: auth(ownerB) });
  const salonA = meA.body?.salon;
  const salonB = meB.body?.salon;
  check("owner A gets own salon", meA.status === 200 && salonA?.slug === "house-of-lumen");
  check("owner B gets own salon", meB.status === 200 && salonB?.slug === "ochre-and-ink");
  check("owner salons are distinct", salonA?.id !== salonB?.id);

  // A brand-new salon stays private until it is submitted, approved and published.
  const suffix = Date.now().toString(36).slice(-6);
  const register = await json("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Audit Draft Owner", email: `audit-${suffix}@example.com`, password: "audit-pass-123" }),
  });
  const draftToken = register.body?.token;
  check("new owner can register", register.status === 201 && !!draftToken, register.status);
  const draftSlug = `audit-draft-${suffix}`;
  const createSalon = await json("/api/salons", {
    method: "POST",
    headers: { ...auth(draftToken), "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Audit Draft Studio", slug: draftSlug }),
  });
  check("new salon starts as a draft", createSalon.status === 201 && createSalon.body?.salon?.status === "draft", createSalon.body?.salon?.status);
  const draftPublic = await json(`/api/public/salons/${draftSlug}`);
  check("draft salon is not publicly readable", draftPublic.status === 404 && draftPublic.body?.code === "not_found");
  const draftAvailability = await json(`/api/public/salons/${draftSlug}/availability?date=${nextOpenDate(salonA).date}`);
  check("draft salon has no availability API", draftAvailability.status === 404);
  const directory = await json("/api/public/salons");
  check(
    "directory excludes draft salons",
    directory.status === 200 && !(directory.body?.salons || []).some((entry) => entry.slug === draftSlug)
  );

  console.log("\n3. Availability grid");
  const service60 = salonA.services.find((entry) => entry.durationMinutes === 60) || salonA.services[0];
  const service90 = salonA.services.find((entry) => entry.durationMinutes >= 90);
  const staffA = salonA.staff.filter((entry) => entry.isActive !== false);

  /**
   * The demo database already holds appointments, so a "free" slot must be
   * confirmed free for every active team member before capacity tests use it.
   */
  async function fullyFreeSlot(serviceId, fromOffset = 2) {
    for (let offset = fromOffset; offset < fromOffset + 14; offset++) {
      const candidate = nextOpenDate(salonA, offset).date;
      const grids = [];
      for (const member of staffA) {
        grids.push(
          await json(
            `/api/public/salons/${salonA.slug}/availability?date=${candidate}&serviceId=${serviceId}&staffId=${member.id}`
          )
        );
      }
      if (grids.some((grid) => grid.body?.closed !== false)) continue;
      const shared = (grids[0].body?.slots || []).find((entry) =>
        entry.available && grids.every((grid) => grid.body?.slots?.some((other) => other.time === entry.time && other.available))
      );
      if (shared) return { date: candidate, time: shared.time };
    }
    throw new Error("No fully free slot in the next two weeks");
  }

  const fixture = await fullyFreeSlot(service60.id);
  const date = fixture.date;
  const hours = nextOpenDate(salonA, 2).hours;
  const freeDate = await json(`/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=${service60.id}`);
  check("availability returns 200", freeDate.status === 200, freeDate.status);
  check("availability is open", freeDate.body?.closed === false, freeDate.body?.reason);
  check("availability echoes the service duration", freeDate.body?.durationMinutes === service60.durationMinutes);
  check("slot grid has entries", Array.isArray(freeDate.body?.slots) && freeDate.body.slots.length > 0);
  const slots = freeDate.body?.slots || [];
  check("all slots initially available", slots.every((slot) => slot.available));
  check("first slot starts at opening time", slots[0]?.time === (freeDate.body?.hours?.open || hours.open));
  const lastSlot = slots[slots.length - 1];
  check(
    "last slot plus duration fits before closing",
    toMinutes(lastSlot.time) + freeDate.body.durationMinutes <= toMinutes(freeDate.body.hours.close),
    `${lastSlot.time} + ${freeDate.body.durationMinutes}`
  );
  const badDate = await json(`/api/public/salons/${salonA.slug}/availability?date=19-10-2026`);
  check("malformed date is rejected", badDate.status === 400 && badDate.body?.code === "invalid_date", badDate.status);
  const past = await json(`/api/public/salons/${salonA.slug}/availability?date=2020-01-02`);
  check("past date reports closed", past.status === 200 && past.body?.closed === true);
  const far = await json(`/api/public/salons/${salonA.slug}/availability?date=${addDays(date, 400)}`);
  check("date beyond the booking window reports closed", far.status === 200 && far.body?.closed === true);
  const badService = await json(`/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=nope`);
  check("unknown service is rejected", badService.status === 400 && badService.body?.code === "invalid_service");
  const badStaff = await json(`/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=${service60.id}&staffId=nope`);
  check("unknown staff member is rejected", badStaff.status === 400 && badStaff.body?.code === "invalid_staff");

  const slot = fixture.time;
  check("picked a slot free for the whole team", !!slot, slot);

  console.log("\n4. Booking capacity & double-booking");
  const bookingPayload = (overrides = {}) => ({
    serviceId: service60.id,
    staffId: staffA[0].id,
    customerName: "Audit Guest",
    customerEmail: `guest-${suffix}@example.com`,
    customerPhone: "9876543210",
    date,
    time: slot,
    ...overrides,
  });
  const first = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload()),
  });
  check("guest can book a free slot", first.status === 201 && !!first.body?.booking?.reference, JSON.stringify(first.body));
  const bookingA = first.body?.booking;

  const afterFirst = await json(
    `/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=${service60.id}&staffId=${staffA[0].id}`
  );
  const taken = afterFirst.body?.slots?.find((entry) => entry.time === slot);
  check("booked slot disappears for that staff member", taken?.available === false);

  const overlapStart = slotPlus(slot, 30);
  const overlap = afterFirst.body?.slots?.find((entry) => entry.time === overlapStart);
  check(
    "slot starting mid-appointment stays blocked (duration aware)",
    overlap ? overlap.available === false : true,
    overlapStart
  );

  const otherStaff = await json(
    `/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=${service60.id}&staffId=${staffA[1].id}`
  );
  check(
    "another staff member is still free at the same time",
    otherStaff.body?.slots?.find((entry) => entry.time === slot)?.available === true
  );

  const duplicate = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload()),
  });
  check("same staff member cannot be double-booked", duplicate.status === 409 && duplicate.body?.code === "slot_unavailable", `${duplicate.status} ${duplicate.body?.code}`);

  const second = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ staffId: staffA[1].id })),
  });
  check("second staff member can take the same time", second.status === 201);

  const third = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ staffId: undefined })),
  });
  check("unassigned request consumes remaining capacity", third.status === 201, JSON.stringify(third.body));

  const exhausted = await json(
    `/api/public/salons/${salonA.slug}/availability?date=${date}&serviceId=${service60.id}`
  );
  check(
    "salon reports no capacity once every member is busy",
    exhausted.body?.slots?.find((entry) => entry.time === slot)?.available === false
  );
  const overbook = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ staffId: staffA[2].id })),
  });
  check("fully booked salon rejects another request", overbook.status === 409 && overbook.body?.code === "slot_unavailable");

  const offGrid = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ staffId: staffA[0].id, time: "23:30" })),
  });
  check("time outside opening hours is rejected", offGrid.status === 409 && offGrid.body?.code === "slot_unavailable");

  if (service90) {
    let date2 = "";
    let longSlot = "";
    for (let offset = 3; offset < 17 && !longSlot; offset++) {
      const candidate = nextOpenDate(salonA, offset).date;
      const grid = await json(
        `/api/public/salons/${salonA.slug}/availability?date=${candidate}&serviceId=${service90.id}&staffId=${staffA[0].id}`
      );
      const free = grid.body?.slots?.find((entry) => entry.available);
      if (free) {
        date2 = candidate;
        longSlot = free.time;
      }
    }
    check("found an open slot for the long service", !!longSlot, date2);
    const longBooking = await json(`/api/public/salons/${salonA.slug}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload({ date: date2, time: longSlot, serviceId: service90.id })),
    });
    check("long service books successfully", longBooking.status === 201, JSON.stringify(longBooking.body));
    const longGrid = await json(
      `/api/public/salons/${salonA.slug}/availability?date=${date2}&serviceId=${service60.id}&staffId=${staffA[0].id}`
    );
    check(
      "a 90-minute booking blocks the following 60-minute start",
      longGrid.body?.slots?.find((entry) => entry.time === slotPlus(longSlot, 30))?.available === false
    );
  }

  console.log("\n5. Owner isolation (RLS equivalent)");
  const foreignService = salonB.services?.[0]?.id;
  const foreignStaff = salonB.staff?.[0]?.id;
  const foreignBooking = bookingA?.id;
  const patchForeignService = await json(`/api/salons/me/services/${foreignService}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Hijacked service" }),
  });
  check("owner cannot edit another salon's service", patchForeignService.status === 404);
  const deleteForeignStaff = await json(`/api/salons/me/staff/${foreignStaff}`, {
    method: "DELETE",
    headers: auth(ownerA),
  });
  check("owner cannot delete another salon's staff", deleteForeignStaff.status === 404);
  const patchForeignBooking = await json(`/api/salons/me/bookings/${foreignBooking}`, {
    method: "PATCH",
    headers: { ...auth(ownerB), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  check("owner B cannot mutate owner A's booking", patchForeignBooking.status === 404);
  const Bbookings = await json("/api/salons/me/bookings", { headers: auth(ownerB) });
  check(
    "owner B's booking list never contains owner A's booking",
    !(Bbookings.body?.bookings || []).some((entry) => entry.id === foreignBooking)
  );
  const ownerAdmin = await json("/api/admin/users", { headers: auth(ownerA) });
  check("owner is blocked from admin APIs", ownerAdmin.status === 403);
  const anonSalon = await json("/api/salons/me");
  check("anonymous users cannot read owner data", anonSalon.status === 401);
  const anonAdmin = await json("/api/admin/stats");
  check("anonymous users cannot read admin stats", anonAdmin.status === 401);

  console.log("\n6. Booking state transitions");
  const confirm = await json(`/api/salons/me/bookings/${bookingA.id}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  });
  check("owner can confirm a request", confirm.status === 200 && confirm.body?.booking?.status === "confirmed");
  const invalidStatus = await json(`/api/salons/me/bookings/${bookingA.id}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "teleported" }),
  });
  check("invalid booking status is rejected", invalidStatus.status === 400 && invalidStatus.body?.code === "invalid_status");

  // Find a day/slot where two different members are both free. The seeded
  // database already contains appointments, so never assume a blank calendar.
  let date3 = "";
  let slot3 = "";
  for (let offset = 6; offset < 20 && !slot3; offset++) {
    const candidate = nextOpenDate(salonA, offset).date;
    const grid = await json(
      `/api/public/salons/${salonA.slug}/availability?date=${candidate}&serviceId=${service60.id}&staffId=${staffA[0].id}`
    );
    const otherGrid = await json(
      `/api/public/salons/${salonA.slug}/availability?date=${candidate}&serviceId=${service60.id}&staffId=${staffA[1].id}`
    );
    const shared = (grid.body?.slots || []).find(
      (entry) => entry.available && otherGrid.body?.slots?.some((other) => other.time === entry.time && other.available)
    );
    if (shared) {
      date3 = candidate;
      slot3 = shared.time;
    }
  }
  check("found a slot free for two staff members", !!slot3, date3);
  const a3 = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ date: date3, time: slot3, staffId: staffA[0].id })),
  });
  const b3 = await json(`/api/public/salons/${salonA.slug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload({ date: date3, time: slot3, staffId: staffA[1].id })),
  });
  check("two staff can hold the same time on another day", a3.status === 201 && b3.status === 201);
  const reassign = await json(`/api/salons/me/bookings/${b3.body?.booking?.id}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ staffId: staffA[0].id }),
  });
  check(
    "reassigning onto a busy staff member is rejected",
    reassign.status === 409 && reassign.body?.code === "slot_unavailable",
    `${reassign.status} ${reassign.body?.code}`
  );
  const cancel = await json(`/api/salons/me/bookings/${a3.body?.booking?.id}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  check("owner can cancel", cancel.status === 200 && cancel.body?.booking?.status === "cancelled");
  const freed = await json(
    `/api/public/salons/${salonA.slug}/availability?date=${date3}&serviceId=${service60.id}&staffId=${staffA[0].id}`
  );
  check("cancelling frees the slot again", freed.body?.slots?.find((entry) => entry.time === slot3)?.available === true);
  const restore = await json(`/api/salons/me/bookings/${b3.body?.booking?.id}`, {
    method: "PATCH",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ staffId: staffA[0].id }),
  });
  check("freed slot can now be reassigned", restore.status === 200, `${restore.status} ${restore.body?.code}`);

  console.log("\n7. Admin approval surface");
  const approvals = await json("/api/admin/approvals?status=pending", { headers: auth(admin) });
  check("approval queue loads", approvals.status === 200 && Array.isArray(approvals.body?.approvals));
  const detail = await json(`/api/admin/salons/${salonA.id}/approval`, { headers: auth(admin) });
  check(
    "approval detail returns the salon's history",
    detail.status === 200 && detail.body?.approval?.id === salonA.id && Array.isArray(detail.body?.history)
  );
  const ownerApprove = await json(`/api/admin/salons/${salonA.id}/approve`, {
    method: "POST",
    headers: { ...auth(ownerA), "Content-Type": "application/json" },
    body: JSON.stringify({ note: "" }),
  });
  check("owner cannot approve a salon", ownerApprove.status === 403);
  const missingApprove = await json("/api/admin/salons/nope/approve", {
    method: "POST",
    headers: { ...auth(admin), "Content-Type": "application/json" },
    body: JSON.stringify({ note: "" }),
  });
  check("approving an unknown salon is 404", missingApprove.status === 404);

  console.log("\n8. Owner tools wired to the API");
  const subscriberEmail = `newsletter-${suffix}@example.com`;
  const subscribe = await json(`/api/public/salons/${salonA.slug}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: subscriberEmail }),
  });
  check("public newsletter form accepts a subscriber", subscribe.status === 200);
  const subscribers = await json("/api/salons/me/subscribers", { headers: auth(ownerA) });
  check(
    "owner can read the subscriber list",
    subscribers.status === 200 && (subscribers.body?.subscribers || []).some((entry) => entry.email === subscriberEmail)
  );
  const reminder = await json(`/api/salons/me/bookings/${bookingA.id}/reminder`, {
    method: "POST",
    headers: auth(ownerA),
  });
  check(
    "owner can trigger a booking reminder",
    reminder.status === 200 && typeof reminder.body?.delivered === "boolean" && !!reminder.body?.message,
    `${reminder.status} ${reminder.body?.code || ""}`
  );
  const removable = third.body?.booking;
  if (removable?.id) {
    const removed = await json(`/api/salons/me/bookings/${removable.id}`, {
      method: "DELETE",
      headers: auth(ownerA),
    });
    check("owner can delete a booking record", removed.status === 200 && removed.body?.success === true);
    const remaining = await json("/api/salons/me/bookings", { headers: auth(ownerA) });
    check(
      "deleted booking disappears from the list",
      !(remaining.body?.bookings || []).some((entry) => entry.id === removable.id)
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) {
    console.log(`Failures: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
