/**
 * Aurelia Luxe - 24-Hour Client Appointment Proactive Reminder Service
 * 
 * Provides helper functions to calculate upcoming appointments within the 24-hour window,
 * trigger HTML5 browser notifications, display rich in-app UI alerts, and log notifications in Firestore.
 */

import { toast } from "sonner";
import { format, formatDistanceToNow, addHours, isWithinInterval, parse } from "date-fns";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

export interface ReminderAppointment {
  id: string;
  name: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
  address?: string;
  userId?: string;
  userEmail?: string;
  status?: string;
  serviceType?: 'home' | 'salon';
  deliveryAddress?: {
    street?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    fullAddress?: string;
  } | null;
  distanceKm?: number;
  homeServiceFee?: number;
  totalAmount?: number;
  advancePaid?: boolean;
  reminder24hSent?: boolean;
  [key: string]: any;
}

export interface ReminderResult {
  checkedCount: number;
  triggeredCount: number;
  appointments: ReminderAppointment[];
  messages: string[];
}

export interface ReminderOptions {
  windowStartHours?: number; // default: 18 hours
  windowEndHours?: number;   // default: 30 hours (covers ~24h ahead)
  forceTrigger?: boolean;    // bypasses localStorage deduplication check
  enableSound?: boolean;     // plays subtle notification sound
  updateFirestore?: boolean; // updates appointment doc in Firestore
  notifyStaffRole?: boolean; // creates system notification in Firestore
  onTrigger?: (appointment: ReminderAppointment, hoursRemaining: number) => void;
}

const STORAGE_KEY = "aurelia_sent_24h_reminders";

/**
 * Parses appointment date and time string into a valid JavaScript Date object
 */
export function parseAppointmentDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;

  try {
    const baseDate = new Date(dateStr);
    if (isNaN(baseDate.getTime())) return null;

    if (!timeStr) {
      // Default to 9:00 AM if no time specified
      baseDate.setHours(9, 0, 0, 0);
      return baseDate;
    }

    // Try parsing 12-hour format: "09:00 AM", "02:30 PM", "9:00 AM", etc.
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const match = timeStr.match(timeRegex);

    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3]?.toUpperCase();

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      baseDate.setHours(hours, minutes, 0, 0);
      return baseDate;
    }

    // Fallback: return base date with default midday
    baseDate.setHours(10, 0, 0, 0);
    return baseDate;
  } catch (error) {
    console.warn("Failed to parse appointment date/time:", dateStr, timeStr, error);
    return null;
  }
}

/**
 * Calculates hours and minutes remaining until scheduled appointment
 */
export function getTimeUntilAppointment(appointment: ReminderAppointment): {
  targetDate: Date | null;
  hoursUntil: number;
  isWithin24Hours: number | boolean;
  humanDistance: string;
} {
  const targetDate = parseAppointmentDateTime(appointment.date, appointment.time);
  if (!targetDate) {
    return { targetDate: null, hoursUntil: -999, isWithin24Hours: false, humanDistance: "Unknown" };
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const hoursUntil = diffMs / (1000 * 60 * 60);
  const isWithin24Hours = hoursUntil > 0 && hoursUntil <= 30; // Within 24-30 hour window

  return {
    targetDate,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
    isWithin24Hours,
    humanDistance: formatDistanceToNow(targetDate, { addSuffix: true }),
  };
}

/**
 * Request HTML5 Browser Notification Permission from User
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Browser notifications are not supported by this browser.");
    return "denied";
  }

  try {
    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Browser notifications enabled for 24-hour appointment reminders!");
    } else if (permission === "denied") {
      toast.info("Browser notifications blocked. In-app alerts will be used instead.");
    }
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Check current notification permission state
 */
export function getBrowserNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Play a subtle reminder audio chime using Web Audio API
 */
export function playReminderChime(): void {
  try {
    if (typeof window === "undefined" || !(window.AudioContext || (window as any).webkitAudioContext)) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    
    // Smooth chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.25); // D6
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (err) {
    // Audio playback not allowed without prior user gesture
  }
}

/**
 * Checks if a 24-hour reminder was already sent for this appointment
 */
function hasReminderBeenSent(appointmentId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const sentMap: Record<string, number> = JSON.parse(raw);
    const sentTimestamp = sentMap[appointmentId];
    if (!sentTimestamp) return false;

    // If sent within the last 18 hours, consider it already sent
    const now = Date.now();
    return now - sentTimestamp < 18 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Records that a 24h reminder has been dispatched for this appointment
 */
function recordReminderSent(appointmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const sentMap: Record<string, number> = raw ? JSON.parse(raw) : {};
    sentMap[appointmentId] = Date.now();

    // Clean up entries older than 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    Object.keys(sentMap).forEach((id) => {
      if (sentMap[id] < cutoff) delete sentMap[id];
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentMap));
  } catch (err) {
    console.warn("Failed to record reminder in localStorage:", err);
  }
}

/**
 * Dispatches a native HTML5 browser notification
 */
export function triggerBrowserNotification(title: string, body: string, appointmentId?: string): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `appointment-reminder-${appointmentId || Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (window.location.pathname !== "/dashboard" && window.location.pathname !== "/admin") {
        window.location.href = "/dashboard";
      }
    };

    return true;
  } catch (error) {
    console.warn("Failed to display native browser notification:", error);
    return false;
  }
}

/**
 * Main Helper Function: Scans appointments and triggers 24-hour proactive reminders
 * 
 * @param appointments Array of appointments to check
 * @param options Configuration options for the reminder window and behavior
 * @returns ReminderResult summary
 */
export async function checkAndTrigger24hReminders(
  appointments: ReminderAppointment[],
  options: ReminderOptions = {}
): Promise<ReminderResult> {
  const {
    windowStartHours = 16, // Starts alerting from ~16-30h ahead
    windowEndHours = 32,
    forceTrigger = false,
    enableSound = true,
    updateFirestore = true,
    notifyStaffRole = true,
    onTrigger,
  } = options;

  const result: ReminderResult = {
    checkedCount: appointments.length,
    triggeredCount: 0,
    appointments: [],
    messages: [],
  };

  if (!appointments || appointments.length === 0) {
    return result;
  }

  for (const app of appointments) {
    // Skip cancelled appointments
    if (app.status === "cancelled") continue;

    const { targetDate, hoursUntil } = getTimeUntilAppointment(app);
    if (!targetDate) continue;

    // Check if appointment falls within the ~24-hour reminder window (e.g., 16h to 32h)
    const isIn24HourWindow = hoursUntil >= windowStartHours && hoursUntil <= windowEndHours;
    
    // Also support same-day urgent alerts if explicitly forced or close
    const isImminent = forceTrigger ? hoursUntil > 0 && hoursUntil <= 48 : isIn24HourWindow;

    if (!isImminent) continue;

    // Check deduplication unless forced
    if (!forceTrigger && hasReminderBeenSent(app.id)) {
      continue;
    }

    // Build rich notification text
    const isHomeService = app.serviceType === "home";
    const serviceName = app.service || "Salon Service";
    const clientName = app.name || "Valued Client";
    const formattedDate = format(targetDate, "EEE, MMM d");
    const formattedTime = app.time || format(targetDate, "h:mm a");
    const timeUntilStr = `in ~${Math.round(hoursUntil)} hours (${formattedDate} at ${formattedTime})`;

    const title = isHomeService 
      ? `🏠 24h Reminder: At-Home Visit for ${clientName}`
      : `✂️ 24h Reminder: ${clientName} - ${serviceName}`;

    const body = isHomeService
      ? `Scheduled ${timeUntilStr}. Destination: ${app.deliveryAddress?.fullAddress || app.address || "Client Address"}. Staff prep required.`
      : `Appointment for ${serviceName} is scheduled ${timeUntilStr} at Aurelia Luxe salon.`;

    // 1. Dispatch Native Browser Notification
    triggerBrowserNotification(title, body, app.id);

    // 2. Dispatch Rich In-App Toast Alert (Sonner)
    toast.info(title, {
      description: body,
      duration: 8000,
      action: {
        label: isHomeService ? "View Route & Prep" : "View Booking",
        onClick: () => {
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = isHomeService ? "/admin/home-services" : "/admin";
          } else {
            window.location.href = "/dashboard";
          }
        },
      },
    });

    // 3. Play subtle sound chime
    if (enableSound) {
      playReminderChime();
    }

    // 4. Record deduplication in localStorage
    recordReminderSent(app.id);

    // 5. Update Firestore appointment record with reminder timestamp
    if (updateFirestore && app.id) {
      try {
        await updateDoc(doc(db, "customers", app.id), {
          reminder24hSent: true,
          reminder24hSentAt: serverTimestamp(),
          lastReminderHoursRemaining: hoursUntil,
        });
      } catch (err) {
        console.warn("Could not write reminder flag to Firestore:", err);
      }
    }

    // 6. Log system notification in Firestore notifications collection
    if (notifyStaffRole) {
      try {
        await addDoc(collection(db, "notifications"), {
          title: `24h Appointment Reminder: ${clientName}`,
          message: `${clientName} has an upcoming appointment for "${serviceName}" scheduled ${timeUntilStr}.${isHomeService ? ` Address: ${app.deliveryAddress?.fullAddress || app.address}` : ""}`,
          type: "appointment_24h_reminder",
          appointmentId: app.id,
          serviceType: app.serviceType || "salon",
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Could not create Firestore notification log:", err);
      }
    }

    // 7. Fire custom callback
    if (onTrigger) {
      onTrigger(app, hoursUntil);
    }

    result.triggeredCount++;
    result.appointments.push(app);
    result.messages.push(`Alerted 24h reminder for ${clientName} (${serviceName})`);
  }

  return result;
}

/**
 * Filter list of appointments to find those scheduled in the next 24-36 hours
 */
export function getUpcoming24HourAppointments(appointments: ReminderAppointment[]): {
  appointment: ReminderAppointment;
  targetDate: Date;
  hoursUntil: number;
}[] {
  const list: { appointment: ReminderAppointment; targetDate: Date; hoursUntil: number }[] = [];

  for (const app of appointments) {
    if (app.status === "cancelled") continue;
    const { targetDate, hoursUntil } = getTimeUntilAppointment(app);
    if (targetDate && hoursUntil > 0 && hoursUntil <= 36) {
      list.push({ appointment: app, targetDate, hoursUntil });
    }
  }

  return list.sort((a, b) => a.hoursUntil - b.hoursUntil);
}
