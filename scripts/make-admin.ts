import "dotenv/config";
import db, { nowIso } from "../server/db";
import { normalizeEmail } from "../server/validation";

/**
 * Grant (or revoke) platform super-admin access from the server console.
 *
 *   npm run make-admin -- you@example.com
 *   npm run make-admin -- you@example.com --revoke
 *
 * Requiring shell access is deliberate: password sign-ups do not verify email
 * ownership, so self-service promotion would let anyone claim an ADMIN_EMAILS
 * address. Google sign-ins are promoted automatically because Google verifies
 * the address first.
 */

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const email = normalizeEmail(args.find((arg) => !arg.startsWith("--")) || "");

if (!email) {
  console.error("\n  Usage: npm run make-admin -- you@example.com [--revoke]\n");
  process.exit(1);
}

const user = db.prepare("SELECT id, email, role, status FROM users WHERE email = ?").get(email) as any;
if (!user) {
  console.error(`\n  No account found for ${email}. Register first, then run this again.\n`);
  process.exit(1);
}

if (revoke) {
  const remaining = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin' AND status = 'active' AND id <> ?")
    .get(user.id) as any;
  if (user.role === "super_admin" && user.status === "active" && remaining.count === 0) {
    console.error("\n  Refusing to remove the last active super admin.\n");
    process.exit(1);
  }
  db.prepare("UPDATE users SET role = 'owner', updated_at = ? WHERE id = ?").run(nowIso(), user.id);
  console.log(`\n  ✓ ${email} is now a salon owner.\n`);
} else {
  db.prepare("UPDATE users SET role = 'super_admin', email_verified = 1, updated_at = ? WHERE id = ?").run(
    nowIso(),
    user.id
  );
  console.log(`\n  ✓ ${email} can now sign in and open /admin as a super admin.\n`);
}

db.close();
