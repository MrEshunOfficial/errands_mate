"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  X,
  Paperclip,
  FileText,
  FileImage,
  FileVideo,
  File,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IFile,
  UploadAttachmentResponse,
  UploadMultipleAttachmentsResponse,
} from "@/types/files.types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentUploaderProps {
  taskId: string;
  attachments: IFile[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  onUpload: (
    taskId: string,
    file: File,
  ) => Promise<UploadAttachmentResponse | null>;
  onUploadMultiple: (
    taskId: string,
    files: File[],
  ) => Promise<UploadMultipleAttachmentsResponse | null>;
  onDelete: (taskId: string, fileId: string) => Promise<boolean>;
  /** Max individual file size in bytes. Default: 20 MB */
  maxSizeBytes?: number;
  /** Max total files allowed. Default: 10 */
  maxFiles?: number;
  className?: string;
}

interface QueuedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const cls = "h-4 w-4 flex-shrink-0";
  if (mimeType.startsWith("image/"))
    return <FileImage className={cn(cls, "text-blue-500")} />;
  if (mimeType.startsWith("video/"))
    return <FileVideo className={cn(cls, "text-purple-500")} />;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return <FileText className={cn(cls, "text-rose-500")} />;
  return <File className={cn(cls, "text-muted-foreground")} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttachmentUploader({
  taskId,
  attachments,
  isLoading,
  isUploading,
  error,
  onUpload,
  onUploadMultiple,
  onDelete,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  maxFiles = 10,
  className,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remainingSlots = maxFiles - attachments.length;
  const busy = isLoading || isUploading;

  // ── Queue helpers ────────────────────────────────────────────────────────────

  const updateQueueItem = (id: string, patch: Partial<QueuedFile>) =>
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  // ── Upload logic ─────────────────────────────────────────────────────────────

  const enqueueFiles = useCallback(
    (files: File[]) => {
      const valid = files
        .filter((f) => f.size <= maxSizeBytes)
        .slice(0, Math.max(0, remainingSlots - queue.length));

      if (!valid.length) return;

      const newItems: QueuedFile[] = valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending",
      }));

      setQueue((prev) => [...prev, ...newItems]);
    },
    [maxSizeBytes, remainingSlots, queue.length],
  );

  const uploadAll = useCallback(async () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (!pending.length) return;

    if (pending.length === 1) {
      const item = pending[0];
      updateQueueItem(item.id, { status: "uploading" });
      const result = await onUpload(taskId, item.file);
      updateQueueItem(item.id, {
        status: result ? "done" : "error",
        errorMessage: result ? undefined : "Upload failed",
      });
    } else {
      pending.forEach((item) => updateQueueItem(item.id, { status: "uploading" }));
      const result = await onUploadMultiple(taskId, pending.map((p) => p.file));
      pending.forEach((item) =>
        updateQueueItem(item.id, {
          status: result ? "done" : "error",
          errorMessage: result ? undefined : "Upload failed",
        }),
      );
    }

    // Clear done items after a short delay
    setTimeout(
      () => setQueue((prev) => prev.filter((q) => q.status !== "done")),
      1500,
    );
  }, [queue, taskId, onUpload, onUploadMultiple]);

  const removeFromQueue = (id: string) =>
    setQueue((prev) => prev.filter((q) => q.id !== id));

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    await onDelete(taskId, fileId);
    setDeletingId(null);
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(Array.from(e.dataTransfer.files));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) enqueueFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Attachments
            </span>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {attachments.length}/{maxFiles}
            </Badge>
          </div>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={uploadAll}
              disabled={busy || uploadingCount > 0}
              className="h-7 gap-1.5 text-xs"
            >
              {uploadingCount > 0 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
            </Button>
          )}
        </div>

        {/* Drop zone */}
        {remainingSlots > 0 && (
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-all duration-200",
              "bg-muted/30 dark:bg-muted/10",
              isDragging
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-muted-foreground/25 hover:border-muted-foreground/40",
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                isDragging
                  ? "bg-primary/10 dark:bg-primary/20"
                  : "bg-muted dark:bg-muted/40",
              )}
            >
              <Upload
                className={cn(
                  "h-4 w-4 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop files here" : "Add attachments"}
              </p>
              <p className="text-xs text-muted-foreground">
                Any file type · Max {formatBytes(maxSizeBytes)} each ·{" "}
                {remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} remaining
              </p>
            </div>
          </div>
        )}

        {/* Upload queue */}
        {queue.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Queue</p>
            {queue.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors",
                  item.status === "error"
                    ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
                    : "border-border bg-card dark:bg-card/50",
                )}
              >
                <FileTypeIcon mimeType={item.file.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.file.name}
                  </p>
                  <p className="text-muted-foreground">
                    {formatBytes(item.file.size)}
                  </p>
                  {item.status === "uploading" && (
                    <Progress value={undefined} className="mt-1 h-1" />
                  )}
                </div>
                {item.status === "uploading" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                )}
                {item.status === "error" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>{item.errorMessage}</TooltipContent>
                  </Tooltip>
                )}
                {item.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Existing attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Uploaded
            </p>
            <ScrollArea className="max-h-52">
              <div className="flex flex-col gap-1.5 pr-1">
                {attachments.filter((f) => f?._id && f?.fileName).map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs dark:bg-card/50"
                  >
                    <FileTypeIcon mimeType={file.fileName.split(".").pop() ?? ""} />
                    <div className="min-w-0 flex-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {file.fileName}
                      </a>
                      {file.fileSize != null && (
                        <p className="text-muted-foreground">
                          {formatBytes(file.fileSize)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={file.status === "active" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {file.status}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleDelete(file._id)}
                          disabled={deletingId === file._id}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          {deletingId === file._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete attachment</TooltipContent>
                    </Tooltip>
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
          onChange={handleInputChange}
        />
      </div>
    </TooltipProvider>
  );
}
