import { useMemo, useState } from "react";
import type { GalleryImage, Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import ImageField from "@/components/common/ImageField";
import {
  EmptyState,
  Field,
  Modal,
  Panel,
  SavingButton,
  SectionHeading,
  inputClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export default function Gallery({ salon, refresh }: { salon: Salon; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GalleryImage | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const images = useMemo(() => [...salon.gallery].sort((a, b) => a.sortOrder - b.sortOrder), [salon.gallery]);

  const openCreate = () => {
    setEditing(null);
    setImageUrl("");
    setCaption("");
    setOpen(true);
  };

  const openEdit = (image: GalleryImage) => {
    setEditing(image);
    setImageUrl(image.imageUrl);
    setCaption(image.caption);
    setOpen(true);
  };

  const submit = async () => {
    if (!imageUrl.trim()) {
      toast.error("Add a photo first.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await salonApi.updateGalleryImage(editing.id, { imageUrl: imageUrl.trim(), caption: caption.trim() });
        toast.success("Photo updated.");
      } else {
        await salonApi.createGalleryImage({ imageUrl: imageUrl.trim(), caption: caption.trim() });
        toast.success("Photo added to your gallery.");
      }
      await refresh();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save the photo.");
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setPendingId(images[index].id);
    try {
      await salonApi.reorderGallery(next.map((image) => image.id));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not reorder your gallery.");
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await salonApi.deleteGalleryImage(deleting.id);
      toast.success("Photo removed.");
      setDeleting(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove the photo.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Gallery"
          description="Show the work. A tight edit of six to twelve strong images — your best cuts, colour, interiors and details — converts better than a huge album."
          action={
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add photo
            </button>
          }
        />
        <p className="mt-3 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {images.length} photo{images.length === 1 ? "" : "s"} · landscape images look best
        </p>
      </Panel>

      {images.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-5 w-5" />}
          title="Your gallery is waiting"
          description="Upload a few images of your space and your best work. Clients will see them in a full-screen gallery on your website."
          action={
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
            >
              <Plus className="h-3.5 w-3.5" /> Add your first photo
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-border bg-card",
                pendingId === image.id && "opacity-50"
              )}
            >
              <div className="aspect-[4/3] overflow-hidden bg-background">
                <img
                  src={image.imageUrl}
                  alt={image.caption || `Gallery image ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    onClick={() => void move(index, -1)}
                    disabled={index === 0 || pendingId === image.id}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur hover:text-white disabled:opacity-30"
                    aria-label="Move photo earlier"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => void move(index, 1)}
                    disabled={index === images.length - 1 || pendingId === image.id}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur hover:text-white disabled:opacity-30"
                    aria-label="Move photo later"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(image)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur hover:text-white"
                    aria-label="Edit photo"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleting(image)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur hover:text-red-300"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="truncate border-t border-border px-2.5 py-2 text-[8px] text-muted-foreground">
                {image.caption || "No caption"}
              </p>
            </div>
          ))}
          <button
            onClick={openCreate}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[8px] font-bold uppercase tracking-[0.14em]">Add photo</span>
          </button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit photo" : "Add a photo"}
        description="Upload from your device or paste an image link. Captions are read by screen readers and search engines."
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={saving} onClick={() => void submit()}>
              {editing ? "Save photo" : "Add to gallery"}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-4">
          <ImageField
            label="Photo"
            value={imageUrl}
            onChange={setImageUrl}
            aspect="aspect-[4/3]"
            rounded="2xl"
            description="JPG, PNG or WebP. Landscape crop recommended."
          />
          <Field label="Caption" hint="Optional. Describe the look or the space.">
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Soft balayage in warm caramel"
              className={inputClass}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this photo?"
        description="It will disappear from your public gallery immediately. The uploaded file stays available for re-use."
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Keep photo
            </button>
            <SavingButton saving={deleteBusy} onClick={() => void confirmDelete()} className="bg-red-500 text-white hover:bg-red-500/90">
              Remove photo
            </SavingButton>
          </>
        }
      >
        {deleting && (
          <div className="overflow-hidden rounded-xl border border-border">
            <img src={deleting.imageUrl} alt={deleting.caption || "Selected photo"} className="max-h-48 w-full object-cover" />
            {deleting.caption && <p className="px-3 py-2 text-[9px] text-muted-foreground">{deleting.caption}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
