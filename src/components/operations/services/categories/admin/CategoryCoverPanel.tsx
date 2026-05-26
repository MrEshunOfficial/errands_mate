"use client";

// ─── CategoryCoverPanel ───────────────────────────────────────────────────────
// Cover image management panel for a single category.
// Delegates all upload / delete logic to CoverUploader.
// Handles thumbnail (list row) and panel (dialog) display modes.

import Image from "next/image";
import { ImageIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverUploader } from "@/components/files/CoverUploader";
import { IFile, UploadOrphanCoverResponse } from "@/types/files.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryCoverPanelProps {
  categoryId: string;
  categoryName: string;

  /** Full IFile record for the current cover (null = no cover) */
  coverRecord: IFile | null;

  /**
   * "thumbnail" — compact square used inside table rows.
   * "panel"     — full-width panel used inside dialogs / drawers.
   */
  mode?: "thumbnail" | "panel";

  // ── Panel-mode props (passed straight through to CoverUploader) ────────────

  isLoading?: boolean;
  isUploading?: boolean;
  error?: string | null;

  /** Upload handler — must return the upload result or null on failure */
  onUpload: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  /** Delete handler — must return true on success */
  onDelete: () => Promise<boolean>;
  /** Optional: called after a successful upload so the parent can persist fileId */
  onUploadSuccess?: (result: UploadOrphanCoverResponse) => void;
  /** Optional: called after a successful delete */
  onDeleteSuccess?: () => void;

  // ── Thumbnail-mode props ───────────────────────────────────────────────────

  /** Thumbnail mode only — opens the cover panel/dialog */
  onEditClick?: () => void;
  disabled?: boolean;
}

// ─── Thumbnail mode ───────────────────────────────────────────────────────────

function CoverThumbnail({
  cover,
  categoryName,
  onEditClick,
  disabled,
}: {
  cover: IFile | null;
  categoryName: string;
  onEditClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onEditClick}
      disabled={disabled}
      aria-label={`Change cover image for ${categoryName}`}
      className={cn(
        "group relative size-8 shrink-0 overflow-hidden rounded-md border bg-muted",
        "transition-all duration-200 hover:border-primary hover:ring-1 hover:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}>
      {cover?.thumbnailUrl || cover?.url ? (
        <Image
          src={cover.thumbnailUrl ?? cover.url}
          alt={categoryName}
          fill
          sizes="32px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-3.5 opacity-40" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
        <Pencil className="size-2.5 text-white" />
      </div>
    </button>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function CategoryCoverPanel({
  categoryId: _categoryId,
  categoryName,
  coverRecord,
  mode = "panel",
  isLoading = false,
  isUploading = false,
  error = null,
  onUpload,
  onDelete,
  onUploadSuccess,
  onDeleteSuccess,
  onEditClick,
  disabled,
}: CategoryCoverPanelProps) {
  if (mode === "thumbnail") {
    return (
      <CoverThumbnail
        cover={coverRecord}
        categoryName={categoryName}
        onEditClick={onEditClick}
        disabled={disabled}
      />
    );
  }

  return (
    <CoverUploader
      context="category"
      coverRecord={coverRecord}
      isLoading={isLoading}
      isUploading={isUploading}
      error={error}
      onUpload={onUpload}
      onDelete={onDelete}
      onUploadSuccess={onUploadSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}
