"use client";

// ─── CategoryTable ────────────────────────────────────────────────────────────
import { useMemo, type ReactNode } from "react";
import {
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RotateCcw,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CategoryCoverChangeMicro } from "@/components/files/CoverChangeMicro";
import type { UploadOrphanCoverResponse } from "@/types/files.types";
import type {
  PopulatedCategory,
  SortDir,
  SortField,
} from "./category-panel.types";

// ─── StatusBadge ──────────────────────────────────────────────────────────────

type RowStatus = "active" | "inactive" | "deleted";

const STATUS_STYLES: Record<RowStatus, { badge: string; dot: string }> = {
  active: {
    badge:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  inactive: {
    badge:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  deleted: {
    badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }: { status: RowStatus }) {
  const { badge, dot } = STATUS_STYLES[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[11px] font-medium", badge)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ChevronsUpDown className="ml-1 inline size-3 opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline size-3" />
  ) : (
    <ChevronDown className="ml-1 inline size-3" />
  );
}

function SortableTh({
  field,
  sortField,
  sortDir,
  onSort,
  children,
  className,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground",
        sortField === field && "text-foreground",
        className,
      )}
      onClick={() => onSort(field)}>
      {children}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  );
}

// ─── SkeletonTableRow ─────────────────────────────────────────────────────────

function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-2 py-1.5">
        <Skeleton className="size-4 rounded" />
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="size-7 rounded-md" />
      </td>
      <td className="px-2 py-1.5">
        <div className="space-y-1">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-2.5 w-40 rounded" />
        </div>
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="h-2.5 w-24 rounded" />
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="h-4 w-16 rounded-full" />
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="h-4 w-24 rounded-full" />
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="h-2.5 w-20 rounded" />
      </td>
      <td className="px-2 py-1.5">
        <Skeleton className="h-4 w-10 rounded-full" />
      </td>
      <td className="px-2 py-1.5" />
    </tr>
  );
}

// ─── CategoryTableRow ─────────────────────────────────────────────────────────

interface CategoryTableRowProps {
  category: PopulatedCategory;
  selected: boolean;
  onSelect: () => void;
  onEditDetails: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  isMutating: boolean;
  allCategories: PopulatedCategory[];
  onUploadCover: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  // FIX: signature is (fileId, cloudinaryUrl) — categoryId is already known
  // by the closure that wraps this in CategoryTable, and is prepended there
  // before calling the panel-level onCoverLinked(categoryId, fileId, url).
  onCoverLinked: (fileId: string, cloudinaryUrl: string) => void;
  coverUrlOverride?: string;
}

function CategoryTableRow({
  category,
  selected,
  onSelect,
  onEditDetails,
  onToggleActive,
  onDelete,
  onRestore,
  onPermanentDelete,
  isMutating,
  allCategories,
  onUploadCover,
  onCoverLinked,
  coverUrlOverride,
}: CategoryTableRowProps) {
  const status: RowStatus = category.isDeleted
    ? "deleted"
    : category.isActive
      ? "active"
      : "inactive";

  const parentName = useMemo(
    () =>
      category.parentCategoryId
        ? (allCategories.find((c) => c._id === category.parentCategoryId)
            ?.catName ?? null)
        : null,
    [allCategories, category.parentCategoryId],
  );

  // FIX: coverUrlOverride takes priority over the server value so the row
  // always shows the newly uploaded image while the refetch round-trip is
  // still in flight. Once the panel clears the override (after refetch
  // settles), category.catCoverId?.url takes over naturally.
  const effectiveCoverUrl =
    coverUrlOverride ?? category.catCoverId?.url ?? null;

  return (
    <tr
      className={cn(
        "group border-b border-border/50 transition-colors last:border-0",
        selected ? "bg-primary/5" : "hover:bg-accent/30",
        category.isDeleted && "opacity-60",
      )}>
      {/* Checkbox */}
      <td className="w-8 px-2 py-1.5">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="block"
        />
      </td>

      {/* Cover thumbnail */}
      <td className="w-10 px-2 py-1.5">
        <CategoryCoverChangeMicro
          cover={effectiveCoverUrl}
          disabled={category.isDeleted}
          sizeClass="w-16 h-10"
          onUpload={onUploadCover}
          // CoverChangeMicro calls onSuccess with the full UploadOrphanCoverResponse.
          // We extract fileId and the Cloudinary URL here and forward them up.
          onSuccess={(result) => onCoverLinked(result.fileId, result.url)}
        />
      </td>

      {/* Name + description */}
      <td className="max-w-55 px-3 py-1.5">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold tracking-tight capitalize">
            {category.catName}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {category.catDesc}
          </span>
        </div>
      </td>

      {/* Slug */}
      <td className="max-w-35 px-3 py-1.5">
        <Link
          href={`/categories/${category.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-mono text-[11px] tracking-wide text-muted-foreground/70">
          /{category.slug}
        </Link>
      </td>

      {/* Status */}
      <td className="w-24 px-3 py-1.5">
        <StatusBadge status={status} />
      </td>

      {/* Parent */}
      <td className="max-w-35 px-3 py-1.5">
        {parentName ? (
          <span className="truncate text-[12px] text-muted-foreground">
            {parentName}
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Services count */}
      <td className="w-20 px-3 py-1.5">
        {typeof category.servicesCount === "number" ? (
          <Badge
            variant="outline"
            className="gap-1 text-[11px] font-medium border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            {category.servicesCount}
            <span className="font-normal opacity-70">
              {category.servicesCount === 1 ? "service" : "services"}
            </span>
          </Badge>
        ) : (
          <span className="text-[12px] text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="w-12 px-2 py-1.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={isMutating}>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {category.isDeleted ? (
              <>
                <DropdownMenuItem onClick={onRestore}>
                  <RotateCcw className="mr-2 size-3.5" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onPermanentDelete}
                  className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 size-3.5" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={onEditDetails}>
                  <Pencil className="mr-2 size-3.5" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  {category.isActive ? (
                    <ToggleLeft className="mr-2 size-3.5" />
                  ) : (
                    <ToggleRight className="mr-2 size-3.5" />
                  )}
                  {category.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─── CategoryTable ─────────────────────────────────────────────────────────────

export interface CategoryTableProps {
  isLoading: boolean;
  paginated: PopulatedCategory[];
  selectedIds: string[];
  allPageSelected: boolean;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (page: PopulatedCategory[]) => void;
  isMutating: boolean;
  allCategories: PopulatedCategory[];
  onUploadCover: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  coverUrlOverrides: Record<string, string>;
  onCoverLinked: (
    categoryId: string,
    fileId: string,
    cloudinaryUrl: string,
  ) => void;
  onEditDetails: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function CategoryTable({
  isLoading,
  paginated,
  selectedIds,
  allPageSelected,
  sortField,
  sortDir,
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  isMutating,
  allCategories,
  onUploadCover,
  coverUrlOverrides,
  onCoverLinked,
  onEditDetails,
  onToggleActive,
  onDelete,
  onRestore,
  onPermanentDelete,
}: CategoryTableProps) {
  return (
    <div className="flex-1 overflow-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 border-b border-border/60 backdrop-blur">
          <tr>
            <th className="w-8 px-2 py-2">
              <Checkbox
                checked={allPageSelected}
                onCheckedChange={() => onToggleSelectAll(paginated)}
              />
            </th>
            <th className="w-10 px-2 py-2" />
            <SortableTh
              field="catName"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}>
              Name
            </SortableTh>
            <SortableTh
              field="slug"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}>
              Slug
            </SortableTh>
            <SortableTh
              field="isActive"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
              className="w-24">
              Status
            </SortableTh>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Parent
            </th>
            <th className="w-20 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Services
            </th>
            <th className="w-10 px-2 py-2" />
          </tr>
        </thead>

        <tbody>
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}

          {!isLoading && paginated.length === 0 && (
            <tr>
              <td colSpan={8} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full border bg-muted p-4">
                    <Search className="size-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    No categories found
                  </p>
                </div>
              </td>
            </tr>
          )}

          {paginated.map((cat) => (
            <CategoryTableRow
              key={cat._id}
              category={cat}
              selected={selectedIds.includes(cat._id)}
              onSelect={() => onToggleSelect(cat._id)}
              onEditDetails={() => onEditDetails(cat._id)}
              onToggleActive={() => onToggleActive(cat._id)}
              onDelete={() => onDelete(cat._id)}
              onRestore={() => onRestore(cat._id)}
              onPermanentDelete={() => onPermanentDelete(cat._id)}
              isMutating={isMutating}
              allCategories={allCategories}
              onUploadCover={onUploadCover}
              // Prepend categoryId here so CategoryTableRow's onCoverLinked
              // stays a simple (fileId, url) callback — categoryId is already
              // known in this scope via cat._id.
              onCoverLinked={(fileId, cloudinaryUrl) =>
                onCoverLinked(cat._id, fileId, cloudinaryUrl)
              }
              coverUrlOverride={coverUrlOverrides[cat._id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
