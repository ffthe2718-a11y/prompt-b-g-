import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings2,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import type { AdminStats, AuditEntry } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "@/components/platform/Brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import OverviewTab from "@/pages/admin/OverviewTab";
import SalonsTab from "@/pages/admin/SalonsTab";
import UsersTab from "@/pages/admin/UsersTab";
import SubscriptionsTab from "@/pages/admin/SubscriptionsTab";
import SettingsTab from "@/pages/admin/SettingsTab";
import ApprovalsTab from "@/pages/admin/ApprovalsTab";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "salons", label: "Salons", icon: Store },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [statsData, auditData] = await Promise.all([adminApi.stats(), adminApi.audit(12)]);
      setStats(statsData);
      setAudit(auditData.entries);
    } catch (error: any) {
      toast.error(error?.message || "Could not load platform data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep dashboard summaries fresh after actions in child tabs.
  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Link to="/">
              <BrandMark compact />
            </Link>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-primary sm:flex">
              <BookOpen className="h-3 w-3" /> Super admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[9px] text-muted-foreground sm:block">{user?.email}</span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto pb-0">
            {TABS.map((entry) => {
              const Icon = entry.icon;
              const active = tab === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setTab(entry.id)}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3 w-3", active ? "text-primary" : "text-muted-foreground/70")} />
                  {entry.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading platform</span>
          </div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {tab === "overview" && <OverviewTab stats={stats} audit={audit} onRefresh={refresh} />}
            {tab === "approvals" && <ApprovalsTab onChanged={refresh} />}
            {tab === "salons" && <SalonsTab onChanged={refresh} onReview={() => setTab("approvals")} />}
            {tab === "users" && <UsersTab onChanged={refresh} />}
            {tab === "subscriptions" && <SubscriptionsTab onChanged={refresh} />}
            {tab === "settings" && <SettingsTab onChanged={refresh} />}
          </motion.div>
        )}

        <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-4 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/50">
          <span className="inline-flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Super admins can manage every user, salon, plan and setting
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> Actions are recorded in the audit log
          </span>
        </p>
      </main>
    </div>
  );
}
