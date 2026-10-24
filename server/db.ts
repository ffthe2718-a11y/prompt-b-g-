import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * SQLite is used as the primary datastore so the platform can run with zero
 * external services. The file lives outside the application bundle and can be
 * pointed at a persistent volume in production via DATABASE_PATH.
 */
const databasePath =
  process.env.DATABASE_PATH?.trim() ||
  path.join(process.cwd(), "data", "salon-studio.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'super_admin')),
    google_id     TEXT UNIQUE,
    avatar_url    TEXT NOT NULL DEFAULT '',
    password_set  INTEGER NOT NULL DEFAULT 1,
    email_verified INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    last_login_at TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS salons (
    id                TEXT PRIMARY KEY,
    owner_id          TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE COLLATE NOCASE,
    tagline           TEXT NOT NULL DEFAULT '',
    description       TEXT NOT NULL DEFAULT '',
    logo_url          TEXT NOT NULL DEFAULT '',
    hero_image_url    TEXT NOT NULL DEFAULT '',
    about_image_url   TEXT NOT NULL DEFAULT '',
    hero_title        TEXT NOT NULL DEFAULT '',
    hero_subtitle     TEXT NOT NULL DEFAULT '',
    about_title       TEXT NOT NULL DEFAULT '',
    about_text        TEXT NOT NULL DEFAULT '',
    announcement      TEXT NOT NULL DEFAULT '',
    cta_text          TEXT NOT NULL DEFAULT 'Book your appointment',
    address           TEXT NOT NULL DEFAULT '',
    city              TEXT NOT NULL DEFAULT '',
    state             TEXT NOT NULL DEFAULT '',
    postal_code       TEXT NOT NULL DEFAULT '',
    country           TEXT NOT NULL DEFAULT '',
    phone             TEXT NOT NULL DEFAULT '',
    whatsapp          TEXT NOT NULL DEFAULT '',
    email             TEXT NOT NULL DEFAULT '',
    instagram         TEXT NOT NULL DEFAULT '',
    facebook          TEXT NOT NULL DEFAULT '',
    tiktok            TEXT NOT NULL DEFAULT '',
    twitter           TEXT NOT NULL DEFAULT '',
    website           TEXT NOT NULL DEFAULT '',
    currency          TEXT NOT NULL DEFAULT 'INR',
    timezone          TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    template          TEXT NOT NULL DEFAULT 'luxury',
    primary_color     TEXT NOT NULL DEFAULT '#D4AF37',
    accent_color      TEXT NOT NULL DEFAULT '#F4E4BC',
    status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
    sections_json     TEXT NOT NULL DEFAULT '[]',
    hours_json        TEXT NOT NULL DEFAULT '[]',
    booking_json      TEXT NOT NULL DEFAULT '{}',
    seo_title         TEXT NOT NULL DEFAULT '',
    seo_description   TEXT NOT NULL DEFAULT '',
    custom_domain     TEXT UNIQUE COLLATE NOCASE,
    custom_domain_verified INTEGER NOT NULL DEFAULT 0,
    domain_verify_token TEXT,
    published_json    TEXT,
    approval_status   TEXT NOT NULL DEFAULT 'draft'
                        CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'changes_requested')),
    approval_note     TEXT NOT NULL DEFAULT '',
    submitted_at      TEXT,
    submitted_hash    TEXT,
    approved_at       TEXT,
    approved_hash     TEXT,
    reviewed_at       TEXT,
    reviewed_by       TEXT,
    plan                TEXT NOT NULL DEFAULT 'launch',
    subscription_status TEXT NOT NULL DEFAULT 'active'
                          CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    subscription_renews_at TEXT,
    views             INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    published_at      TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id               TEXT PRIMARY KEY,
    salon_id         TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    category         TEXT NOT NULL DEFAULT '',
    price_cents      INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 0),
    is_active        INTEGER NOT NULL DEFAULT 1,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS service_addons (
    id               TEXT PRIMARY KEY,
    salon_id         TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    price_cents      INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    is_active        INTEGER NOT NULL DEFAULT 1,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff (
    id              TEXT PRIMARY KEY,
    salon_id        TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT '',
    bio             TEXT NOT NULL DEFAULT '',
    image_url       TEXT NOT NULL DEFAULT '',
    specialties_json TEXT NOT NULL DEFAULT '[]',
    experience_years INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id         TEXT PRIMARY KEY,
    salon_id   TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    caption    TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id             TEXT PRIMARY KEY,
    salon_id       TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    service_id     TEXT REFERENCES services(id) ON DELETE SET NULL,
    staff_id       TEXT REFERENCES staff(id) ON DELETE SET NULL,
    service_name   TEXT NOT NULL DEFAULT '',
    staff_name     TEXT NOT NULL DEFAULT '',
    customer_name  TEXT NOT NULL,
    customer_email TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL,
    date           TEXT NOT NULL,
    time           TEXT NOT NULL,
    notes          TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    price_cents    INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id           TEXT PRIMARY KEY,
    salon_id     TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    author_name  TEXT NOT NULL,
    author_email TEXT NOT NULL DEFAULT '',
    rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title        TEXT NOT NULL DEFAULT '',
    comment      TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    owner_reply  TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id         TEXT PRIMARY KEY,
    salon_id   TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    email      TEXT NOT NULL COLLATE NOCASE,
    created_at TEXT NOT NULL,
    UNIQUE (salon_id, email)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at    TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS salon_reviews (
    id          TEXT PRIMARY KEY,
    salon_id    TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    actor_id    TEXT,
    actor_email TEXT NOT NULL DEFAULT '',
    action      TEXT NOT NULL CHECK (action IN ('submit', 'approve', 'reject', 'request_changes', 'revoke')),
    note        TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email      TEXT NOT NULL COLLATE NOCASE,
    expires_at TEXT NOT NULL,
    used_at    TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_audit (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT,
    actor_email TEXT NOT NULL DEFAULT '',
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT '',
    target_id   TEXT NOT NULL DEFAULT '',
    detail      TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id         TEXT PRIMARY KEY,
    salon_id   TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    filename   TEXT NOT NULL,
    mime_type  TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_reminders (
    id               TEXT PRIMARY KEY,
    salon_id         TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    booking_id       TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT NOT NULL,
    service_name     TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    message_body     TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'scheduled')),
    sent_at          TEXT NOT NULL,
    error_message    TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS gift_card_configs (
    salon_id            TEXT PRIMARY KEY REFERENCES salons(id) ON DELETE CASCADE,
    enabled             INTEGER NOT NULL DEFAULT 1,
    denominations_json  TEXT NOT NULL DEFAULT '[50, 100, 150, 250, 500]',
    headline            TEXT NOT NULL DEFAULT 'The Gift of Luxury & Beauty',
    message             TEXT NOT NULL DEFAULT 'Treat someone special to an unforgettable salon experience.',
    card_style          TEXT NOT NULL DEFAULT 'gold_foil' CHECK (card_style IN ('gold_foil', 'minimal_dark', 'silk_blush', 'emerald_velvet')),
    custom_bg_color     TEXT NOT NULL DEFAULT '#12110E',
    custom_accent_color TEXT NOT NULL DEFAULT '#D4AF37',
    expiry_months       INTEGER NOT NULL DEFAULT 12,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gift_cards (
    id               TEXT PRIMARY KEY,
    salon_id         TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    code             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    amount_cents     INTEGER NOT NULL CHECK (amount_cents > 0),
    balance_cents    INTEGER NOT NULL CHECK (balance_cents >= 0),
    purchaser_name   TEXT NOT NULL,
    purchaser_email  TEXT NOT NULL,
    recipient_name   TEXT NOT NULL,
    recipient_email  TEXT NOT NULL DEFAULT '',
    personal_message TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    created_at       TEXT NOT NULL,
    expires_at       TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_salon ON whatsapp_reminders(salon_id, sent_at);
  CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_booking ON whatsapp_reminders(booking_id);
  CREATE INDEX IF NOT EXISTS idx_gift_cards_salon ON gift_cards(salon_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);

  CREATE INDEX IF NOT EXISTS idx_salons_status ON salons(status);
  CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_service_addons_salon ON service_addons(salon_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_staff_salon ON staff(salon_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_gallery_salon ON gallery(salon_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_bookings_salon_date ON bookings(salon_id, date);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_salon_day_status ON bookings(salon_id, date, status);
  CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id, status);
  CREATE INDEX IF NOT EXISTS idx_uploads_salon ON uploads(salon_id);
  CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit(created_at);
  CREATE INDEX IF NOT EXISTS idx_salon_reviews_salon ON salon_reviews(salon_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

  -- Defence in depth: a team member can never hold two live appointments at
  -- the same minute, even if application logic regresses. Unassigned requests
  -- (staff_id NULL) are bounded by the capacity check in the booking route.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_staff_slot
    ON bookings(salon_id, date, time, staff_id)
    WHERE staff_id IS NOT NULL AND status IN ('pending', 'confirmed');
`);

try {
  db.exec("ALTER TABLE salons ADD COLUMN instagram_json TEXT NOT NULL DEFAULT '{}'");
} catch {
  // Column already exists
}

// Forward-compatible additions for deployments created before these fields existed.
ensureColumn("salons", "twitter", "TEXT NOT NULL DEFAULT ''");
ensureColumn("salons", "custom_domain_verified", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("salons", "domain_verify_token", "TEXT");
ensureColumn("salons", "published_json", "TEXT");
ensureColumn("salons", "whatsapp_reminders_enabled", "INTEGER NOT NULL DEFAULT 1");
ensureColumn("salons", "whatsapp_reminder_lead_hours", "INTEGER NOT NULL DEFAULT 2");
ensureColumn("salons", "whatsapp_custom_template", "TEXT NOT NULL DEFAULT ''");
ensureColumn("users", "google_id", "TEXT");
ensureColumn("users", "avatar_url", "TEXT NOT NULL DEFAULT ''");
ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'active'");
ensureColumn("users", "last_login_at", "TEXT");
ensureColumn("users", "password_set", "INTEGER NOT NULL DEFAULT 1");
ensureColumn("users", "email_verified", "INTEGER NOT NULL DEFAULT 0");
// Accounts that already existed before email verification was tracked are
// trusted only if they came in through Google.
db.prepare("UPDATE users SET email_verified = 1 WHERE google_id IS NOT NULL AND email_verified = 0").run();
ensureColumn("salons", "plan", "TEXT NOT NULL DEFAULT 'launch'");
ensureColumn("salons", "subscription_status", "TEXT NOT NULL DEFAULT 'active'");
ensureColumn("salons", "subscription_renews_at", "TEXT");
ensureColumn("salons", "approval_status", "TEXT NOT NULL DEFAULT 'draft'");
ensureColumn("salons", "approval_note", "TEXT NOT NULL DEFAULT ''");
ensureColumn("salons", "submitted_at", "TEXT");
ensureColumn("salons", "submitted_hash", "TEXT");
ensureColumn("salons", "approved_at", "TEXT");
ensureColumn("salons", "approved_hash", "TEXT");
ensureColumn("salons", "reviewed_at", "TEXT");
ensureColumn("salons", "reviewed_by", "TEXT");
ensureColumn("bookings", "addon_ids_json", "TEXT NOT NULL DEFAULT '[]'");
ensureColumn("bookings", "whatsapp_reminder_sent_at", "TEXT");

/* Indexes must come after ensureColumn(): on older databases the column
   does not exist yet when the schema block runs. */
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_salons_approval ON salons(approval_status, submitted_at);
`);

/**
 * Earlier releases stored platform staff as `admin`. RBAC now names the role
 * `super_admin`, so databases created before this change are rebuilt once.
 * SQLite cannot alter a CHECK constraint in place, hence the table copy.
 */
function migrateRoleConstraint() {
  const table = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { sql?: string } | undefined;
  if (!table?.sql || table.sql.includes("super_admin")) return;

  db.pragma("foreign_keys = OFF");
  try {
    db.exec(`
      BEGIN;
      CREATE TABLE users_migrated (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'super_admin')),
        google_id     TEXT,
        avatar_url    TEXT NOT NULL DEFAULT '',
        password_set  INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
        last_login_at TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      INSERT INTO users_migrated (id, email, password_hash, name, role, google_id, avatar_url, status, last_login_at, created_at, updated_at)
        SELECT id, email, password_hash, name,
               CASE WHEN role = 'admin' THEN 'super_admin' ELSE role END,
               google_id, avatar_url, status, last_login_at, created_at, updated_at
        FROM users;
      DROP TABLE users;
      ALTER TABLE users_migrated RENAME TO users;
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      COMMIT;
    `);
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* transaction already closed */
    }
    console.error("[db] role migration failed:", error);
    db.pragma("foreign_keys = ON");
    throw error;
  }
  db.pragma("foreign_keys = ON");
}

migrateRoleConstraint();

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_id) WHERE google_id IS NOT NULL;
`);

export const nowIso = () => new Date().toISOString();
export const newId = () => randomUUID();

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Add a column in future releases without dropping existing data. */
export function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export default db;
