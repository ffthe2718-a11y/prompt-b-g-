import db from "./db";
import { timeToMinutes } from "./validation";
import { sendWhatsAppReminder } from "./whatsapp";

function salonTimeInfo(timezone: string): { todayDate: string; nowMinutes: number } {
  try {
    const now = new Date();
    const formatterDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayDate = formatterDate.format(now);

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const nowMinutes = hour * 60 + minute;

    return { todayDate, nowMinutes };
  } catch {
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return { todayDate, nowMinutes };
  }
}

/**
 * Sweeps active bookings across all salons to automatically dispatch WhatsApp reminders
 * 2 hours before scheduled appointment time.
 */
export async function checkAndSend2HourReminders(): Promise<{ checked: number; sent: number }> {
  let checked = 0;
  let sent = 0;

  try {
    // Get all salons with WhatsApp reminders enabled
    const salons = db
      .prepare(
        `SELECT id, name, phone, address, city, slug, currency, timezone,
                whatsapp_reminders_enabled, whatsapp_reminder_lead_hours, whatsapp_custom_template
         FROM salons
        WHERE status = 'published' OR status = 'draft'`
      )
      .all() as any[];

    for (const salon of salons) {
      if (salon.whatsapp_reminders_enabled === 0) continue;

      const leadHours = Number(salon.whatsapp_reminder_lead_hours) || 2;
      const targetLeadMinutes = leadHours * 60; // 2 hours = 120 minutes

      const { todayDate, nowMinutes } = salonTimeInfo(salon.timezone);

      // Find pending/confirmed bookings for today that haven't received a WhatsApp reminder yet
      const bookings = db
        .prepare(
          `SELECT b.id, b.customer_name, b.customer_phone, b.service_name, b.staff_name, b.date, b.time, b.price_cents
           FROM bookings b
          WHERE b.salon_id = ?
            AND b.date = ?
            AND b.status IN ('pending', 'confirmed')
            AND b.whatsapp_reminder_sent_at IS NULL`
        )
        .all(salon.id, todayDate) as any[];

      checked += bookings.length;

      for (const booking of bookings) {
        const appointmentMinutes = timeToMinutes(booking.time);
        if (appointmentMinutes < 0) continue;

        // Calculate time difference in minutes until appointment
        const diffMinutes = appointmentMinutes - nowMinutes;

        // Trigger if appointment is approximately 2 hours away (105m to 135m window)
        // or if it's within 2 hours and hasn't been sent yet
        if (diffMinutes > 0 && diffMinutes <= targetLeadMinutes + 15) {
          await sendWhatsAppReminder(
            {
              salon: {
                id: salon.id,
                name: salon.name,
                phone: salon.phone,
                address: salon.address,
                city: salon.city,
                slug: salon.slug,
                currency: salon.currency,
                timezone: salon.timezone,
                whatsappRemindersEnabled: salon.whatsapp_reminders_enabled !== 0,
                whatsappCustomTemplate: salon.whatsapp_custom_template || "",
              },
              booking: {
                id: booking.id,
                customerName: booking.customer_name,
                customerPhone: booking.customer_phone,
                serviceName: booking.service_name,
                staffName: booking.staff_name,
                date: booking.date,
                time: booking.time,
                price: Math.round(booking.price_cents || 0) / 100,
              },
            },
            "automated_2h"
          );
          sent++;
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp 2h Scheduler Error]", error);
  }

  return { checked, sent };
}

/**
 * Initializes the background WhatsApp 2-hour reminder scheduler worker.
 */
export function startWhatsAppScheduler(): void {
  console.log("[WhatsApp Scheduler] Automated 2-hour reminder worker initialized.");

  // First check on server start
  setTimeout(() => {
    void checkAndSend2HourReminders();
  }, 10_000);

  // Periodic check every 1 minute
  setInterval(() => {
    void checkAndSend2HourReminders();
  }, 60_000);
}
