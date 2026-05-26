// ─── Local cast helper ────────────────────────────────────────────────────────

import { APIClient } from "../base/api-client";
import { Service } from "@/types/services/service.types";
import {
  ProviderProfile,
  PopulatedProviderProfile,
  ObjectId,
  GetProviderProfileByIdParams,
  GetServiceOfferingsParams,
  UpdateProviderProfileBody,
  UpdateLocationBody,
  UpdateWorkingHoursBody,
  SetAvailabilityBody,
  GetAllProvidersParams,
  GetProviderStatsParams,
  ProviderStatsResponse,
  ProviderProfileListResponse,
} from "@/types/provider.profile.types";

type QP = Record<string, string | number | boolean | undefined>;

// ─── Internal response shapes ─────────────────────────────────────────────────

interface _SingleProfileRes {
  providerProfile: ProviderProfile | PopulatedProviderProfile;
}

interface _ServiceListRes {
  services: Service[];
}

interface _LocationVerifyRes {
  verified: boolean;
  discrepancies: string[];
  locationData: unknown;
}

// ─── Browse params ────────────────────────────────────────────────────────────
// Maps 1-to-1 onto the query surface documented in ProviderBrowseHandler.

export type BrowseSortBy = "distance" | "createdAt" | "businessName";
export type BrowseOrder = "asc" | "desc";

export interface BrowseProvidersParams {
  /** Full-text search on businessName */
  q?: string;
  /** Case-insensitive region match */
  region?: string;
  /** Case-insensitive city match */
  city?: string;
  /** Filter to providers offering this service */
  serviceId?: ObjectId;
  /** "true" filters to always-available providers */
  isAlwaysAvailable?: boolean;
  /** ProviderStatus enum value */
  status?: string;
  /** "true" filters to address-verified providers */
  isAddressVerified?: boolean;
  /** Client latitude — must be paired with lng */
  lat?: number;
  /** Client longitude — must be paired with lat */
  lng?: number;
  /** Nearby radius in km (default 10, max 200) */
  radiusKm?: number;
  sortBy?: BrowseSortBy;
  order?: BrowseOrder;
  /** 1-based page number (default 1) */
  page?: number;
  /** Results per page (default 20, max 100) */
  limit?: number;
}

export interface BrowseProvidersResponse {
  providers: ProviderProfile[];
  nearbyProviders: ProviderProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  radiusKm: number;
  appliedFilters: Record<string, unknown>;
}

// ─── Isolated update-body types ───────────────────────────────────────────────

export interface UpdateBusinessNameBody {
  businessName: string;
}

export interface UpdateProviderStatusBody {
  status: string;
}

// ─── API Client ────────────────────────────────────────────────────────────────

export class ProviderProfileAPI extends APIClient {
  private readonly base = "/api/providers";

  // ─── Public: Browse & Discovery ───────────────────────────────────────────────

  /**
   * Unified public provider discovery with full filter + sort surface.
   * Replaces the former search / by-location / near / by-service endpoints.
   * GET /providers/browse
   *
   * Supply lat + lng to annotate results with distanceKm and populate
   * nearbyProviders within radiusKm. Omitting coordinates returns an
   * un-annotated list sorted by createdAt desc.
   */
  async browseProviders(
    params?: BrowseProvidersParams,
  ): Promise<BrowseProvidersResponse> {
    return this.get<BrowseProvidersResponse>(
      `${this.base}/browse`,
      params as QP,
    );
  }

  // ─── Public: Profile & Services ───────────────────────────────────────────────

  /**
   * Public profile view.
   * GET /providers/:profileId
   *
   * Pass populate: true for sub-documents (serviceOfferings, gallery,
   * UserProfile ref) to be fully expanded.
   */
  async getProviderProfileById(
    profileId: ObjectId,
    params?: GetProviderProfileByIdParams,
  ): Promise<ProviderProfile | PopulatedProviderProfile> {
    const res = await this.get<_SingleProfileRes>(
      `${this.base}/${profileId}`,
      params as QP,
    );
    return res.providerProfile;
  }

  /**
   * Active services linked to a profile.
   * Owner / admin may pass includeInactive: true to see all services.
   * GET /providers/:profileId/services
   */
  async getServiceOfferings(
    profileId: ObjectId,
    params?: GetServiceOfferingsParams,
  ): Promise<Service[]> {
    const res = await this.get<_ServiceListRes>(
      `${this.base}/${profileId}/services`,
      params as QP,
    );
    return res.services ?? [];
  }

  // ─── Authenticated Provider: Own Profile ──────────────────────────────────────

  /**
   * Returns the calling provider's full profile (always populated).
   * Resolved server-side via the caller's UserProfile._id.
   * GET /providers/me
   */
  async getMyProviderProfile(): Promise<ProviderProfile> {
    const res = await this.get<_SingleProfileRes>(`${this.base}/me`);
    return res.providerProfile as ProviderProfile;
  }

  // ─── Authenticated Provider: Profile Updates ──────────────────────────────────

  /**
   * General-purpose field update.
   * For structured sub-documents (location, working hours, availability, status)
   * prefer the dedicated methods below — they run server-side validation and
   * enrichment that this method intentionally skips.
   * PUT /providers/:profileId
   */
  async updateProviderProfile(
    profileId: ObjectId,
    body: UpdateProviderProfileBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Update the provider's business display name only.
   * PUT /providers/:profileId/business-name
   *
   * Body: { "businessName": "Akua Cleaning Services" }
   */
  async updateBusinessName(
    profileId: ObjectId,
    body: UpdateBusinessNameBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}/business-name`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Update the provider's operational status (Available, Booked, closed, requested).
   * PUT /providers/:profileId/status
   *
   * Body: { "status": "Available" }
   */
  async updateProviderStatus(
    profileId: ObjectId,
    body: UpdateProviderStatusBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}/status`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Enrich and persist location data from a Ghana Post GPS code.
   * PUT /providers/:profileId/location
   *
   * Body: { ghanaPostGPS, nearbyLandmark?, gpsCoordinates? }
   * Response includes missingFields[] when OSM could not resolve all fields.
   */
  async updateLocationData(
    profileId: ObjectId,
    body: UpdateLocationBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}/location`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Re-run enrichment to check if the stored address is still accurate.
   * Does NOT stamp isAddressVerified — only the admin endpoint writes that flag.
   * POST /providers/:profileId/location/verify
   */
  async checkLocationVerification(
    profileId: ObjectId,
  ): Promise<_LocationVerifyRes> {
    return this.post<_LocationVerifyRes>(
      `${this.base}/${profileId}/location/verify`,
    );
  }

  /**
   * Replace the working hours map. Always sets isAlwaysAvailable: false.
   * PUT /providers/:profileId/working-hours
   *
   * Body: { workingHours: { monday: { start: "09:00", end: "17:00" }, … } }
   */
  async updateWorkingHours(
    profileId: ObjectId,
    body: UpdateWorkingHoursBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}/working-hours`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Set availability mode and optionally working hours together.
   * PUT /providers/:profileId/availability
   *
   * Body (always available):  { isAlwaysAvailable: true }
   * Body (specific hours):    { isAlwaysAvailable: false, workingHours: { … } }
   *
   * When isAlwaysAvailable is true existing workingHours are cleared.
   */
  async setAvailability(
    profileId: ObjectId,
    body: SetAvailabilityBody,
  ): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/${profileId}/availability`,
      body,
    );
    return res.providerProfile as ProviderProfile;
  }

  // ─── Authenticated Provider: Soft Delete / Restore ───────────────────────────

  /**
   * Soft-delete the provider profile (sets isDeleted: true).
   * DELETE /providers/:profileId
   */
  async deleteProviderProfile(profileId: ObjectId): Promise<void> {
    await this.delete<void>(`${this.base}/${profileId}`);
  }

  /**
   * Restore a soft-deleted provider profile.
   * POST /providers/:profileId/restore
   */
  async restoreProviderProfile(profileId: ObjectId): Promise<ProviderProfile> {
    const res = await this.post<_SingleProfileRes>(
      `${this.base}/${profileId}/restore`,
    );
    return res.providerProfile as ProviderProfile;
  }

  // ─── Admin-only ────────────────────────────────────────────────────────────────

  /**
   * Paginated list of all providers with full population.
   * Pass includeDeleted: true to include soft-deleted profiles.
   * GET /providers/admin/all
   */
  async getAllProviders(
    params?: GetAllProvidersParams,
  ): Promise<ProviderProfileListResponse> {
    return this.get<ProviderProfileListResponse>(
      `${this.base}/admin/all`,
      params as QP,
    );
  }

  /**
   * Platform-wide stats. Pass providerId to scope to one provider.
   * GET /providers/admin/stats
   */
  async getProviderStats(
    params?: GetProviderStatsParams,
  ): Promise<ProviderStatsResponse> {
    return this.get<ProviderStatsResponse>(
      `${this.base}/admin/stats`,
      params as QP,
    );
  }

  /**
   * Look up a ProviderProfile by its parent UserProfile._id.
   * Useful for cross-service lookups where only the UserProfile ID is known.
   * GET /providers/admin/ref/:userProfileId
   */
  async getProviderProfileByRef(
    userProfileId: ObjectId,
  ): Promise<ProviderProfile> {
    const res = await this.get<_SingleProfileRes>(
      `${this.base}/admin/ref/${userProfileId}`,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Stamp isAddressVerified = true after a human has confirmed the address.
   * Re-runs LocationService verification internally and logs any discrepancies,
   * but the admin's decision takes precedence over OSM.
   * PUT /providers/admin/:profileId/verify-address
   */
  async verifyProviderAddress(profileId: ObjectId): Promise<ProviderProfile> {
    const res = await this.put<_SingleProfileRes>(
      `${this.base}/admin/${profileId}/verify-address`,
    );
    return res.providerProfile as ProviderProfile;
  }

  /**
   * Admin soft-delete. Document is retained for audit purposes.
   * DELETE /providers/admin/:profileId
   */
  async adminDeleteProvider(profileId: ObjectId): Promise<void> {
    await this.delete<void>(`${this.base}/admin/${profileId}`);
  }

  /**
   * Restore a soft-deleted provider profile (admin path).
   * POST /providers/admin/:profileId/restore
   */
  async adminRestoreProvider(profileId: ObjectId): Promise<ProviderProfile> {
    const res = await this.post<_SingleProfileRes>(
      `${this.base}/admin/${profileId}/restore`,
    );
    return res.providerProfile as ProviderProfile;
  }
}

// ─── Singleton export ──────────────────────────────────────────────────────────

export const providerProfileAPI = new ProviderProfileAPI();
