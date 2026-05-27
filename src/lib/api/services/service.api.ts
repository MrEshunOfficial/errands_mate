// lib/api/services/service.api.ts
import {
  ServiceWithVirtuals,
  ServiceSearchResult,
  ServicePricingInput,
} from "@/types/services/service.types";
import { APIClient } from "../base/api-client";

// =============================================================================
// Shared pagination params — defined and exported here so hooks can import it
// =============================================================================

// ✅ Fix 2: PaginationParams was referenced in both files but never defined
// or exported from anywhere. Defining it here as the single source of truth.
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// =============================================================================
// Response shapes
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[]; // ← the key
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Raw shape returned by the server for list endpoints:
 * { success, message, services: [...], total, hasMore }
 */
interface RawServiceListResponse<T> {
  services: T[];
  total: number;
  hasMore: boolean;
  success?: boolean;
  message?: string;
}


// =============================================================================
// Param / payload types
// =============================================================================

export interface SearchServicesParams extends PaginationParams {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  pricingModel?: string;
  currency?: string;
  providerId?: string;
}

export interface GetServicesByCategoryParams extends PaginationParams {
  includeInactive?: boolean;
}

export interface GetServicesByProviderParams extends PaginationParams {
  includeInactive?: boolean;
}

export interface GetAllServicesParams extends PaginationParams {
  includeDeleted?: boolean;
}

export interface AutoActivationStatus {
  isScheduled: boolean;
  scheduledAt?: string;
  activatesAt?: string;
}

export interface ServiceStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  suspended: number;
  deleted: number;
}

export interface CreateServicePayload {
  title: string;
  slug: string;
  description?: string;
  categoryId: string;
  tags?: string[];
  coverImage?: string;
  servicePricing?: ServicePricingInput;
  isPrivate: boolean;
  isActive?: boolean;
  scheduledActivationAt?: string;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface UpdateCoverImagePayload {
  coverImageId: string;
}

export interface RejectServicePayload {
  reason: string;
}

export interface BulkUpdatePayload {
  ids: string[];
  update: Partial<{ isActive: boolean; isPrivate: boolean }>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Derives the virtual fields that the backend computes as Mongoose virtuals.
 * These are not included in plain JSON API responses, so we compute them
 * client-side as a fallback so the UI always has consistent data to render.
 */
function hydrateService(service: ServiceWithVirtuals): ServiceWithVirtuals {
  // --- Moderation state ---
  // Always derive from the raw timestamp fields — Mongoose virtuals may not
  // serialize correctly and the API can return isApproved: false even when
  // approvedAt is set, which would cause the ?? fallback to be skipped.
  const isDeleted = service.isDeleted ?? false;
  const isApproved = !!service.approvedAt && !isDeleted;
  const isRejected = !!service.rejectedAt && !isDeleted;
  const isPending = !isApproved && !isRejected && !isDeleted;
  const isPendingAutoActivation =
    service.isPendingAutoActivation ??
    (!!service.scheduledActivationAt &&
      new Date(service.scheduledActivationAt) > new Date() &&
      !isApproved &&
      !isRejected &&
      !isDeleted);

  // --- Financial virtuals ---
  const sp = service.servicePricing;
  let providerEarnings = service.providerEarnings ?? null;
  let effectivePrice = service.effectivePrice ?? null;

  if (sp && sp.pricingModel !== "free" && sp.pricingModel !== "negotiable") {
    const base = sp.basePrice ?? sp.tiers?.[0]?.basePrice;
    if (base !== undefined) {
      // commissionRateSnapshot is always present on stored ServicePricing objects
      // returned by the API. Fallback to 0 only for display-only contexts where
      // the snapshot was not yet returned (e.g. optimistic UI).
      const commission = sp.commissionRateSnapshot ?? 0;
      if (providerEarnings === null && commission > 0) {
        providerEarnings = parseFloat((base * (1 - commission)).toFixed(2));
      }
      if (effectivePrice === null) {
        effectivePrice = sp.taxIncluded
          ? base
          : parseFloat((base * (1 + (sp.taxRate ?? 0))).toFixed(2));
      }
    }
  }

  return {
    ...service,
    isApproved,
    isRejected,
    isPending,
    isPendingAutoActivation,
    providerEarnings,
    effectivePrice,
    hasTiers: service.hasTiers ?? (sp?.tiers?.length ?? 0) > 0,
  };
}

// ✅ Fix 3: The original overload signatures were ambiguous — the generic
// overload `normalizePaginated<T>(raw, limit?)` shadowed the specific
// `ServiceWithVirtuals` overload, causing the implementation to be
// unreachable for that overload in some TS versions.
// Consolidating into a single generic function eliminates the overload
// conflict entirely while preserving all call-site behaviour.
function normalizePaginated<T>(
  raw: RawServiceListResponse<T>,
  limit?: number,
): PaginatedResponse<T> {
  const total = raw.total ?? 0;
  const items = (raw.services ?? []).map((item) => {
    if (item && typeof item === "object" && "title" in item) {
      return hydrateService(
        item as unknown as ServiceWithVirtuals,
      ) as unknown as T;
    }
    return item;
  });
  return {
    items,
    total,
    hasMore: raw.hasMore ?? false,
    totalPages: limit && limit > 0 ? Math.ceil(total / limit) : 1,
  };
}

// =============================================================================
// Service API class
// =============================================================================

class ServiceAPI extends APIClient {
  private readonly BASE = "/api/services";
  private readonly ADMIN = `${this.BASE}/admin`;

  // ---------------------------------------------------------------------------
  // Public browsing
  // ---------------------------------------------------------------------------

  /** GET /services?page&limit */
  async getActiveServices(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ServiceWithVirtuals>> {
    const raw = await this.get<RawServiceListResponse<ServiceWithVirtuals>>(
      this.BASE,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/search?q=... */
  async searchServices(
    params?: SearchServicesParams,
  ): Promise<PaginatedResponse<ServiceSearchResult>> {
    const raw = await this.get<RawServiceListResponse<ServiceSearchResult>>(
      `${this.BASE}/search`,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/slug/:slug?details=true */
  async getServiceBySlug(
    slug: string,
    details?: boolean,
  ): Promise<ServiceWithVirtuals> {
    return this.get<ServiceWithVirtuals>(`${this.BASE}/slug/${slug}`, {
      ...(details !== undefined && { details: String(details) }),
    });
  }

  /** GET /services/category/:categoryId?page&limit */
  async getServicesByCategory(
    categoryId: string,
    params?: GetServicesByCategoryParams,
  ): Promise<PaginatedResponse<ServiceWithVirtuals>> {
    const raw = await this.get<RawServiceListResponse<ServiceWithVirtuals>>(
      `${this.BASE}/category/${categoryId}`,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/:id?details=true */
  async getServiceById(
    id: string,
    details?: boolean,
  ): Promise<ServiceWithVirtuals> {
    return this.get<ServiceWithVirtuals>(`${this.BASE}/${id}`, {
      ...(details !== undefined && { details: String(details) }),
    });
  }

  /** GET /services/:id/details */
  async getCompleteService(id: string): Promise<ServiceWithVirtuals> {
    return this.get<ServiceWithVirtuals>(`${this.BASE}/${id}/details`);
  }

  // ---------------------------------------------------------------------------
  // Public utility checks
  // ---------------------------------------------------------------------------

  /** GET /services/check/exists/:id */
  async serviceExists(id: string): Promise<{ exists: boolean }> {
    return this.get<{ exists: boolean }>(`${this.BASE}/check/exists/${id}`);
  }

  /** GET /services/check/slug?slug=...&excludeId= */
  async isSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<{ available: boolean }> {
    return this.get<{ available: boolean }>(`${this.BASE}/check/slug`, {
      slug,
      ...(excludeId && { excludeId }),
    });
  }

  // ---------------------------------------------------------------------------
  // Authenticated — provider
  // ---------------------------------------------------------------------------

  /** GET /services/provider/:providerId?includeInactive&page&limit */
  async getServicesByProvider(
    params?: GetServicesByProviderParams,
  ): Promise<PaginatedResponse<ServiceWithVirtuals>> {
    const raw = await this.get<RawServiceListResponse<ServiceWithVirtuals>>(
      `${this.BASE}/provider/me`,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/:id/activation-status */
  async getAutoActivationStatus(id: string): Promise<AutoActivationStatus> {
    return this.get<AutoActivationStatus>(
      `${this.BASE}/${id}/activation-status`,
    );
  }

  /** POST /services */
  async createService(
    payload: CreateServicePayload,
  ): Promise<ServiceWithVirtuals> {
    return this.post<ServiceWithVirtuals>(this.BASE, payload);
  }

  /** PUT /services/:id */
  async updateService(
    id: string,
    payload: UpdateServicePayload,
  ): Promise<ServiceWithVirtuals> {
    return this.put<ServiceWithVirtuals>(`${this.BASE}/${id}`, payload);
  }

  /** DELETE /services/:id  (soft delete) */
  async deleteService(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.BASE}/${id}`);
  }

  /** PATCH /services/:id/privacy */
  async togglePrivateStatus(id: string): Promise<ServiceWithVirtuals> {
    return this.patch<ServiceWithVirtuals>(`${this.BASE}/${id}/privacy`);
  }

  /** PATCH /services/:id/cover  — body: { coverImageId } */
  async updateCoverImage(
    id: string,
    payload: UpdateCoverImagePayload,
  ): Promise<ServiceWithVirtuals> {
    return this.patch<ServiceWithVirtuals>(`${this.BASE}/${id}/cover`, payload);
  }

  /** DELETE /services/:id/cover */
  async removeCoverImage(id: string): Promise<ServiceWithVirtuals> {
    return this.delete<ServiceWithVirtuals>(`${this.BASE}/${id}/cover`);
  }

  // ---------------------------------------------------------------------------
  // Admin — queries
  // ---------------------------------------------------------------------------

  /** GET /services/admin/all?page&limit&includeDeleted */
  async getAllServices(
    params?: GetAllServicesParams,
  ): Promise<PaginatedResponse<ServiceWithVirtuals>> {
    const raw = await this.get<RawServiceListResponse<ServiceWithVirtuals>>(
      `${this.ADMIN}/all`,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/admin/pending?page&limit */
  async getPendingServices(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ServiceWithVirtuals>> {
    const raw = await this.get<RawServiceListResponse<ServiceWithVirtuals>>(
      `${this.ADMIN}/pending`,
      params as Record<string, string | number | boolean | undefined>,
    );
    return normalizePaginated(raw, params?.limit);
  }

  /** GET /services/admin/stats?providerId */
  async getServiceStats(providerId?: string): Promise<ServiceStats> {
    return this.get<ServiceStats>(`${this.ADMIN}/stats`, {
      ...(providerId && { providerId }),
    });
  }

  // ---------------------------------------------------------------------------
  // Admin — mutations
  // ---------------------------------------------------------------------------

  /** POST /services/admin/:id/approve */
  async approveService(id: string): Promise<ServiceWithVirtuals> {
    return this.post<ServiceWithVirtuals>(`${this.ADMIN}/${id}/approve`);
  }

  /** POST /services/admin/:id/reject  — body: { reason } */
  async rejectService(
    id: string,
    payload: RejectServicePayload,
  ): Promise<ServiceWithVirtuals> {
    return this.post<ServiceWithVirtuals>(
      `${this.ADMIN}/${id}/reject`,
      payload,
    );
  }

  /** POST /services/admin/:id/restore */
  async restoreService(id: string): Promise<ServiceWithVirtuals> {
    return this.post<ServiceWithVirtuals>(`${this.ADMIN}/${id}/restore`);
  }

  /** DELETE /services/admin/:id/permanent */
  async permanentlyDeleteService(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.ADMIN}/${id}/permanent`);
  }

  /** PATCH /services/admin/bulk */
  async bulkUpdateServices(
    payload: BulkUpdatePayload,
  ): Promise<{ modifiedCount: number }> {
    return this.patch<{ modifiedCount: number }>(`${this.ADMIN}/bulk`, payload);
  }

  /** POST /services/admin/process-activations */
  async processScheduledActivations(): Promise<{ processed: number }> {
    return this.post<{ processed: number }>(
      `${this.ADMIN}/process-activations`,
    );
  }
}

// =============================================================================
// Singleton export
// =============================================================================

export const serviceAPI = new ServiceAPI();
