// =============================================================================
// Request payloads
// =============================================================================

import {
  Category,
  CategoryObject,
  CategoryWithServices,
} from "@/types/services/categories/service.category.types";
import { APIClient, APIError } from "../../base/api-client";

export interface CreateCategoryPayload {
  catName: string;
  catDesc: string;
  slug: string;
  tags?: string[];
  isActive?: boolean;
  parentCategoryId?: string;
  catCoverId?: string;
}

export type UpdateCategoryPayload = Partial<
  Omit<CreateCategoryPayload, "parentCategoryId">
> & {
  /**
   * Pass `null` to explicitly detach from a parent (liberate to top-level).
   * Pass a string _id to reparent. Omit entirely to leave unchanged.
   *
   * NOTE: `undefined` is intentionally excluded here — it is stripped by
   * JSON.stringify and would silently leave the field unchanged on the server.
   * Always use `null` when the intent is "remove the parent".
   */
  parentCategoryId?: string | null;
};

export interface BulkUpdateCategoryItem {
  id: string;
  update: UpdateCategoryPayload;
}

export interface UpdateCategoryImagePayload {
  catCoverId: string;
}

// =============================================================================
// Response shapes
// =============================================================================

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  topLevel: number;
  withSubcategories: number;
}

export interface SlugAvailabilityResult {
  slug: string;
  available: boolean;
}

export interface CategoryExistsResult {
  id: string;
  exists: boolean;
}

export interface CategoryImageStatus {
  id: string;
  catCoverId: string | null;
  /** True when catCoverId resolves to a live asset */
  imageResolved: boolean;
}

export interface RepairCoverLinksResult {
  repaired: number;
  failed: number;
  details?: Array<{ id: string; error: string }>;
}

export interface BulkUpdateResult {
  modifiedCount: number;
  skippedIds: Array<{ id: string; reason: string }>;
}

// =============================================================================
// Query param shapes
// =============================================================================

export interface SearchCategoriesParams extends Record<
  string,
  string | number | boolean | undefined
> {
  q: string;
  limit?: number;
  page?: number;
  isActive?: boolean;
}

export interface GetAllCategoriesParams extends Record<
  string,
  string | number | boolean | undefined
> {
  /** Include soft-deleted records. Admin only. */
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// Category API client
// =============================================================================

export class CategoryAPI extends APIClient {
  private readonly base = "/api/category";

  // --------------------------------------------------------------------------
  // Public — search & filtering
  // --------------------------------------------------------------------------

  async searchCategories(params: SearchCategoriesParams): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/search`, params);
  }

  async getAllTags(): Promise<string[]> {
    return this.get<string[]>(`${this.base}/tags`);
  }

  async getCategoriesByTag(tag: string): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/tag/${encodeURIComponent(tag)}`);
  }

  // --------------------------------------------------------------------------
  // Public — hierarchy & structure
  // --------------------------------------------------------------------------

  async getCategoryHierarchy(): Promise<CategoryObject[]> {
    return this.get<CategoryObject[]>(`${this.base}/hierarchy`);
  }

  async getTopLevelCategories(): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/top-level`);
  }

  async getActiveCategories(): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/active`);
  }

  // --------------------------------------------------------------------------
  // Public — single category
  // --------------------------------------------------------------------------

  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.get<Category>(`${this.base}/slug/${encodeURIComponent(slug)}`);
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.get<Category>(`${this.base}/${id}`);
  }

  async getCompleteCategory(id: string): Promise<CategoryWithServices> {
    return this.get<CategoryWithServices>(`${this.base}/${id}/complete`);
  }

  async getSubcategories(id: string): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/${id}/subcategories`);
  }

  // --------------------------------------------------------------------------
  // Admin — read
  // --------------------------------------------------------------------------

  async getCategoryStats(): Promise<CategoryStats> {
    return this.get<CategoryStats>(`${this.base}/stats`);
  }

  async checkSlugAvailability(slug: string): Promise<SlugAvailabilityResult> {
    return this.get<SlugAvailabilityResult>(
      `${this.base}/slug/${encodeURIComponent(slug)}/available`,
    );
  }

  async getAllCategories(params?: GetAllCategoriesParams): Promise<Category[]> {
    return this.get<Category[]>(`${this.base}/admin/all`, params);
  }

  async checkCategoryExists(id: string): Promise<CategoryExistsResult> {
    return this.get<CategoryExistsResult>(`${this.base}/${id}/exists`);
  }

  async getCategoryImageStatus(id: string): Promise<CategoryImageStatus> {
    return this.get<CategoryImageStatus>(`${this.base}/${id}/image-status`);
  }

  // --------------------------------------------------------------------------
  // Admin — write
  // --------------------------------------------------------------------------

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    return this.post<Category>(`${this.base}/new`, payload);
  }

  async bulkImportCategories(file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", file);

    // Do NOT use this.post() here — the base client JSON.stringifies the body
    // and sets Content-Type: application/json, which destroys the multipart
    // boundary. We call fetch directly and let the browser set the correct
    // Content-Type: multipart/form-data; boundary=... header automatically.
    const response = await fetch(`${this.base}/admin/bulk-import`, {
      method: "POST",
      credentials: "include", // forwards the auth cookie, same as the base client
      body: formData, // no Content-Type header — browser sets it with boundary
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      const error = new Error(text || "Bulk import failed") as APIError;
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Update a category.
   *
   * Serialisation note: `parentCategoryId: null` survives JSON.stringify as
   * the literal `null` — unlike `undefined`, which is stripped entirely.
   * The form always sends `null` (never `undefined`) when clearing a parent,
   * so no custom replacer is needed here.
   */
  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload,
  ): Promise<Category> {
    return this.put<Category>(`${this.base}/${id}`, payload);
  }

  async updateCoverImage(
    id: string,
    payload: UpdateCategoryImagePayload,
  ): Promise<Category> {
    return this.put<Category>(`${this.base}/${id}/cover-image`, payload);
  }

  async toggleActiveStatus(id: string): Promise<Category> {
    return this.patch<Category>(`${this.base}/${id}/toggle-active`);
  }

  async bulkUpdateCategories(
    items: BulkUpdateCategoryItem[],
  ): Promise<BulkUpdateResult> {
    return this.put<BulkUpdateResult>(`${this.base}/bulk-update`, { items });
  }

  // --------------------------------------------------------------------------
  // Admin — delete & restore
  // --------------------------------------------------------------------------

  async deleteCategory(id: string): Promise<Category> {
    return this.delete<Category>(`${this.base}/${id}`);
  }

  async restoreCategory(id: string): Promise<Category> {
    return this.post<Category>(`${this.base}/${id}/restore`);
  }

  async permanentlyDeleteCategory(id: string): Promise<{ deleted: boolean }> {
    return this.delete<{ deleted: boolean }>(`${this.base}/${id}/permanent`);
  }

  // --------------------------------------------------------------------------
  // Admin — maintenance
  // --------------------------------------------------------------------------

  async repairCoverLinks(): Promise<RepairCoverLinksResult> {
    return this.post<RepairCoverLinksResult>(`${this.base}/repair-cover-links`);
  }
}

// =============================================================================
// Singleton
// =============================================================================

export const categoryAPI = new CategoryAPI();
