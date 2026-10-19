import { useEffect, useState } from "react";
import type { Salon } from "@/types/salon";
import { authApi, salonApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { slugify } from "@/lib/salonUi";
import { toast } from "sonner";
import {
  AtSign,
  BadgeCheck,
  Check,
  CreditCard,
  Globe2,
  KeyRound,
  Loader2,
  Lock,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  Field,
  Panel,
  SavingButton,
  SectionHeading,
  StatusBadge,
  inputClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export const PLAN_DETAILS = {
  launch: {
    name: "Launch",
    price: 0,
    features: [
      "Public website with unique address",
      "Up to 5 services",
      "Online booking requests",
      "Gallery and reviews",
    ],
  },
  studio: {
    name: "Studio",
    price: 1499,
    features: [
      "Unlimited services and team members",
      "Custom domain support",
      "Booking analytics",
      "Review replies",
    ],
  },
  atelier: {
    name: "Atelier",
    price: 2999,
    features: ["Everything in Studio", "Priority support", "Advanced analytics", "Early access to new features"],
  },
} as const;

export default function Settings({
  salon,
  refresh,
  onPublish,
  publishing,
}: {
  salon: Salon;
  refresh: () => Promise<void>;
  onPublish: () => Promise<void>;
  publishing: boolean;
}) {
  const { user, refresh: refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [slug, setSlug] = useState(salon.slug);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugReason, setSlugReason] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);

  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  useEffect(() => {
    setSlug(salon.slug);
    setSlugState("idle");
  }, [salon.slug]);

  const siteUrl = typeof window !== "undefined" ? `${window.location.origin}/${salon.slug}` : `/${salon.slug}`;

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error("Your name cannot be empty.");
      return;
    }
    setProfileSaving(true);
    const nextEmail = email.trim().toLowerCase();
    const emailChanged = Boolean(user?.email) && user!.email.toLowerCase() !== nextEmail;
    try {
      await authApi.updateProfile({ name: name.trim(), email: nextEmail });
      await refreshUser();
      if (emailChanged) {
        toast.success("Email updated. Confirm the new address to keep publishing.", {
          description: "We sent a verification link to the new address. Submitting and publishing are paused until it is confirmed.",
        });
      } else {
        toast.success("Account details updated.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Could not update your account.");
    } finally {
      setProfileSaving(false);
    }
  };

  const hasPassword = user?.hasPassword !== false;

  const savePassword = async () => {
    if (hasPassword && !currentPassword) {
      toast.error("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      if (hasPassword) {
        await authApi.updateProfile({ currentPassword, newPassword });
      } else {
        await authApi.setPassword({ newPassword });
      }
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (error: any) {
      toast.error(error?.message || "Could not change your password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const checkSlug = async (value: string) => {
    const candidate = slugify(value);
    if (!candidate) {
      setSlugState("invalid");
      setSlugReason("Use letters and numbers.");
      return;
    }
    if (candidate === salon.slug) {
      setSlugState("idle");
      setSlugReason("");
      return;
    }
    setSlugState("checking");
    try {
      const result = await salonApi.slugAvailable(candidate);
      setSlugState(result.available ? "available" : "taken");
      setSlugReason(result.reason || (result.available ? "Available" : "That address is already in use."));
    } catch (error: any) {
      setSlugState("invalid");
      setSlugReason(error?.message || "Could not check this address.");
    }
  };

  const saveSlug = async () => {
    const candidate = slugify(slug);
    if (candidate === salon.slug) {
      toast.error("That is already your current address.");
      return;
    }
    setSlugSaving(true);
    try {
      await salonApi.update({ slug: candidate });
      await refresh();
      setSlugState("idle");
      toast.success("Your website address has been updated.");
    } catch (error: any) {
      toast.error(error?.message || "Could not change your address.");
    } finally {
      setSlugSaving(false);
    }
  };

  const unfollow = async () => {
    setUnpublishing(true);
    try {
      await salonApi.unpublish();
      await refresh();
      setUnpublishOpen(false);
      toast.success("Your website is offline. You can publish again any time.");
    } catch (error: any) {
      toast.error(error?.message || "Could not unpublish your site.");
    } finally {
      setUnpublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Your account"
          description="How you sign in and how we reach you about your salon. Your email is never shown on the public website."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={name} onChange={(event) => setName(event.target.value)} className={cn(inputClass, "pl-9")} />
            </div>
          </Field>
          <Field label="Login email">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground">
            Member since{" "}
            {new Date(user?.createdAt || salon.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <SavingButton saving={profileSaving} onClick={() => void saveProfile()}>
            Save account
          </SavingButton>
        </div>
      </Panel>

      <Panel>
        <SectionHeading
          title="Website address"
          description="This is the unique path to your salon website. Changing it updates every link you have shared until now, so copy the new address after saving."
        />
        <div className="mt-4 rounded-xl border border-border bg-background/50 p-3">
          <div className="flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {typeof window !== "undefined" ? window.location.origin : ""}/
              <span className="text-foreground">{salon.slug}</span>
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Address" hint={slugReason || "Lowercase letters, numbers and dashes. 3–48 characters."}>
            <div className="flex items-center rounded-xl border border-border bg-background">
              <span className="pl-3 text-[10px] text-muted-foreground">/</span>
              <input
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugState("idle");
                }}
                onBlur={() => void checkSlug(slug)}
                className="h-10 w-full bg-transparent px-1.5 text-sm text-foreground outline-none"
              />
              <span className="pr-3">
                {slugState === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {slugState === "available" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                {slugState === "taken" && <Lock className="h-3.5 w-3.5 text-red-400" />}
              </span>
            </div>
          </Field>
          <div className="flex items-end">
            <SavingButton
              saving={slugSaving}
              onClick={() => void saveSlug()}
              disabled={slugify(slug) === salon.slug}
              className="w-full sm:w-auto"
            >
              Update address
            </SavingButton>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[9px]",
              slugState === "available"
                ? "text-emerald-400"
                : slugState === "taken" || slugState === "invalid"
                  ? "text-red-400"
                  : "text-muted-foreground"
            )}
          >
            {slugState === "available" && "Available."}
            {slugState === "taken" && "Taken — try a variation."}
            {slugState === "invalid" && "That address cannot be used."}
          </span>
          <span className="ml-auto font-mono text-[9px] text-muted-foreground/70">{siteUrl}</span>
        </div>
      </Panel>

      <Panel>
        <SectionHeading
          title={hasPassword ? "Password" : "Set a password"}
          description={
            hasPassword
              ? "If you signed up with a shared computer, change your password regularly."
              : "You sign in with Google. Add a password if you'd also like to sign in with your email address."
          }
        />
        <div className={cn("mt-4 grid gap-3", hasPassword ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {hasPassword ? (
            <Field label="Current password">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className={cn(inputClass, "pl-9")}
                />
              </div>
            </Field>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-[9px] leading-relaxed text-muted-foreground sm:col-span-2">
              <span className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-primary">
                <KeyRound className="h-3 w-3" /> Google account
              </span>
              Your email sign-in is disabled until you set a password. You can keep using Google in the meantime.
            </div>
          )}
          <Field label="New password">
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <SavingButton saving={passwordSaving} onClick={() => void savePassword()}>
            {hasPassword ? "Change password" : "Set password"}
          </SavingButton>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Plan" description="Your subscription and what is included." />
          <div className="mt-4 flex items-start justify-between rounded-xl border border-primary/25 bg-primary/[0.05] p-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3 w-3" /> {PLAN_DETAILS[salon.plan || "launch"].name} plan
              </p>
              <p className="mt-1 font-serif text-2xl text-foreground">
                {PLAN_DETAILS[salon.plan || "launch"].price === 0
                  ? "Free"
                  : `₹${PLAN_DETAILS[salon.plan || "launch"].price.toLocaleString("en-IN")}`}
                {PLAN_DETAILS[salon.plan || "launch"].price > 0 && (
                  <span className="text-[10px] font-sans text-muted-foreground"> /month</span>
                )}
              </p>
              <p className="mt-0.5 text-[9px] capitalize text-muted-foreground">
                {salon.subscriptionStatus === "active"
                  ? "Active"
                  : salon.subscriptionStatus === "trialing"
                    ? `Trial${salon.subscriptionRenewsAt ? ` ends ${new Date(salon.subscriptionRenewsAt).toLocaleDateString()}` : ""}`
                    : (salon.subscriptionStatus || "active").replace("_", " ")}
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-primary/60" />
          </div>
          <ul className="mt-4 space-y-1.5">
            {PLAN_DETAILS[salon.plan || "launch"].features.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[8px] leading-relaxed text-muted-foreground/60">
            Need a different plan? Contact support and we will move your salon over. No card is stored on this platform.
          </p>
        </Panel>

        <Panel>
          <SectionHeading title="Site status" description="Publish, take a break, or come back later." />
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/40 p-3.5">
            <div>
              <p className="text-[10px] font-medium text-foreground">Public website</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                {salon.status === "published" ? siteUrl : "Currently hidden from the directory and search engines."}
              </p>
            </div>
            <StatusBadge status={salon.status} />
          </div>

          <div className="mt-4 space-y-2">
            {salon.status === "published" ? (
              <>
                <button
                  onClick={() => setUnpublishOpen(true)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  Take website offline
                </button>
                <p className="text-[8px] leading-relaxed text-muted-foreground/60">
                  Taking your site offline hides your booking page immediately. Your data and draft stay safe.
                </p>
              </>
            ) : salon.canPublish ? (
              <SavingButton saving={publishing} onClick={() => void onPublish()} className="w-full">
                Publish website
              </SavingButton>
            ) : (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300">
                  {salon.approvalStatus === "pending" ? "Waiting for approval" : "Approval required"}
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
                  {salon.approvalStatus === "pending"
                    ? "A super admin is reviewing your website. Publishing unlocks as soon as it is approved."
                    : salon.approvalStatus === "approved"
                      ? "Your approval no longer covers the latest edits. Submit the changes from the website section."
                      : "Submit your website for review from the Website section. Only approved websites can go live."}
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeading title="Data & privacy" description="What lives where." />
        <div className="mt-4 space-y-2 text-[9px] leading-relaxed text-muted-foreground">
          <p className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Your salon data is stored separately from every other salon on the platform and is only accessible with
            your account login.
          </p>
          <p className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Client booking and review details are used only to run your salon. They are never shared with other
            businesses or used to build advertising audiences.
          </p>
        </div>
      </Panel>

      {unpublishOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setUnpublishOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={(event) => event.stopPropagation()}>
            <h3 className="font-serif text-xl text-foreground">Take your website offline?</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Visitors will see a “site not found” page and the booking form will stop accepting new appointments. Your
              content, services and client records remain intact.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setUnpublishOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Keep it live
              </button>
              <SavingButton saving={unpublishing} onClick={() => void unfollow()} className="bg-red-500 text-white hover:bg-red-500/90">
                Take offline
              </SavingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
