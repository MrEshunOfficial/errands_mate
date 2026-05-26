"use client";

// ─── CategoryListPanel ────────────────────────────────────────────────────────
import { useState, useMemo, useCallback, useRef } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import LoadingOverlay from "@/components/ui/LoadingOverlay";
import CategoryForm, {
  type CategoryFormData,
  type CategoryOption,
} from "../form/category.form";
import {
  useAllCategories,
  useAllTags,
  useUpdateCategory,
  useToggleActiveStatus,
  useBulkUpdateCategories,
  useDeleteCategory,
  useRestoreCategory,
  usePermanentlyDeleteCategory,
  useUpdateCategoryImage,
} from "@/hooks/services/categories/useServiceCategory";
import { useCategoryCover } from "@/hooks/files/useCategoryCover";
import { CreateCategoryDrawer } from "./CreateCategoryDrawer";

import { CategoryHeader } from "./CategoryHeader";
import { CategoryTable } from "./CategoryTable";
import { CategoryFooter } from "./CategoryFooter";
import {
  type PopulatedCategory,
  type RawCategory,
  type FilterStatus,
  type BulkAction,
  type BulkOption,
  type DeleteTarget,
  BULK_LABELS,
  BULK_DESCRIPTIONS,
  normaliseCategory,
} from "./category-panel.types";

// ─── useTableState ────────────────────────────────────────────────────────────

type SortField = "catName" | "slug" | "isActive";
type SortDir = "asc" | "desc";

function useTableState(
  source: PopulatedCategory[],
  filterStatus: FilterStatus,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("catName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return source.filter((cat) => {
      const matchSearch =
        !q ||
        cat.catName.toLowerCase().includes(q) ||
        cat.catDesc.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q);

      const matchStatus =
        (filterStatus === "active" && cat.isActive && !cat.isDeleted) ||
        (filterStatus === "inactive" && !cat.isActive && !cat.isDeleted) ||
        (filterStatus === "deleted" && cat.isDeleted);

      return matchSearch && matchStatus;
    });
  }, [source, searchQuery, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (sortField === "catName") {
        cmp = a.catName.localeCompare(b.catName);
      } else if (sortField === "slug") {
        cmp = a.slug.localeCompare(b.slug);
      } else {
        cmp = Number(a.isActive) - Number(b.isActive);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const pageNumbers = useMemo<(number | "...")[]>(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (safePage > 3) pages.push("...");
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    )
      pages.push(i);
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field)
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortField(field);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortField],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback((page: PopulatedCategory[]) => {
    setSelectedIds((prev) => {
      const pageIds = page.map((c) => c._id);
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !pageIds.includes(id));
      const extra = pageIds.filter((id) => !prev.includes(id));
      return [...prev, ...extra];
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    searchQuery,
    setSearchQuery,
    sortField,
    sortDir,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    setSelectedIds,
    filtered,
    sorted,
    paginated,
    totalPages,
    safePage,
    pageNumbers,
    pageStart: (safePage - 1) * pageSize + 1,
    pageEnd: Math.min(safePage * pageSize, sorted.length),
    handleSort,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permanent?: boolean;
  isLoading: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  permanent = false,
  isLoading,
  error,
  title,
  description,
  confirmLabel,
  destructive = true,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const resolvedTitle =
    title ?? (permanent ? "Permanently delete?" : "Delete category?");
  const resolvedDescription =
    description ??
    (permanent
      ? "This action is irreversible. The category and all associated data will be permanently removed."
      : "This will move the category to trash. You can restore it at any time from the Deleted filter.");
  const resolvedLabel =
    confirmLabel ?? (permanent ? "Delete permanently" : "Move to trash");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }>
            {isLoading && <RefreshCw className="mr-2 size-3.5 animate-spin" />}
            {resolvedLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── EditDetailsDrawer ────────────────────────────────────────────────────────

export function EditDetailsDrawer({
  category,
  open,
  onClose,
  availableTags,
  availableCategories,
  onSuccess,
}: {
  category: PopulatedCategory | null;
  open: boolean;
  onClose: () => void;
  availableTags: string[];
  availableCategories: CategoryOption[];
  onSuccess: () => void;
}) {
  const updateCategory = useUpdateCategory({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      if (!category) return;
      await updateCategory.mutate({ id: category._id, payload: data });
    },
    [updateCategory, category],
  );

  if (!category) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-135 flex-col overflow-hidden p-0">
        {/* Header */}
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <div className="mb-1">
            <Badge
              variant="outline"
              className="border-primary/30 font-mono text-[10px] tracking-wider text-primary uppercase">
              Edit Category
            </Badge>
          </div>
          <SheetTitle>Edit Category</SheetTitle>
          <SheetDescription>
            Make changes to the category details below. Changes will not be
            saved until you click &quot;Save Changes&quot;.
          </SheetDescription>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CategoryForm
            initialData={{
              catName: category.catName,
              catDesc: category.catDesc,
              slug: category.slug,
              tags: category.tags ?? [],
              parentCategoryId: category.parentCategoryId,
            }}
            availableTags={availableTags}
            availableCategories={availableCategories}
            currentCategoryId={category._id}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save Changes"
            isLoading={updateCategory.isLoading}
            coverPreview={
              category.catCoverId
                ? {
                    fileId: category.catCoverId._id,
                    url: category.catCoverId.url,
                    thumbnailUrl: category.catCoverId.thumbnailUrl,
                  }
                : null
            }
          />
          {updateCategory.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {updateCategory.error?.message ?? "Failed to update category"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── CategoryListPanel ────────────────────────────────────────────────────────

export default function CategoryListPanel() {
  // ── Cover operations — uploadCover for the file transfer, linkCover to
  //    associate the orphan with a category in the file service. ─────────────
  const { uploadCover, linkCover } = useCategoryCover();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    permanent: boolean;
  }>({ permanent: false });
  const pendingDeleteRef = useRef<DeleteTarget | null>(null);

  // ── Bulk dialog state ──────────────────────────────────────────────────────
  const [bulkAlertOpen, setBulkAlertOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction | null>(
    null,
  );

  // ── Cover overrides ────────────────────────────────────────────────────────
  // Keyed by categoryId. Holds the optimistic Cloudinary URL while the server
  // mutation + refetch round-trip is in flight. Cleared only after the refetch
  // settles so we never flash back to the stale server image.
  const [coverUrlOverrides, setCoverUrlOverrides] = useState<
    Record<string, string>
  >({});

  // ── Data ───────────────────────────────────────────────────────────────────
  const {
    data: rawCategories,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllCategories(
    { includeDeleted: filterStatus === "deleted" },
    { enabled: true },
  );

  const { data: availableTags } = useAllTags();

  const categoriesArray = useMemo<PopulatedCategory[]>(() => {
    if (!Array.isArray(rawCategories)) return [];
    return (rawCategories as unknown as RawCategory[]).map(normaliseCategory);
  }, [rawCategories]);

  // ── Table state ────────────────────────────────────────────────────────────
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortDir,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    sorted,
    paginated,
    totalPages,
    safePage,
    pageNumbers,
    pageStart,
    pageEnd,
    handleSort,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  } = useTableState(categoriesArray, filterStatus);

  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      categoriesArray.map((c) => ({
        _id: c._id,
        catName: c.catName,
        slug: c.slug,
        parentCategoryId: c.parentCategoryId,
      })),
    [categoriesArray],
  );

  const stats = useMemo(
    () => ({
      total: categoriesArray.length,
      active: categoriesArray.filter((c) => c.isActive && !c.isDeleted).length,
      inactive: categoriesArray.filter((c) => !c.isActive && !c.isDeleted)
        .length,
      deleted: categoriesArray.filter((c) => c.isDeleted).length,
    }),
    [categoriesArray],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toggleActiveStatus = useToggleActiveStatus({ onSuccess: refetch });
  const restoreCategory = useRestoreCategory({ onSuccess: refetch });

  const deleteCategory = useDeleteCategory({
    onSuccess: () => {
      pendingDeleteRef.current = null;
      setDeleteAlertOpen(false);
      setDeleteError(null);
      refetch();
    },
    onError: (err) => setDeleteError(err.message),
  });

  const permanentlyDeleteCategory = usePermanentlyDeleteCategory({
    onSuccess: () => {
      pendingDeleteRef.current = null;
      setDeleteAlertOpen(false);
      setDeleteError(null);
      refetch();
    },
    onError: (err) => setDeleteError(err.message),
  });

  const bulkUpdateCategories = useBulkUpdateCategories();
  const bulkDeleteCategory = useDeleteCategory();
  const bulkRestoreCategory = useRestoreCategory();

  // No onSuccess here — handleCoverLinked owns the full lifecycle to avoid
  // a premature refetch racing against the optimistic override.
  const updateCoverImage = useUpdateCategoryImage();

  const isMutating =
    toggleActiveStatus.isLoading ||
    bulkUpdateCategories.isLoading ||
    deleteCategory.isLoading ||
    restoreCategory.isLoading ||
    permanentlyDeleteCategory.isLoading;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openDeleteAlert = useCallback((id: string, permanent: boolean) => {
    pendingDeleteRef.current = { id, permanent };
    setDeleteDialogProps({ permanent });
    setDeleteAlertOpen(true);
  }, []);

  const closeDeleteAlert = useCallback(() => {
    setDeleteAlertOpen(false);
    setDeleteError(null);
    pendingDeleteRef.current = null;
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const target = pendingDeleteRef.current;
    if (!target?.id) return;
    if (target.permanent) {
      permanentlyDeleteCategory.mutate(target.id);
    } else {
      deleteCategory.mutate(target.id);
    }
  }, [deleteCategory, permanentlyDeleteCategory]);

  // Cover upload lifecycle:
  //
  // 1. Set optimistic URL override so the row shows the new image immediately.
  // 2. Call linkCover to stamp entityId on the IFile record and archive any
  //    previous active cover — this must happen before updateCoverImage so the
  //    file service is consistent when catCoverId is written to the category.
  // 3. Call updateCoverImage to persist catCoverId on the category document.
  // 4. Await refetch so categoriesArray is fresh, then clear the override —
  //    the row now renders category.catCoverId.url from server data.
  //
  // On any failure the override is cleared immediately to revert the optimistic
  // display rather than permanently showing an image that was never saved.
  const handleCoverLinked = useCallback(
    async (categoryId: string, fileId: string, cloudinaryUrl: string) => {
      // 1. Optimistic display
      setCoverUrlOverrides((prev) => ({
        ...prev,
        [categoryId]: cloudinaryUrl,
      }));

      const clearOverride = () =>
        setCoverUrlOverrides((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });

      try {
        // 2. Associate the orphan file with the category in the file service
        await linkCover(categoryId, fileId);

        // 3. Persist catCoverId on the category document
        await updateCoverImage.mutate({
          id: categoryId,
          payload: { catCoverId: fileId },
        });

        // 4. Fresh data in, then drop the override
        await refetch();
        clearOverride();
      } catch {
        // Revert the optimistic override on failure
        clearOverride();
      }
    },
    [linkCover, updateCoverImage, refetch],
  );

  const bulkOptions = useMemo<BulkOption[]>(() => {
    const sel = categoriesArray.filter((c) => selectedIds.includes(c._id));
    const allDeleted = sel.length > 0 && sel.every((c) => c.isDeleted);
    return [
      {
        show: !allDeleted && sel.some((c) => !c.isActive && !c.isDeleted),
        action: "activate",
        label: "Activate",
      },
      {
        show: !allDeleted && sel.some((c) => c.isActive && !c.isDeleted),
        action: "deactivate",
        label: "Deactivate",
      },
      {
        show: sel.some((c) => c.isDeleted),
        action: "restore",
        label: "Restore",
      },
      {
        show: sel.some((c) => !c.isDeleted),
        action: "delete",
        label: "Delete",
        destructive: true,
      },
    ];
  }, [categoriesArray, selectedIds]);

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (!selectedIds.length) return;
      const ids = [...selectedIds];
      if (action === "activate" || action === "deactivate") {
        await bulkUpdateCategories.mutate(
          ids.map((id) => ({
            id,
            update: { isActive: action === "activate" },
          })),
        );
      } else {
        await Promise.allSettled(
          ids.map((id) =>
            action === "delete"
              ? bulkDeleteCategory.mutate(id)
              : bulkRestoreCategory.mutate(id),
          ),
        );
      }
      clearSelection();
      setBulkAlertOpen(false);
      setPendingBulkAction(null);
      refetch();
    },
    [
      selectedIds,
      bulkUpdateCategories,
      bulkDeleteCategory,
      bulkRestoreCategory,
      clearSelection,
      refetch,
    ],
  );

  const allPageSelected =
    paginated.length > 0 && paginated.every((c) => selectedIds.includes(c._id));

  // ── Early returns ──────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <LoadingOverlay message="Getting categories ready, please wait…" show />
    );

  if (isError)
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          Error loading categories: {error?.message}
        </AlertDescription>
      </Alert>
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <CategoryHeader
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPageReset={() => setPage(1)}
        selectedIds={selectedIds}
        bulkOptions={bulkOptions}
        onBulkAction={(action) => {
          setPendingBulkAction(action);
          setBulkAlertOpen(true);
        }}
        onClearSelection={clearSelection}
        onNewCategory={() => setShowCreateDrawer(true)}
      />

      <CategoryTable
        isLoading={isLoading}
        paginated={paginated}
        selectedIds={selectedIds}
        allPageSelected={allPageSelected}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        isMutating={isMutating}
        allCategories={categoriesArray}
        // uploadCover handles the file transfer only — returns fileId + URL
        // without touching the category. linkCover is called subsequently
        // inside handleCoverLinked once the row reports onCoverLinked.
        onUploadCover={uploadCover}
        coverUrlOverrides={coverUrlOverrides}
        onCoverLinked={handleCoverLinked}
        onEditDetails={setEditingId}
        onToggleActive={(id) => toggleActiveStatus.mutate(id)}
        onDelete={(id) => openDeleteAlert(id, false)}
        onRestore={(id) => restoreCategory.mutate(id)}
        onPermanentDelete={(id) => openDeleteAlert(id, true)}
      />

      <CategoryFooter
        stats={stats}
        filterStatus={filterStatus}
        totalItems={sorted.length}
        pageStart={pageStart}
        pageEnd={pageEnd}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        safePage={safePage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageChange={setPage}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      <CreateCategoryDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSuccess={refetch}
        availableTags={availableTags ?? []}
        availableCategories={categoryOptions}
      />

      <EditDetailsDrawer
        category={
          editingId
            ? (categoriesArray.find((c) => c._id === editingId) ?? null)
            : null
        }
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        availableTags={availableTags ?? []}
        availableCategories={categoryOptions}
        onSuccess={refetch}
      />

      {/* Single-item delete */}
      <DeleteConfirmDialog
        open={deleteAlertOpen}
        onOpenChange={(o) => {
          if (!o) closeDeleteAlert();
        }}
        permanent={deleteDialogProps.permanent}
        isLoading={
          deleteCategory.isLoading || permanentlyDeleteCategory.isLoading
        }
        error={deleteError}
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk action confirmation */}
      <DeleteConfirmDialog
        open={bulkAlertOpen}
        onOpenChange={(o) => {
          if (!o) {
            setBulkAlertOpen(false);
            setPendingBulkAction(null);
          }
        }}
        title={`${pendingBulkAction ? BULK_LABELS[pendingBulkAction] : ""} categories?`}
        description={
          pendingBulkAction
            ? `${selectedIds.length} ${selectedIds.length === 1 ? "category" : "categories"} will be ${BULK_DESCRIPTIONS[pendingBulkAction]}.`
            : ""
        }
        confirmLabel={
          pendingBulkAction ? BULK_LABELS[pendingBulkAction] : "Confirm"
        }
        destructive={pendingBulkAction === "delete"}
        isLoading={
          bulkUpdateCategories.isLoading ||
          bulkDeleteCategory.isLoading ||
          bulkRestoreCategory.isLoading
        }
        onConfirm={() => {
          if (pendingBulkAction) handleBulkAction(pendingBulkAction);
        }}
      />
    </div>
  );
}
