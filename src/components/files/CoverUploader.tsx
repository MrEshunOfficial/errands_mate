"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Trash2,
  Expand,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { IFile, UploadOrphanCoverResponse } from "@/types/files.types";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CoverContext = "service" | "category";

interface CoverUploaderProps {
  context: CoverContext;
  coverRecord: IFile | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  onDelete: () => Promise<boolean>;
  onUploadSuccess?: (result: UploadOrphanCoverResponse) => void;
  onDeleteSuccess?: () => void;
  maxSizeBytes?: number;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

function validateFile(file: File, maxBytes: number): string | null {
  if (!ACCEPTED_TYPES.includes(file.type))
    return "Only JPEG, PNG, WebP or GIF images are accepted.";
  if (file.size > maxBytes)
    return `File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CoverUploader({
  context,
  coverRecord,
  isLoading,
  isUploading,
  error,
  onUpload,
  onDelete,
  onUploadSuccess,
  onDeleteSuccess,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  className,
}: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // localPreview: blob URL shown while uploading (optimistic)
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // uploadedUrl: frozen blob URL shown after a successful upload
  // (kept until coverRecord.url is confirmed from the server)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const label = context === "service" ? "Service Cover" : "Category Cover";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file, maxSizeBytes);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      setJustUploaded(false);

      // Show optimistic preview immediately
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setUploadedUrl(null);

      const result = await onUpload(file);

      if (result) {
        // Freeze the preview URL so we keep showing the image even after
        // localPreview is cleared. coverRecord may take a render cycle to update.
        setUploadedUrl(objectUrl);
        setLocalPreview(null);
        setJustUploaded(true);
        onUploadSuccess?.(result);
      } else {
        // Upload failed — clear preview
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
      }
    },
    [onUpload, onUploadSuccess, maxSizeBytes],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    const success = await onDelete();
    if (success) {
      setUploadedUrl(null);
      setJustUploaded(false);
      onDeleteSuccess?.();
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  // Priority: uploading preview → frozen uploaded URL → confirmed server URL
  const displayUrl = localPreview ?? uploadedUrl ?? coverRecord?.url ?? null;
  const hasCover = Boolean(displayUrl);
  const combinedError = localError ?? error;
  const busy = isLoading || isUploading;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-3", className)}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
          {coverRecord?.status === "archived" && (
            <Badge variant="secondary" className="text-xs">
              Archived
            </Badge>
          )}
        </div>

        {/* Drop zone / image display */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
            "bg-muted/30 dark:bg-muted/10",
            isDragging
              ? "scale-[1.01] border-primary bg-primary/5 dark:bg-primary/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            busy && "pointer-events-none opacity-60",
          )}
          style={{ aspectRatio: "16/7" }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !hasCover && inputRef.current?.click()}>
          {hasCover ? (
            <>
              <Image
                src={displayUrl!}
                alt={`${label} preview`}
                className="h-full w-full object-cover"
                width={800}
                height={350}
              />

              {/* Success badge — shown right after upload */}
              {justUploaded && !isUploading && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uploaded successfully
                </div>
              )}

              {/* Action buttons on hover */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 hover:bg-black/40 hover:opacity-100 transition-all duration-200">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white text-gray-800 shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(displayUrl!, "_blank");
                      }}>
                      <Expand className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View full size</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white text-gray-800 shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      disabled={busy}>
                      <ImagePlus
                        className={cn("h-4 w-4", isUploading && "animate-spin")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Replace image</TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/90 hover:bg-white text-destructive shadow"
                          disabled={busy}
                          onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Remove cover</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {label}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the cover image from
                        Cloudinary. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  "bg-muted dark:bg-muted/40",
                  isDragging && "bg-primary/10 dark:bg-primary/20",
                )}>
                <Upload
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop to upload" : "Upload cover image"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Drag & drop or{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="text-primary underline-offset-2 hover:underline">
                    browse
                  </button>{" "}
                  · JPEG, PNG, WebP · Max{" "}
                  {Math.round(maxSizeBytes / 1024 / 1024)} MB
                </p>
              </div>
            </div>
          )}

          {/* Upload spinner overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm dark:bg-background/70">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <span className="text-xs font-medium text-foreground">
                  Uploading…
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {combinedError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive dark:bg-destructive/20">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {combinedError}
          </div>
        )}

        {/* File meta */}
        {coverRecord && !localPreview && (
          <p className="text-xs text-muted-foreground">
            {coverRecord.fileName}
            {coverRecord.fileSize != null && (
              <> · {(coverRecord.fileSize / 1024).toFixed(1)} KB</>
            )}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </TooltipProvider>
  );
}
