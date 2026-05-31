// types/services/categories/service.category.types.ts

import { BaseEntity, SoftDeletable } from "@/types/base.types";
import { Service } from "../service.types";

// ── Populated sub-shapes ───────────────────────────────────────────────────────

/** Populated cover image asset returned by the API */
export interface CategoryCover {
  _id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt?: string;
}

/** Populated parent reference returned by the API */
export interface CategoryParentRef {
  _id: string;
  catName: string;
  slug: string;
}

// ── Core entity ───────────────────────────────────────────────────────────────

export interface Category extends BaseEntity, SoftDeletable {
  catName: string;
  catDesc: string;
  /** Populated cover image, or just the _id string before population */
  catCoverId?: CategoryCover | string | null;
  tags?: string[];
  isActive: boolean;
  /**
   * Populated parent ref from API, or a plain _id string.
   * Always normalised to a plain string _id in the UI layer via normaliseCategory().
   */
  parentCategoryId?: CategoryParentRef | string | null;
  slug: string;
  createdBy?: string;
  lastModifiedBy?: string;
  /** Total number of services linked to this category */
  servicesCount?: number;
}

/**
 * A category with optional populated relations —
 * mirrors CategoryWithServices from the backend.
 */
export interface CategoryWithServices extends Category {
  services?: Service[];
  servicesCount?: number;
  popularServices?: Service[];
  /** Populated subcategories (recursive — mirrors the backend tree) */
  subcategories?: CategoryWithServices[];
}

/**
 * A plain serialised category object suitable for tree traversal,
 * breadcrumb building, and select/dropdown components.
 */
export interface CategoryObject extends Category {
  subcategories?: CategoryObject[];
  services?: Service[];
}

/** Shape returned by GET /api/category/suggest */
export interface CategorySuggestion {
  _id: string;
  catName: string;
  catDesc: string;
  slug: string;
  tags?: string[];
  score: number;
}
