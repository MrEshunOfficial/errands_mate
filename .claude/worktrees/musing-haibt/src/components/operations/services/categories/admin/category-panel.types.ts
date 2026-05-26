// ─── Shared types & constants for CategoryListPanel ──────────────────────────

export interface PopulatedCategory {
  _id: string;
  catName: string;
  catDesc: string;
  slug: string;
  isActive: boolean;
  isDeleted: boolean;
  tags?: string[];
  parentCategoryId?: string;
  catCoverId?: {
    _id: string;
    url: string;
    thumbnailUrl: string;
  };
  servicesCount?: number;
}

export interface RawCategory {
  _id: unknown;
  parentCategoryId?: unknown;
  servicesCount?: number;
  services?: unknown[];
  [key: string]: unknown;
}

export type FilterStatus = "active" | "inactive" | "deleted";
export type BulkAction = "activate" | "deactivate" | "delete" | "restore";
export type SortField = "catName" | "slug" | "isActive";
export type SortDir = "asc" | "desc";

export interface BulkOption {
  show: boolean;
  action: BulkAction;
  label: string;
  destructive?: boolean;
}

export interface DeleteTarget {
  id: string;
  permanent: boolean;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const BULK_LABELS: Record<BulkAction, string> = {
  activate: "Activate",
  deactivate: "Deactivate",
  delete: "Delete",
  restore: "Restore",
};

export const BULK_DESCRIPTIONS: Record<BulkAction, string> = {
  activate: "set to active",
  deactivate: "deactivated",
  delete: "moved to trash",
  restore: "restored from trash",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof (value as { toString?: () => string }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }
  return String(value);
}

export function normaliseCategory(raw: RawCategory): PopulatedCategory {
  const parent = raw.parentCategoryId;
  const parentId = parent
    ? typeof parent === "object" && parent !== null && "_id" in parent
      ? toStr((parent as { _id: unknown })._id)
      : toStr(parent)
    : undefined;

  const servicesCount =
    typeof raw.servicesCount === "number"
      ? raw.servicesCount
      : Array.isArray(raw.services)
        ? raw.services.length
        : undefined;

  return {
    ...(raw as unknown as PopulatedCategory),
    _id: toStr(raw._id),
    parentCategoryId: parentId,
    servicesCount,
  };
}
