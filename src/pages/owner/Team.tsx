import { useMemo, useState } from "react";
import type { Salon, StaffMember } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Mail, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ImageField from "@/components/common/ImageField";
import {
  EmptyState,
  Field,
  Modal,
  Panel,
  SavingButton,
  SectionHeading,
  inputClass,
  textareaClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

type StaffDraft = {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  specialties: string;
  experienceYears: string;
  isActive: boolean;
};

const blankDraft: StaffDraft = {
  name: "",
  role: "",
  bio: "",
  imageUrl: "",
  specialties: "",
  experienceYears: "",
  isActive: true,
};

export default function Team({ salon, refresh }: { salon: Salon; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [draft, setDraft] = useState<StaffDraft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const staff = useMemo(() => [...salon.staff].sort((a, b) => a.sortOrder - b.sortOrder), [salon.staff]);

  const openCreate = () => {
    setEditing(null);
    setDraft(blankDraft);
    setOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setDraft({
      name: member.name,
      role: member.role,
      bio: member.bio,
      imageUrl: member.imageUrl,
      specialties: member.specialties.join(", "),
      experienceYears: member.experienceYears ? String(member.experienceYears) : "",
      isActive: member.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!draft.name.trim()) {
      toast.error("Enter your team member's name.");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      role: draft.role.trim(),
      bio: draft.bio.trim(),
      imageUrl: draft.imageUrl.trim(),
      specialties: draft.specialties
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      experienceYears: Math.max(0, Number(draft.experienceYears) || 0),
      isActive: draft.isActive,
    };
    setSaving(true);
    try {
      if (editing) {
        await salonApi.updateStaff(editing.id, payload);
        toast.success("Team member updated.");
      } else {
        await salonApi.createStaff(payload);
        toast.success("Team member added.");
      }
      await refresh();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save this team member.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member: StaffMember, active: boolean) => {
    setPendingId(member.id);
    try {
      await salonApi.updateStaff(member.id, { isActive: active });
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this team member.");
    } finally {
      setPendingId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= staff.length) return;
    const next = [...staff];
    [next[index], next[target]] = [next[target], next[index]];
    setPendingId(staff[index].id);
    try {
      await Promise.all(next.map((member, sortOrder) => salonApi.updateStaff(member.id, { sortOrder })));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not reorder the team.");
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await salonApi.deleteStaff(deleting.id);
      toast.success("Team member removed.");
      setDeleting(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove this team member.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Your team"
          description="Introduce the people behind the chair. Team members can be selected when clients book, and their names appear in booking notifications."
          action={
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add team member
            </button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3 w-3 text-primary" /> {staff.length} member{staff.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3 w-3 text-primary" /> {staff.filter((member) => member.isActive).length} accepting bookings
          </span>
        </div>
      </Panel>

      {staff.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Add the people who make it happen"
          description="Clients love booking with a specific stylist. Add your team so they can choose who looks after them — or hide a member while they are away."
          action={
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
            >
              <Plus className="h-3.5 w-3.5" /> Add team member
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member, index) => (
            <div
              key={member.id}
              className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/50 transition-colors hover:border-primary/30",
                !member.isActive && "opacity-60"
              )}
            >
              <div className="relative h-36 bg-background">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <span className="font-serif text-3xl text-primary/70">{initials(member.name)}</span>
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    onClick={() => void move(index, -1)}
                    disabled={index === 0 || pendingId === member.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/80 backdrop-blur transition-colors hover:text-white disabled:opacity-25"
                    aria-label={`Move ${member.name} earlier`}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => void move(index, 1)}
                    disabled={index === staff.length - 1 || pendingId === member.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/80 backdrop-blur transition-colors hover:text-white disabled:opacity-25"
                    aria-label={`Move ${member.name} later`}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-foreground">{member.name}</p>
                    <p className="truncate text-[9px] uppercase tracking-[0.12em] text-primary">{member.role || "Team member"}</p>
                  </div>
                  <Switch
                    checked={member.isActive}
                    disabled={pendingId === member.id}
                    onCheckedChange={(checked) => void toggleActive(member, Boolean(checked))}
                    size="sm"
                  />
                </div>

                {member.bio && (
                  <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">{member.bio}</p>
                )}

                {member.specialties.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {member.specialties.slice(0, 4).map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-border px-2 py-0.5 text-[7px] uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                    {member.experienceYears > 0 ? `${member.experienceYears} yrs experience` : member.isActive ? "Bookable" : "Hidden"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(member)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      aria-label={`Edit ${member.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeleting(member)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit team member" : "Add a team member"}
        description="A friendly photo and a line about their craft helps clients choose with confidence."
        wide
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={saving} onClick={() => void submit()}>
              {editing ? "Save changes" : "Add to team"}
            </SavingButton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <ImageField
            label="Photo"
            value={draft.imageUrl}
            onChange={(url) => setDraft({ ...draft, imageUrl: url })}
            aspect="aspect-[4/5]"
            rounded="2xl"
            description="A portrait works best."
          />
          <div className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Anaya Sharma"
                  className={inputClass}
                  autoFocus
                />
              </Field>
              <Field label="Role">
                <input
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                  placeholder="Senior stylist"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Specialties" hint="Separate with commas.">
                <input
                  value={draft.specialties}
                  onChange={(event) => setDraft({ ...draft, specialties: event.target.value })}
                  placeholder="Balayage, Bridal"
                  className={inputClass}
                />
              </Field>
              <Field label="Years of experience">
                <input
                  value={draft.experienceYears}
                  onChange={(event) => setDraft({ ...draft, experienceYears: event.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="8"
                  inputMode="numeric"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Short bio">
              <textarea
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                placeholder="Ten years of colour work, a calm chair, and a genuine love for helping you feel like yourself."
                className={cn(textareaClass, "min-h-20")}
              />
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
              <span className="text-[10px] text-foreground">Accepting bookings</span>
              <Switch
                checked={draft.isActive}
                onCheckedChange={(checked) => setDraft({ ...draft, isActive: Boolean(checked) })}
                size="sm"
              />
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this team member?"
        description="They will no longer appear on your website or in the booking form. Past bookings are kept."
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Keep member
            </button>
            <SavingButton saving={deleteBusy} onClick={() => void confirmDelete()} className="bg-red-500 text-white hover:bg-red-500/90">
              Remove member
            </SavingButton>
          </>
        }
      >
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Remove <span className="font-medium text-foreground">{deleting?.name}</span> from your team? If they are only
          away for a while, switch off “Accepting bookings” instead.
        </p>
      </Modal>

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/30 p-3.5 text-[9px] leading-relaxed text-muted-foreground">
        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Booking notifications go to your salon contact email. Each appointment records the chosen team member so you can
        route it to the right chair.
      </div>
    </div>
  );
}
