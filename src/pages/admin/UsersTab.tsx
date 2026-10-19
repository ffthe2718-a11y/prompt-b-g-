import { useCallback, useEffect, useState } from "react";
import type { AdminUser, UserRole, UserStatus } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import {
  BadgeCheck,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | UserStatus;

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "owner", label: "Owners" },
  { id: "super_admin", label: "Super admins" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersTab({ onChanged }: { onChanged: () => void }) {
  const { user: me, setUserFromServer } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search: string, roleFilter: string, statusFilter: string) => {
    try {
      const data = await adminApi.users(search, roleFilter, statusFilter);
      setUsers(data.users);
    } catch (error: any) {
      toast.error(error?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query.trim(), role, status), 300);
    return () => window.clearTimeout(timer);
  }, [query, role, status, load]);

  const apply = async (target: AdminUser, patch: { role?: UserRole; status?: UserStatus }) => {
    setBusyId(target.id);
    try {
      const result = await adminApi.updateUser(target.id, patch);
      setUsers((current) => current.map((item) => (item.id === target.id ? result.user : item)));
      if (result.session && me?.id === target.id) setUserFromServer(result.session);
      if (patch.role) toast.success(`${target.name} is now ${patch.role === "super_admin" ? "a super admin" : "a salon owner"}.`);
      if (patch.status) toast.success(`${target.name} was ${patch.status === "suspended" ? "suspended" : "reactivated"}.`);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this account.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (target: AdminUser) => {
    const confirmation = window.prompt(
      `This permanently deletes ${target.name} (${target.email})${target.salon ? ` and their salon "${target.salon.name}"` : ""}.\n\nType the email address to confirm.`
    );
    if (confirmation === null) return;
    if (confirmation.trim().toLowerCase() !== target.email.toLowerCase()) {
      toast.error("The email didn't match, so nothing was deleted.");
      return;
    }
    setBusyId(target.id);
    try {
      await adminApi.deleteUser(target.id);
      setUsers((current) => current.filter((item) => item.id !== target.id));
      toast.success(`${target.name} was deleted.`);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete this account.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Accounts & access</p>
          <h1 className="mt-1.5 font-serif text-2xl text-foreground">Who can do what.</h1>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
            Salon owners only ever see their own salon. Super admins manage the platform. Visitors never need an
            account to browse published salon websites.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex rounded-xl border border-border p-0.5">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setRole(filter.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors",
                  role === filter.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
              className="h-9 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-[11px] text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "suspended"] as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors",
              status === filter
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {filter === "all" ? "Any status" : filter}
          </button>
        ))}
        <span className="ml-auto text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
          {users.length} account{users.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading accounts</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground">No accounts match this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Account", "Role", "Status", "Sign-in", "Salon", "Joined", "Last seen", "Actions"].map((label) => (
                    <th key={label} className="px-4 py-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((account) => {
                  const isSelf = me?.id === account.id;
                  const busy = busyId === account.id;
                  return (
                    <tr key={account.id} className="hover:bg-background/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-8 w-8 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-serif text-[10px] text-primary">
                              {initials(account.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-[11px] font-medium text-foreground">
                              {account.name}
                              {isSelf && (
                                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-primary">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[8px] text-muted-foreground">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={account.role}
                          disabled={busy || isSelf}
                          onChange={(event) => void apply(account, { role: event.target.value as UserRole })}
                          className="h-7 rounded-lg border border-border bg-background px-2 text-[9px] text-foreground outline-none focus:border-primary disabled:opacity-60"
                        >
                          <option value="owner">Salon owner</option>
                          <option value="super_admin">Super admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em]",
                            account.status === "active"
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                              : "border-red-500/25 bg-red-500/10 text-red-400"
                          )}
                        >
                          {account.status === "active" ? (
                            <BadgeCheck className="h-2.5 w-2.5" />
                          ) : (
                            <ShieldOff className="h-2.5 w-2.5" />
                          )}
                          {account.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                          {account.provider === "google" ? (
                            <>
                              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[7px] font-bold text-foreground">
                                G
                              </span>
                              Google
                            </>
                          ) : (
                            <>
                              <Mail className="h-3 w-3" /> Email
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {account.salon ? (
                          <a
                            href={`/${account.salon.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-foreground hover:text-primary"
                          >
                            {account.salon.name}
                            <span className="block text-[7px] uppercase tracking-[0.1em] text-muted-foreground">
                              {account.salon.status}
                            </span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">No salon yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[9px] text-muted-foreground">{formatDate(account.createdAt)}</td>
                      <td className="px-4 py-3 text-[9px] text-muted-foreground">{formatDate(account.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              void apply(account, { status: account.status === "active" ? "suspended" : "active" })
                            }
                            disabled={busy || isSelf}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] disabled:opacity-50",
                              account.status === "active"
                                ? "border-amber-500/30 text-amber-400"
                                : "border-emerald-500/30 text-emerald-400"
                            )}
                          >
                            {account.status === "active" ? (
                              <>
                                <ShieldOff className="h-2.5 w-2.5" /> Suspend
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-2.5 w-2.5" /> Activate
                              </>
                            )}
                          </button>
                          {account.role !== "super_admin" && (
                            <button
                              onClick={() => void apply(account, { role: "super_admin" })}
                              disabled={busy}
                              className="rounded-md border border-primary/30 p-1.5 text-primary/80 hover:text-primary disabled:opacity-50"
                              aria-label="Make super admin"
                              title="Make super admin"
                            >
                              <UserCog className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => void remove(account)}
                            disabled={busy || isSelf}
                            className="rounded-md border border-red-500/25 p-1.5 text-red-400/80 hover:text-red-400 disabled:opacity-50"
                            aria-label="Delete account"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[8px] leading-relaxed text-muted-foreground/60">
        Suspended accounts are signed out of their next request and cannot sign in. You can't demote, suspend or delete
        your own account, and the platform always keeps at least one super admin.
      </p>
    </div>
  );
}
