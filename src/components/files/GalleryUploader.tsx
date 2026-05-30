"use client";

import { useRef, useState, useCallback } from "react";
import {
  Images,
  Upload,
  X,
  Loader2,
  Plus,
  Trash2,
  ArchiveIcon,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Camera,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IFile,
  UploadProviderGalleryImageResponse,
  UploadMultipleProviderGalleryImagesResponse,
  ArchiveResponse,
  MutationResponse,
} from "@/types/files.types";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryUploaderProps {
  providerId: string;
  galleryImages: IFile[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<UploadProviderGalleryImageResponse | null>;
  onUploadMultiple: (
    files: File[],
  ) => Promise<UploadMultipleProviderGalleryImagesResponse | null>;
  onDelete: (providerId: string, fileId: string) => Promise<boolean>;
  onArchive: (
    providerId: string,
    fileId: string,
  ) => Promise<ArchiveResponse | null>;
  onRestore: (
    providerId: string,
    fileId: string,
  ) => Promise<MutationResponse | null>;
  /** Show archived images too. Default: false */
  showArchived?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  className?: string;
}

interface QueuedImage {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function GalleryUploader({
  providerId,
  galleryImages,
  isUploading,
  error,
  onUpload,
  onUploadMultiple,
  onDelete,
  onArchive,
  onRestore,
  showArchived = false,
  maxFiles = 20,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  className,
}: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const displayImages = showArchived
    ? galleryImages
    : galleryImages.filter((f) => f.status === "active");

  const remainingSlots =
    maxFiles - galleryImages.filter((f) => f.status === "active").length;
  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;

  // ── Queue ────────────────────────────────────────────────────────────────────

  const updateItem = (id: string, patch: Partial<QueuedImage>) =>
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const enqueueFiles = useCallback(
    (files: File[]) => {
      const valid = files
        .filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= maxSizeBytes)
        .slice(0, Math.max(0, remainingSlots - queue.length));

      const newItems: QueuedImage[] = valid.map((file) => {
        const item: QueuedImage = {
          id: crypto.randomUUID(),
          file,
          preview: "",
          status: "pending",
        };
        const reader = new FileReader();
        reader.onload = (e) =>
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, preview: e.target?.result as string }
                : q,
            ),
          );
        reader.readAsDataURL(file);
        return item;
      });

      if (newItems.length) setQueue((prev) => [...prev, ...newItems]);
    },
    [maxSizeBytes, remainingSlots, queue.length],
  );

  // ── Upload ───────────────────────────────────────────────────────────────────

  const uploadAll = useCallback(async () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (!pending.length) return;

    if (pending.length === 1) {
      const item = pending[0];
      updateItem(item.id, { status: "uploading" });
      const result = await onUpload(item.file);
      updateItem(item.id, { status: result ? "done" : "error" });
    } else {
      pending.forEach((i) => updateItem(i.id, { status: "uploading" }));
      const result = await onUploadMultiple(pending.map((p) => p.file));
      pending.forEach((i) =>
        updateItem(i.id, { status: result ? "done" : "error" }),
      );
    }

    setTimeout(
      () => setQueue((prev) => prev.filter((q) => q.status !== "done")),
      1200,
    );
  }, [queue, onUpload, onUploadMultiple]);

  // ── Actions on existing images ────────────────────────────────────────────────

  const handleDelete = async (fileId: string) => {
    setActionId(fileId);
    await onDelete(providerId, fileId);
    setActionId(null);
  };

  const handleArchive = async (fileId: string) => {
    setActionId(fileId);
    await onArchive(providerId, fileId);
    setActionId(null);
  };

  const handleRestore = async (fileId: string) => {
    setActionId(fileId);
    await onRestore(providerId, fileId);
    setActionId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Gallery</span>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {displayImages.length}
              {maxFiles < Infinity && `/${maxFiles}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={isUploading || uploadingCount > 0}
                className="h-7 gap-1.5 text-xs">
                {uploadingCount > 0 ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Upload {pendingCount}
              </Button>
            )}
            {remainingSlots > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}>
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}>
                  <Camera className="h-3 w-3" />
                  Camera
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Drop zone — shown when gallery is empty */}
        {displayImages.length === 0 && queue.length === 0 && (
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/40 dark:bg-muted/10",
            )}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              enqueueFiles(Array.from(e.dataTransfer.files));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted dark:bg-muted/40">
              <Images className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Build your gallery
              </p>
              <p className="text-xs text-muted-foreground">
                Drag photos or{" "}
                <span className="text-primary underline-offset-2 hover:underline">
                  browse
                </span>{" "}
                · Up to {maxFiles} images
              </p>
            </div>
          </div>
        )}

        {/* Combined image grid: pending queue + existing */}
        {(displayImages.length > 0 || queue.length > 0) && (
          <div
            className={cn(
              "rounded-xl border border-border bg-muted/20 p-2 dark:bg-muted/10",
              "grid gap-1.5",
              "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
            )}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              enqueueFiles(Array.from(e.dataTransfer.files));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}>
            {/* Queued images */}
            {queue.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                {item.preview && (
                  <Image
                    src={item.preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    width={800}
                    height={600}
                  />
                )}

                {/* Status overlay */}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {item.status === "done" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/40">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/40">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                )}
                {item.status === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      setQueue((prev) => prev.filter((q) => q.id !== item.id))
                    }
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Pending badge */}
                {item.status === "pending" && (
                  <div className="absolute bottom-1 left-1">
                    <Badge className="h-4 px-1 text-[10px] bg-background/80 text-foreground border-0">
                      Pending
                    </Badge>
                  </div>
                )}
              </div>
            ))}

            {/* Existing gallery images */}
            {displayImages.map((file) => (
              <div
                key={file._id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted",
                  file.status === "archived" && "opacity-50",
                )}>
                <Image
                  src={file.thumbnailUrl ?? file.url}
                  alt={file.fileName}
                  className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                  width={800}
                  height={600}
                />

                {/* Hover actions */}
                <div className="absolute inset-0 flex items-start justify-end gap-1 p-1 opacity-0 transition-opacity group-hover:opacity-100 bg-black/20">
                  {actionId === file._id ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60">
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    </div>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setLightboxSrc(file.url)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors">
                            <Eye className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors">
                            <span className="text-xs font-bold leading-none">
                              ⋯
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {file.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(file._id)}
                              className="gap-2 text-xs">
                              <ArchiveIcon className="h-3.5 w-3.5" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {file.status === "archived" && (
                            <DropdownMenuItem
                              onClick={() => handleRestore(file._id)}
                              className="gap-2 text-xs">
                              <RotateCcw className="h-3.5 w-3.5" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(file._id)}
                            className="gap-2 text-xs text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>

                {/* Archived badge */}
                {file.status === "archived" && (
                  <div className="absolute bottom-1 left-1">
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      Archived
                    </Badge>
                  </div>
                )}
              </div>
            ))}

            {/* Add more tile */}
            {remainingSlots > 0 &&
              (displayImages.length > 0 || queue.length > 0) && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "aspect-square rounded-lg border-2 border-dashed transition-all duration-200",
                    "flex flex-col items-center justify-center gap-1",
                    isDragging
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/20 dark:bg-muted/10",
                  )}>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Add</span>
                </button>
              )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive dark:bg-destructive/20">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Simple lightbox */}
        {lightboxSrc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxSrc(null)}>
            <div className="relative max-h-[90vh] max-w-[90vw]">
              <Image
                src={lightboxSrc}
                alt="Gallery preview"
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                width={800}
                height={600}
              />
              <button
                type="button"
                onClick={() => setLightboxSrc(null)}
                className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) enqueueFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) enqueueFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
    </TooltipProvider>
  );
}
