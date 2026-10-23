import db, { newId, nowIso } from "./db";

export interface WhatsAppMessagePayload {
  salon: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    slug: string;
    currency: string;
    timezone: string;
    whatsappRemindersEnabled?: boolean;
    whatsappCustomTemplate?: string;
  };
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    price?: number;
  };
}

/**
 * Standardize phone numbers to international digits for WhatsApp wa.me links and API delivery.
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  // Default to India (+91) or US (+1) if 10 digits without country code
  if (digits.length === 10) {
    // If starting with 6-9 usually India, 2-9 US
    if (/^[6-9]/.test(digits)) {
      digits = "91" + digits;
    } else {
      digits = "1" + digits;
    }
  }
  return digits;
}

/**
 * Generates an elegant, readable WhatsApp reminder message body.
 */
export function generateWhatsAppReminderMessage(payload: WhatsAppMessagePayload): string {
  const { salon, booking } = payload;

  if (salon.whatsappCustomTemplate && salon.whatsappCustomTemplate.trim()) {
    return salon.whatsappCustomTemplate
      .replace(/{customer_name}/g, booking.customerName)
      .replace(/{salon_name}/g, salon.name)
      .replace(/{service_name}/g, booking.serviceName || "Appointment")
      .replace(/{staff_name}/g, booking.staffName || "Our Team")
      .replace(/{date}/g, booking.date)
      .replace(/{time}/g, booking.time)
      .replace(/{phone}/g, salon.phone || "");
  }

  const location = [salon.address, salon.city].filter(Boolean).join(", ");

  return [
    `✨ *Appointment Reminder — ${salon.name}*`,
    ``,
    `Hello *${booking.customerName}*, your appointment is coming up in *2 hours*!`,
    ``,
    `📋 *Service:* ${booking.serviceName || "Appointment"}`,
    booking.staffName ? `👤 *With:* ${booking.staffName}` : null,
    `📅 *Date:* ${booking.date}`,
    `⏰ *Time:* ${booking.time}`,
    location ? `📍 *Location:* ${location}` : null,
    ``,
    `Need to reschedule or cancel? Please contact us at ${salon.phone || "the salon"}.`,
    ``,
    `We look forward to welcoming you soon! 💇‍♀️✨`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Generates a direct WhatsApp web/app link (wa.me) for one-click manual send.
 */
export function generateWhatsAppClickUrl(phone: string, text: string): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Sends or logs a WhatsApp reminder message for a booking.
 */
export async function sendWhatsAppReminder(
  payload: WhatsAppMessagePayload,
  triggerType: "automated_2h" | "manual" = "automated_2h"
): Promise<{ success: boolean; reminderId: string; message: string; waUrl: string; mode: "api" | "simulated" }> {
  const { salon, booking } = payload;
  const messageBody = generateWhatsAppReminderMessage(payload);
  const formattedPhone = formatWhatsAppPhone(booking.customerPhone);
  const waUrl = generateWhatsAppClickUrl(booking.customerPhone, messageBody);
  const reminderId = newId();
  const now = nowIso();

  // Check if real WhatsApp Cloud API or Twilio is configured via environment variables
  const whatsappApiKey = process.env.WHATSAPP_API_KEY || process.env.TWILIO_AUTH_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.TWILIO_WHATSAPP_NUMBER;

  let deliveryStatus: "sent" | "delivered" | "failed" = "sent";
  let errorMessage = "";
  let mode: "api" | "simulated" = "simulated";

  if (whatsappApiKey && whatsappPhoneId) {
    try {
      mode = "api";
      // Perform actual WhatsApp Cloud API call if environment credentials exist
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: messageBody },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        deliveryStatus = "failed";
        errorMessage = errJson?.error?.message || `WhatsApp API error ${res.status}`;
      } else {
        deliveryStatus = "delivered";
      }
    } catch (err: any) {
      deliveryStatus = "failed";
      errorMessage = err?.message || "Failed to connect to WhatsApp service";
    }
  } else {
    // High-fidelity simulated delivery mode: log to console & persist full record in SQLite database
    console.log(`[WhatsApp 2h Reminder] (${triggerType}) to ${booking.customerName} (${formattedPhone}):`);
    console.log(messageBody);
    deliveryStatus = "sent";
  }

  // Record in whatsapp_reminders database table
  try {
    db.prepare(
      `INSERT INTO whatsapp_reminders
        (id, salon_id, booking_id, customer_name, customer_phone, service_name, appointment_date, appointment_time, message_body, status, sent_at, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      reminderId,
      salon.id,
      booking.id,
      booking.customerName,
      formattedPhone,
      booking.serviceName || "Appointment",
      booking.date,
      booking.time,
      messageBody,
      deliveryStatus,
      now,
      errorMessage
    );

    // Mark booking as reminded so we don't send duplicate 2h reminders
    db.prepare("UPDATE bookings SET whatsapp_reminder_sent_at = ? WHERE id = ?").run(now, booking.id);
  } catch (dbError) {
    console.error("[WhatsApp DB Error]", dbError);
  }

  return {
    success: deliveryStatus !== "failed",
    reminderId,
    message: messageBody,
    waUrl,
    mode,
  };
}
