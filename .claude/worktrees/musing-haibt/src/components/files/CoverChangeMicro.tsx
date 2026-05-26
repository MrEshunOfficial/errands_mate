"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Loader2, ImageOff } from "lucide-react";
import type { IFile, UploadOrphanCoverResponse } from "@/types/files.types";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoverChangeMicroProps {
  /**
   * Current cover to display.
   *
   * - Pass a plain **URL string** when you only have the image URL available.
   * - Pass a full **`IFile`** record when you have the complete file object.
   * - Pass **`null | undefined`** to render the empty-state placeholder.
   *
   * ⚠️ Do NOT pass a partial object like `{ _id, url, thumbnailUrl }` — it
   * will not satisfy the `IFile` interface. Extract just the `url` field
   * and pass that string instead.
   */
  cover?: IFile | string | null;
  /** Called when the user picks a new file. Return null on failure. */
  onUpload: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  /**
   * Optional callback fired after a successful upload.
   * Receives the full server response so the caller can immediately
   * apply the Cloudinary URL without waiting for a refetch.
   */
  onSuccess?: (result: UploadOrphanCoverResponse) => void;
  /** Tailwind size classes for the thumbnail container. Default: "w-20 h-12" */
  sizeClass?: string;
  /** Extra Tailwind classes on the root element. */
  className?: string;
  /** Accessible label for the trigger button. */
  label?: string;
  /** Aspect-ratio Tailwind class. Default: "aspect-video" */
  aspectClass?: string;
  disabled?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the canonical URL from the heterogeneous `cover` prop. */
function resolveCoverUrl(
  cover: IFile | string | null | undefined,
): string | null {
  if (!cover) return null;
  if (typeof cover === "string") return cover;
  return cover.url ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Compact inline cover-change widget for list rows and cards.
 * On hover a camera-icon overlay appears; clicking opens the file picker.
 *
 * ## Cover-replacement flow
 *
 * 1. User picks a file → FileReader renders an instant local preview.
 * 2. The file is uploaded via `onUpload`; on success `onSuccess` fires.
 * 3. The parent should call `onSuccess` with the server response so it can:
 *    a. Immediately pass the Cloudinary URL as the `cover` prop (removes the
 *       local-preview dependency entirely), OR
 *    b. Trigger a refetch which eventually propagates the new URL through
 *       `cover`.
 * 4. The local preview is kept alive until `cover` resolves to a *new,
 *    non-null* URL that is different from the URL that was in place before
 *    the upload started. This prevents a blank-cover flash when the parent's
 *    refetch is slower than the upload.
 */
export function CoverChangeMicro({
  cover,
  onUpload,
  onSuccess,
  sizeClass = "w-20 h-12",
  className,
  label = "Change cover",
  aspectClass = "aspect-video",
  disabled = false,
}: CoverChangeMicroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Optimistic local preview ───────────────────────────────────────────────
  //
  // BUGS FIXED:
  //
  // Bug A – "Preview clears before the new server URL arrives"
  // The old code cleared `localPreview` whenever `canonicalUrl` differed from
  // the pre-upload URL, including when `canonicalUrl` was `null` (i.e. the
  // backend hadn't populated catCoverId yet). This caused the component to
  // flash back to the empty-cover placeholder while the refetch was in
  // flight.
  //
  // Fix: only clear `localPreview` when we receive a *truthy* new canonical
  // URL. If the parent's `cover` prop stays null (e.g. the API doesn't
  // populate catCoverId on every endpoint), we keep showing the local
  // preview indefinitely — much better UX than a blank cover.
  //
  // Bug B – "Race between FileReader and the upload promise"
  // In the original implementation `reader.readAsDataURL(file)` and
  // `await onUpload(file)` raced. For very fast uploads (or cached network
  // responses) the upload could complete and trigger onSuccess → refetch →
  // new canonicalUrl *before* `FileReader.onload` fired. When onload
  // eventually fired and set `localPreview`, the effect immediately cleared
  // it because the new canonical URL had already arrived, making it look
  // like the new image was never applied.
  //
  // Fix: read the file *before* starting the upload and await the data URL
  // conversion as a Promise so the preview is guaranteed to be set before
  // `onUpload` resolves.

  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // The canonical URL that was in place when the current upload started.
  // Used to detect when the parent has propagated a genuinely new server URL.
  const preUploadUrlRef = useRef<string | null>(null);

  const canonicalUrl = resolveCoverUrl(cover);

  useEffect(() => {
    if (!localPreview) return;

    // KEY FIX: only clear the local preview when we receive a *real* (truthy)
    // new URL that's different from the one that existed before the upload.
    // If canonicalUrl is null/undefined the backend hasn't confirmed the new
    // cover yet — keep showing the optimistic preview.
    if (canonicalUrl && canonicalUrl !== preUploadUrlRef.current) {
      setLocalPreview(null);
      preUploadUrlRef.current = null;
    }
  }, [canonicalUrl, localPreview]);

  // The URL we actually render: optimistic preview takes priority while it
  // exists, then falls back to the authoritative prop value.
  const displayUrl = localPreview ?? canonicalUrl;

  // ── File reading helper ────────────────────────────────────────────────────

  /** Converts a File into a data-URL string via FileReader, as a Promise. */
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });

  // ── Upload handler ─────────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Unsupported file type");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File too large (max 5 MB)");
        return;
      }

      setError(null);

      // Snapshot the current canonical URL so the effect can detect when the
      // parent propagates a genuinely new one.
      preUploadUrlRef.current = canonicalUrl;

      // KEY FIX: read the file to a data URL *before* starting the upload so
      // the optimistic preview is guaranteed to be visible for the entire
      // duration of the upload. No more race between FileReader and onUpload.
      let dataUrl: string;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch {
        setError("Could not read file");
        return;
      }

      setLocalPreview(dataUrl);
      setUploading(true);

      try {
        const result = await onUpload(file);

        if (result) {
          // Notify the parent. The parent should use result.file.url to
          // update the `cover` prop immediately (bypassing refetch latency).
          onSuccess?.(result);
        } else {
          // Upload returned null — revert the optimistic preview.
          setLocalPreview(null);
          preUploadUrlRef.current = null;
          setError("Upload failed");
        }
      } catch {
        setLocalPreview(null);
        preUploadUrlRef.current = null;
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [canonicalUrl, onUpload, onSuccess],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected if needed.
    e.target.value = "";
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={cn("group relative shrink-0", sizeClass, className)}>
      {/* Thumbnail */}
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-md border",
          "border-border bg-muted dark:bg-muted/30",
          aspectClass,
        )}>
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Cover"
            className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-75"
            width={800}
            height={600}
            // Use unoptimized for data-URLs (local previews) since Next.js
            // Image optimisation cannot handle them.
            unoptimized={displayUrl.startsWith("data:")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      {!disabled && (
        <button
          type="button"
          aria-label={label}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-md",
            "transition-opacity duration-200",
            uploading
              ? "cursor-wait opacity-100"
              : "cursor-pointer opacity-0 group-hover:opacity-100",
          )}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white drop-shadow" />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Camera className="h-4 w-4 text-white drop-shadow" />
              <span className="text-[10px] font-semibold leading-none text-white drop-shadow">
                Change
              </span>
            </div>
          )}
        </button>
      )}

      {/* Error pip */}
      {error && (
        <div
          title={error}
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export type ServiceCoverChangeMicroProps = Omit<
  CoverChangeMicroProps,
  "label"
> & {
  label?: string;
};

/** Pre-labelled wrapper for service covers. */
export function ServiceCoverChangeMicro(props: ServiceCoverChangeMicroProps) {
  return <CoverChangeMicro label="Change service cover" {...props} />;
}

export type CategoryCoverChangeMicroProps = Omit<
  CoverChangeMicroProps,
  "label"
> & {
  label?: string;
};

/** Pre-labelled wrapper for category covers. */
export function CategoryCoverChangeMicro(props: CategoryCoverChangeMicroProps) {
  return <CoverChangeMicro label="Change category cover" {...props} />;
}
