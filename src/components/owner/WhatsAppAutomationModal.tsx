import { useEffect, useState } from "react";
import { MessageSquare, Check, Sparkles, Send, Clock, Phone, AlertCircle, RefreshCw, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { salonApi } from "@/lib/api";
import { Modal, SavingButton } from "@/components/dashboard/ui";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatsAppAutomationModalProps {
  open: boolean;
  onClose: () => void;
  salonName: string;
}

export default function WhatsAppAutomationModal({ open, onClose, salonName }: WhatsAppAutomationModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [leadHours, setLeadHours] = useState(2);
  const [customTemplate, setCustomTemplate] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  // Test message state
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string; waUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    salonApi
      .getWhatsAppSettings()
      .then((data) => {
        setEnabled(data.enabled);
        setLeadHours(data.leadHours || 2);
        setCustomTemplate(data.customTemplate || "");
        setLogs(data.logs || []);
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to load WhatsApp settings");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await salonApi.updateWhatsAppSettings({
        enabled,
        leadHours,
        customTemplate,
      });
      setEnabled(res.enabled);
      setLeadHours(res.leadHours);
      setCustomTemplate(res.customTemplate);
      toast.success("WhatsApp 2-hour reminder settings saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a valid recipient phone number.");
      return;
    }
    setTestSending(true);
    try {
      const res = await salonApi.testWhatsAppMessage(testPhone);
      setTestResult({ message: res.message, waUrl: res.waUrl });
      toast.success("Test WhatsApp reminder generated!");
      // Reload logs
      const updatedData = await salonApi.getWhatsAppSettings();
      setLogs(updatedData.logs || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test message");
    } finally {
      setTestSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Live preview formatting
  const livePreview = customTemplate.trim()
    ? customTemplate
        .replace(/{customer_name}/g, "Sophia Bennett")
        .replace(/{salon_name}/g, salonName || "Velvet Studio")
        .replace(/{service_name}/g, "Balayage & Styling")
        .replace(/{staff_name}/g, "Emma Watson")
        .replace(/{date}/g, "Today")
        .replace(/{time}/g, "14:00")
        .replace(/{phone}/g, "+1 (555) 234-5678")
    : `✨ *Appointment Reminder — ${salonName || "Velvet Studio"}*\n\nHello *Sophia Bennett*, your appointment is coming up in *${leadHours} hours*!\n\n📋 *Service:* Balayage & Styling\n👤 *With:* Emma Watson\n📅 *Date:* Today\n⏰ *Time:* 14:00\n📍 *Location:* Main Street, Downtown\n\nNeed to reschedule? Call us at +1 (555) 234-5678.\n\nWe look forward to welcoming you soon! 💇‍♀️✨`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Automated WhatsApp Reminders"
      description="Automatically notify clients on WhatsApp 2 hours before their scheduled appointment time."
      wide
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" /> WhatsApp 2h worker active
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
            <SavingButton saving={saving} onClick={() => void handleSaveSettings()}>
              Save Settings
            </SavingButton>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Toggle Switch */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-foreground">Automated 2-Hour WhatsApp Reminders</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-extrabold uppercase text-emerald-300">
                  {enabled ? "Active" : "Paused"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                When enabled, the automated worker checks upcoming bookings every minute and dispatches a WhatsApp reminder 2 hours prior to start time.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Column 1: Settings & Custom Template */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
                  Reminder Lead Time
                </label>
                <select
                  value={leadHours}
                  onChange={(e) => setLeadHours(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  <option value={1}>1 Hour Before Appointment</option>
                  <option value={2}>2 Hours Before Appointment (Recommended)</option>
                  <option value={3}>3 Hours Before Appointment</option>
                  <option value={24}>24 Hours Before Appointment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
                    Custom Template (Optional)
                  </label>
                  {customTemplate && (
                    <button
                      type="button"
                      onClick={() => setCustomTemplate("")}
                      className="text-[9px] text-muted-foreground hover:text-foreground"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <textarea
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  placeholder="Enter custom template using placeholders..."
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                  <span>Available placeholders:</span>
                  {["{customer_name}", "{service_name}", "{staff_name}", "{date}", "{time}", "{phone}"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCustomTemplate((prev) => `${prev} ${tag}`)}
                      className="rounded bg-card border border-border px-1.5 py-0.5 font-mono hover:text-foreground"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Message Box */}
              <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Send className="h-3.5 w-3.5 text-primary" />
                  <span>Send Test WhatsApp Message</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1 555 123 4567 or 919876543210"
                    className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendTest()}
                    disabled={testSending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50"
                  >
                    {testSending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Test
                  </button>
                </div>

                {testResult && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Test Reminder Generated!
                      </span>
                      <a
                        href={testResult.waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 hover:underline"
                      >
                        Open WhatsApp <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Live WhatsApp UI Simulator */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground flex items-center justify-between">
                <span>WhatsApp Client Preview</span>
                <span className="text-emerald-400 font-normal normal-case">Live message output</span>
              </label>

              {/* Chat Bubble Frame */}
              <div className="rounded-2xl border border-border bg-[#0B141A] p-4 shadow-2xl min-h-[280px] flex flex-col justify-between">
                {/* Chat Top Bar */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                    {salonName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{salonName}</h4>
                    <span className="text-[9px] text-emerald-400">WhatsApp Business Verified</span>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="my-4 self-start max-w-[90%] rounded-xl bg-[#202C33] p-3 text-xs leading-relaxed text-white shadow font-sans whitespace-pre-wrap">
                  {livePreview}
                  <div className="mt-2 text-right text-[9px] text-white/50 flex items-center justify-end gap-1">
                    <span>12:00 PM</span>
                    <span className="text-emerald-400">✓✓</span>
                  </div>
                </div>

                {/* Bottom Quick Copy button */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(livePreview)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 hover:bg-white/10"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied Message" : "Copy Message Text"}
                </button>
              </div>
            </div>
          </div>

          {/* Logs History Table */}
          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" /> WhatsApp Reminders Dispatch History
              </h3>
              <span className="text-[10px] text-muted-foreground">{logs.length} recent dispatches</span>
            </div>

            {logs.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card/40">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-card text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Service & Time</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Sent At</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-card/80 transition-colors">
                        <td className="p-2.5 font-sans font-medium text-foreground">{log.customerName}</td>
                        <td className="p-2.5 text-muted-foreground">{log.customerPhone}</td>
                        <td className="p-2.5 font-sans">
                          <span className="text-foreground">{log.serviceName}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            ({log.appointmentDate} at {log.appointmentTime})
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                              log.status === "delivered" || log.status === "sent"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400"
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[10px] text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-2.5 text-right">
                          <a
                            href={log.waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[9px] font-sans font-semibold text-primary hover:border-primary"
                          >
                            WhatsApp <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-4 text-center text-xs italic text-muted-foreground rounded-xl border border-dashed border-border bg-card/20">
                No WhatsApp reminders dispatched yet. Upcoming appointments will be processed automatically 2 hours prior to start time.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
