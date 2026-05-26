"use client";

import { useRef, useState, useCallback } from "react";
import {
  ShieldCheck,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  IFile,
  UploadTaskCompletionProofResponse,
  UploadMultipleTaskCompletionProofsResponse,
} from "@/types/files.types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProofUploaderProps {
  completionId: string;
  proofs: IFile[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  onUpload: (
    completionId: string,
    file: File,
  ) => Promise<UploadTaskCompletionProofResponse | null>;
  onUploadMultiple: (
    completionId: string,
    files: File[],
  ) => Promise<UploadMultipleTaskCompletionProofsResponse | null>;
  onDelete: (completionId: string, fileId: string) => Promise<boolean>;
  maxSizeBytes?: number;
  maxFiles?: number;
  className?: string;
}

interface QueuedProof {
  id: string;
  file: File;
  preview?: string; // data URL for images
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProofUploader({
  completionId,
  proofs,
  isUploading,
  error,
  onUpload,
  onUploadMultiple,
  onDelete,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  maxFiles = 8,
  className,
}: ProofUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedProof[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remainingSlots = maxFiles - proofs.length;
  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;

  // ── Queue helpers ────────────────────────────────────────────────────────────

  const updateItem = (id: string, patch: Partial<QueuedProof>) =>
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const enqueueFiles = useCallback(
    (files: File[]) => {
      const valid = files
        .filter((f) => f.size <= maxSizeBytes)
        .slice(0, Math.max(0, remainingSlots - queue.length));

      const newItems: QueuedProof[] = valid.map((file) => {
        const item: QueuedProof = {
          id: crypto.randomUUID(),
          file,
          status: "pending",
        };
        if (IMAGE_TYPES.includes(file.type)) {
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
        }
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
      const result = await onUpload(completionId, item.file);
      updateItem(item.id, {
        status: result ? "done" : "error",
        errorMessage: result ? undefined : "Upload failed",
      });
    } else {
      pending.forEach((i) => updateItem(i.id, { status: "uploading" }));
      const result = await onUploadMultiple(
        completionId,
        pending.map((p) => p.file),
      );
      pending.forEach((i) =>
        updateItem(i.id, {
          status: result ? "done" : "error",
          errorMessage: result ? undefined : "Upload failed",
        }),
      );
    }

    setTimeout(
      () => setQueue((prev) => prev.filter((q) => q.status !== "done")),
      1500,
    );
  }, [queue, completionId, onUpload, onUploadMultiple]);

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    await onDelete(completionId, fileId);
    setDeletingId(null);
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(Array.from(e.dataTransfer.files));
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm font-medium text-foreground">
              Completion Proof
            </span>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {proofs.length}/{maxFiles}
            </Badge>
          </div>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={uploadAll}
              disabled={isUploading || uploadingCount > 0}
              className="h-7 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-xs">
              {uploadingCount > 0 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Submit {pendingCount} proof{pendingCount > 1 ? "s" : ""}
            </Button>
          )}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Upload photos or documents that confirm this task was completed.
            Accepted files are reviewed by the client.
          </span>
        </div>

        {/* Drop zone */}
        {remainingSlots > 0 && (
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 transition-all duration-200",
              isDragging
                ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30"
                : "border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/40 dark:bg-muted/10",
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isDragging
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : "bg-muted dark:bg-muted/40",
              )}>
              <Camera
                className={cn(
                  "h-4 w-4",
                  isDragging
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop proof files" : "Add proof files"}
              </p>
              <p className="text-xs text-muted-foreground">
                Photos, videos, documents · Max {formatBytes(maxSizeBytes)}
              </p>
            </div>
          </div>
        )}

        {/* Queue — image grid + file list */}
        {queue.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Ready to submit
            </p>

            {/* Image previews */}
            {queue.some((q) => q.preview) && (
              <div className="grid grid-cols-4 gap-1.5">
                {queue
                  .filter((q) => q.preview)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden rounded-md border border-border">
                      {item.preview && (
                        <Image
                          src={item.preview}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                          width={100}
                          height={100}
                        />
                      )}
                      {item.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        </div>
                      )}
                      {item.status === "done" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            setQueue((prev) =>
                              prev.filter((q) => q.id !== item.id),
                            )
                          }
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Non-image files */}
            {queue
              .filter((q) => !q.preview)
              .map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-xs",
                    item.status === "error"
                      ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
                      : "border-border bg-card dark:bg-card/50",
                  )}>
                  <Upload className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.file.name}</p>
                    <p className="text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </p>
                    {item.status === "uploading" && (
                      <Progress value={undefined} className="mt-1 h-0.5" />
                    )}
                  </div>
                  {item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        setQueue((prev) => prev.filter((q) => q.id !== item.id))
                      }>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  {item.status === "uploading" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {item.status === "done" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {item.status === "error" && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Submitted proofs */}
        {proofs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Submitted
            </p>
            <ScrollArea className="max-h-48">
              <div className="flex flex-col gap-1.5 pr-1">
                {proofs.map((proof) => (
                  <div
                    key={proof._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs dark:bg-card/50">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {proof.fileName}
                      </p>
                      {proof.fileSize != null && (
                        <p className="text-muted-foreground">
                          {formatBytes(proof.fileSize)}
                        </p>
                      )}
                    </div>
                    <Link
                      href={proof.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(proof._id)}
                      disabled={deletingId === proof._id}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
                      {deletingId === proof._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive dark:bg-destructive/20">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
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
