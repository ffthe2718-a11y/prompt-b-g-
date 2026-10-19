import nodemailer, { Transporter } from "nodemailer";
import { getSettings } from "./settings";

let transporter: Transporter | null = null;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_PORT || "587") === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(date: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(new Date(`${date}T12:00:00Z`));
  } catch {
    return date;
  }
}

export interface BookingEmailPayload {
  salon: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    slug: string;
    currency: string;
    timezone: string;
  };
  booking: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    notes: string;
    price: number;
  };
}

function bookingSummaryHtml(payload: BookingEmailPayload): string {
  const { salon, booking } = payload;
  const address = [salon.address, salon.city].filter(Boolean).join(", ");
  return `
    <table style="width:100%;border-collapse:collapse;background:#f8f7f3;border-radius:10px;padding:18px;margin:18px 0">
      <tr><td style="padding:6px 0;color:#6b625b">Service</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(booking.serviceName || "Appointment")}</td></tr>
      ${booking.staffName ? `<tr><td style="padding:6px 0;color:#6b625b">With</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(booking.staffName)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#6b625b">Date</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(formatDate(booking.date, salon.timezone))}</td></tr>
      <tr><td style="padding:6px 0;color:#6b625b">Time</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(booking.time)}</td></tr>
      ${booking.price ? `<tr><td style="padding:6px 0;color:#6b625b">Price</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(formatMoney(booking.price, salon.currency))}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#6b625b">Reference</td><td style="padding:6px 0;text-align:right;font-family:monospace">${esc(booking.id.slice(0, 8).toUpperCase())}</td></tr>
    </table>
    ${address ? `<p style="color:#6b625b;font-size:13px">${esc(address)}</p>` : ""}
    ${salon.phone ? `<p style="color:#6b625b;font-size:13px">${esc(salon.phone)}</p>` : ""}
  `;
}

/** Sends best-effort notifications. Email failures never fail the booking. */
export async function sendBookingEmails(payload: BookingEmailPayload): Promise<void> {
  const transport = getTransporter();
  const { salon, booking } = payload;
  if (!transport) {
    console.log(
      `[booking] ${salon.slug}: ${booking.customerName} · ${booking.serviceName} · ${booking.date} ${booking.time} (SMTP not configured)`
    );
    return;
  }

  const from = process.env.SMTP_FROM || `"${salon.name}" <${process.env.SMTP_USER}>`;
  const jobs: Promise<unknown>[] = [];

  if (salon.email) {
    jobs.push(
      transport.sendMail({
        from,
        to: salon.email,
        replyTo: booking.customerEmail || undefined,
        subject: `New booking request — ${booking.serviceName || "Appointment"} on ${booking.date}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#241f1c">
            <h2 style="margin:0 0 4px">New booking request</h2>
            <p style="color:#6b625b;margin:0 0 20px">${esc(salon.name)}</p>
            <p><strong>${esc(booking.customerName)}</strong> requested an appointment.</p>
            ${bookingSummaryHtml(payload)}
            <p style="font-size:13px;color:#6b625b">Phone: ${esc(booking.customerPhone)}${booking.customerEmail ? `<br/>Email: ${esc(booking.customerEmail)}` : ""}</p>
            ${booking.notes ? `<p style="font-size:13px;color:#6b625b;white-space:pre-wrap">Notes: ${esc(booking.notes)}</p>` : ""}
            <p style="font-size:13px;color:#6b625b">Sign in to your dashboard to confirm or reschedule this appointment.</p>
          </div>`,
      })
    );
  }

  if (booking.customerEmail) {
    jobs.push(
      transport.sendMail({
        from,
        to: booking.customerEmail,
        replyTo: salon.email || undefined,
        subject: `Your appointment request at ${salon.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#241f1c">
            <h2 style="margin:0 0 4px">${esc(salon.name)}</h2>
            <p style="color:#6b625b;margin:0 0 20px">We received your appointment request.</p>
            <p>Hello ${esc(booking.customerName)},</p>
            <p>Thank you for booking with us. Your request is <strong>pending confirmation</strong> — the salon will contact you shortly.</p>
            ${bookingSummaryHtml(payload)}
            <p style="font-size:13px;color:#6b625b">Need to make a change? Contact the salon${salon.phone ? ` at ${esc(salon.phone)}` : ""}${salon.email ? ` or reply to ${esc(salon.email)}` : ""}.</p>
          </div>`,
      })
    );
  }

  await Promise.allSettled(jobs);
}

export async function sendReminderEmail(payload: BookingEmailPayload): Promise<void> {
  const transport = getTransporter();
  if (!transport || !payload.booking.customerEmail) return;
  const { salon, booking } = payload;
  const from = process.env.SMTP_FROM || `"${salon.name}" <${process.env.SMTP_USER}>`;
  await transport
    .sendMail({
      from,
      to: booking.customerEmail,
      replyTo: salon.email || undefined,
      subject: `Reminder: your appointment at ${salon.name} tomorrow`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#241f1c">
          <h2 style="margin:0 0 4px">${esc(salon.name)}</h2>
          <p style="color:#6b625b;margin:0 0 20px">A friendly reminder of your appointment tomorrow.</p>
          ${bookingSummaryHtml(payload)}
          <p style="font-size:13px;color:#6b625b">We look forward to seeing you.</p>
        </div>`,
    })
    .catch((error) => console.warn("[email] reminder failed:", error?.message || error));
}

/* ------------------------------------------------------------------ */
/* Account emails                                                      */
/* ------------------------------------------------------------------ */

function brandName(): string {
  try {
    return getSettings().platformName;
  } catch {
    return process.env.PLATFORM_NAME || "Velvet Salon Studio";
  }
}

function layout(heading: string, body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#241f1c">
      <h2 style="margin:0 0 4px;font-family:Georgia,serif">${esc(heading)}</h2>
      <p style="color:#6b625b;margin:0 0 20px">${esc(brandName())}</p>
      ${body}
      <p style="font-size:12px;color:#8a817a;margin-top:32px">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>`;
}

export async function sendVerificationEmail(options: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[email] verify email for ${options.to} (SMTP not configured): ${options.verifyUrl}`);
    return false;
  }
  const from = process.env.SMTP_FROM || `"${brandName()}" <${process.env.SMTP_USER}>`;
  await transport
    .sendMail({
      from,
      to: options.to,
      subject: `Confirm your email for ${brandName()}`,
      html: layout(
        "Confirm your email address",
        `<p>Hello ${esc(options.name)},</p>
         <p>Confirm this email address to finish setting up your salon. The link is valid for 24 hours and can be used once.</p>
         <p style="margin:24px 0">
           <a href="${esc(options.verifyUrl)}" style="background:#111;color:#f5e9c8;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
             Confirm email address
           </a>
         </p>
         <p style="font-size:13px;color:#6b625b">Or paste this link into your browser:<br/><span style="font-family:monospace;word-break:break-all">${esc(options.verifyUrl)}</span></p>`
      ),
    })
    .catch((error) => console.warn("[email] verification failed:", error?.message || error));
  return true;
}

export async function sendPasswordResetEmail(options: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[email] password reset for ${options.to} (SMTP not configured): ${options.resetUrl}`);
    return false;
  }
  const from = process.env.SMTP_FROM || `"${brandName()}" <${process.env.SMTP_USER}>`;
  await transport
    .sendMail({
      from,
      to: options.to,
      subject: `Reset your ${brandName()} password`,
      html: layout(
        "Reset your password",
        `<p>Hello ${esc(options.name)},</p>
         <p>We received a request to reset the password for your salon dashboard. The link below is valid for one hour and can be used once.</p>
         <p style="margin:24px 0">
           <a href="${esc(options.resetUrl)}" style="background:#111;color:#f5e9c8;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
             Choose a new password
           </a>
         </p>
         <p style="font-size:13px;color:#6b625b">Or paste this link into your browser:<br/><span style="font-family:monospace;word-break:break-all">${esc(options.resetUrl)}</span></p>`
      ),
    })
    .catch((error) => console.warn("[email] password reset failed:", error?.message || error));
  return true;
}

export type SalonEmailEvent = "submitted" | "approved" | "rejected" | "changes_requested" | "unpublished";

/**
 * Transactional mail for the review workflow. Approval mail is the only place a
 * salon owner learns their site can go live, so it always includes the URL.
 */
export async function sendSalonStatusEmail(options: {
  to: string;
  ownerName: string;
  salonName: string;
  event: SalonEmailEvent;
  note?: string;
  siteUrl?: string;
  dashboardUrl: string;
}): Promise<boolean> {
  const copy: Record<SalonEmailEvent, { subject: string; heading: string; body: string; cta: string }> = {
    submitted: {
      subject: `${options.salonName} is in the review queue`,
      heading: "Submission received",
      body: `<p>Hello ${esc(options.ownerName)},</p>
        <p>Thanks for submitting <strong>${esc(options.salonName)}</strong>. Our platform team reviews new websites by hand, usually within one business day.</p>
        <p>You can keep editing while you wait — just save your changes as a draft. We will email you as soon as there is a decision.</p>`,
      cta: "Open your dashboard",
    },
    approved: {
      subject: `${options.salonName} has been approved`,
      heading: "You are approved",
      body: `<p>Hello ${esc(options.ownerName)},</p>
        <p><strong>${esc(options.salonName)}</strong> passed review. You can publish it now and share your live URL with clients.</p>
        ${options.siteUrl ? `<p style="font-size:13px;color:#6b625b">Your address once published:<br/><span style="font-family:monospace;word-break:break-all">${esc(options.siteUrl)}</span></p>` : ""}`,
      cta: "Publish your website",
    },
    rejected: {
      subject: `${options.salonName} needs changes before it can go live`,
      heading: "Review feedback",
      body: `<p>Hello ${esc(options.ownerName)},</p>
        <p>We could not approve <strong>${esc(options.salonName)}</strong> yet.</p>
        ${options.note ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #c9a227;background:#faf7ee;font-size:14px">${esc(options.note)}</blockquote>` : ""}
        <p>Your salon stays editable. Make the requested changes, then submit it again from your dashboard.</p>`,
      cta: "Edit your website",
    },
    changes_requested: {
      subject: `Changes requested for ${options.salonName}`,
      heading: "A few changes requested",
      body: `<p>Hello ${esc(options.ownerName)},</p>
        <p>Our team reviewed <strong>${esc(options.salonName)}</strong> and asked for a few changes before it can go live.</p>
        ${options.note ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #c9a227;background:#faf7ee;font-size:14px">${esc(options.note)}</blockquote>` : ""}
        <p>Update your website, then resubmit when you are ready.</p>`,
      cta: "Edit your website",
    },
    unpublished: {
      subject: `${options.salonName} is no longer live`,
      heading: "Your website was taken offline",
      body: `<p>Hello ${esc(options.ownerName)},</p>
        <p>A platform administrator unpublished <strong>${esc(options.salonName)}</strong>, so it is no longer reachable at its public URL.</p>
        ${options.note ? `<p style="font-size:13px;color:#6b625b">${esc(options.note)}</p>` : ""}
        <p>Your content and approvals are intact. Contact support if you believe this was a mistake.</p>`,
      cta: "Open your dashboard",
    },
  };
  const content = copy[options.event];
  const transport = getTransporter();
  if (!transport) {
    console.log(`[email] ${options.event} mail for ${options.to} (SMTP not configured): ${content.subject}`);
    return false;
  }
  const from = process.env.SMTP_FROM || `"${brandName()}" <${process.env.SMTP_USER}>`;
  await transport
    .sendMail({
      from,
      to: options.to,
      subject: content.subject,
      html: layout(
        content.heading,
        `${content.body}
         <p style="margin:24px 0">
           <a href="${esc(options.dashboardUrl)}" style="background:#111;color:#f5e9c8;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
             ${esc(content.cta)}
           </a>
         </p>`
      ),
    })
    .catch((error) => console.warn("[email] salon status failed:", error?.message || error));
  return true;
}
