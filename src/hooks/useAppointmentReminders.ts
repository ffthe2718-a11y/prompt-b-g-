import { useState, useEffect, useCallback, useRef } from "react";
import { 
  checkAndTrigger24hReminders, 
  requestBrowserNotificationPermission, 
  getBrowserNotificationPermission,
  getUpcoming24HourAppointments,
  ReminderAppointment,
  ReminderOptions,
  ReminderResult 
} from "@/lib/reminderUtils";
import { toast } from "sonner";

export interface UseAppointmentRemindersOptions extends ReminderOptions {
  autoCheckIntervalMs?: number; // default: 15 minutes (900,000 ms)
  enabled?: boolean;
}

export function useAppointmentReminders(
  appointments: ReminderAppointment[],
  options: UseAppointmentRemindersOptions = {}
) {
  const { 
    autoCheckIntervalMs = 15 * 60 * 1000, 
    enabled = true,
    ...reminderOptions 
  } = options;

  const [permission, setPermission] = useState<NotificationPermission>(getBrowserNotificationPermission());
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [upcoming24hAppointments, setUpcoming24hAppointments] = useState<
    { appointment: ReminderAppointment; targetDate: Date; hoursUntil: number }[]
  >([]);

  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  const reminderOptionsRef = useRef(reminderOptions);
  reminderOptionsRef.current = reminderOptions;

  // Update upcoming list whenever appointments update
  useEffect(() => {
    const upcoming = getUpcoming24HourAppointments(appointments);
    setUpcoming24hAppointments(upcoming);
  }, [appointments]);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermission(perm);
    return perm;
  }, []);

  // Trigger check manually or automatically
  const triggerCheck = useCallback(async (customOptions?: ReminderOptions): Promise<ReminderResult> => {
    setIsChecking(true);
    try {
      const mergedOptions = { ...reminderOptionsRef.current, ...customOptions };
      const res = await checkAndTrigger24hReminders(appointmentsRef.current, mergedOptions);
      setLastCheckTime(new Date());

      if (customOptions?.forceTrigger && res.triggeredCount === 0) {
        toast.info("No client appointments found scheduled in the 24-hour window.");
      } else if (customOptions?.forceTrigger && res.triggeredCount > 0) {
        toast.success(`Dispatched ${res.triggeredCount} proactive 24h appointment reminder(s)!`);
      }

      return res;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Periodic automatic check in background
  useEffect(() => {
    if (!enabled || !appointments || appointments.length === 0) return;

    // Run initial check after a slight delay to let app load
    const initialTimer = setTimeout(() => {
      triggerCheck();
    }, 2000);

    // Set recurring interval
    const interval = setInterval(() => {
      triggerCheck();
    }, autoCheckIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, autoCheckIntervalMs, triggerCheck]);

  return {
    permission,
    requestPermission,
    triggerCheck,
    isChecking,
    lastCheckTime,
    upcoming24hAppointments,
    upcoming24hCount: upcoming24hAppointments.length,
  };
}
