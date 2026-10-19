import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Link2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_MB = 6;

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  aspect?: string;
  rounded?: "lg" | "full" | "2xl";
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}

export default function ImageField({
  label,
  value,
  onChange,
  description,
  aspect = "aspect-[16/9]",
  rounded = "2xl",
  disabled = false,
  disabledHint,
  className,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);

  useEffect(() => {
    setUrlDraft(value);
  }, [value]);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Images must be smaller than ${MAX_MB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadApi.image(file);
      onChange(url);
      toast.success("Image uploaded.");
    } catch (error: any) {
      toast.error(error?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
        <span className="text-[9px] text-muted-foreground/60">JPG, PNG, WebP · {MAX_MB}MB</span>
      </div>

      <div
        className={cn(
          "group relative flex w-full items-center justify-center overflow-hidden border border-dashed bg-background/60 transition-colors",
          aspect,
          rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : "rounded-2xl",
          dragging ? "border-primary bg-primary/5" : "border-border",
          disabled && "opacity-60"
        )}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className={cn(
              "h-full w-full object-cover",
              rounded === "full" && "rounded-full p-1"
            )}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {disabled ? disabledHint || "Save your salon first." : "Drop an image or choose a file"}
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em]">Uploading</span>
          </div>
        )}

        {value && !uploading && (
          <div className="absolute inset-x-2 bottom-2 flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="h-7 rounded-full bg-black/70 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md hover:bg-black"
            >
              <Upload className="h-3 w-3" /> Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange("")}
              disabled={disabled}
              className="h-7 rounded-full border-white/20 bg-black/70 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md hover:bg-black"
            >
              <X className="h-3 w-3" /> Remove
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="h-8 rounded-lg border-border px-3 text-[9px] font-bold uppercase tracking-[0.14em]"
        >
          <Upload className="h-3 w-3" /> Upload
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrl((value) => !value)}
          disabled={disabled}
          className="h-8 rounded-lg px-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
        >
          <Link2 className="h-3 w-3" /> Use link
        </Button>
        {description && <span className="text-[9px] text-muted-foreground/60">{description}</span>}
      </div>

      {showUrl && (
        <div className="flex gap-2">
          <Input
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="https://images.example.com/photo.jpg"
            className="h-9 rounded-lg border-border bg-background text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => onChange(urlDraft.trim())}
            className="h-9 shrink-0 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
