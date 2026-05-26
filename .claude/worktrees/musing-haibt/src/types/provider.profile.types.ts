import { UserLocation } from "./location.types";
import { BaseEntity, SoftDeletable } from "./base.types";

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * Serialised MongoDB ObjectId — always a plain string on the client.
 * Use this instead of mongoose.Types.ObjectId in all frontend code.
 */
export type ObjectId = string;

// ─── Supporting types ─────────────────────────────────────────────────────────

/**
 * Keyed by lowercase day name (e.g. "monday").
 * A missing key means the provider does not work that day.
 */
export type WorkingHours = Record<string, { start: string; end: string }>;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ProviderStatus {
  Available = "Available",
  Booked = "Booked",
  Closed = "closed",
  Requested = "requested",
}

// ─── Core domain ──────────────────────────────────────────────────────────────

export interface ProviderProfile extends BaseEntity, SoftDeletable {
  /** Reference to the parent UserProfile document. */
  profile: ObjectId;
  businessName?: string;
  contactInfo?: {
    mainContact?: string | null;
    additionalContact?: string | null;
    businessEmail?: string | null;
  } | null;

  /** Operational status — use the ProviderStatus enum. */
  status: ProviderStatus;

  /** ObjectId references to linked Service documents. */
  serviceOfferings?: ObjectId[];

  /** ObjectId references to uploaded gallery image files. */
  businessGalleryImages?: ObjectId[];

  /** Enriched location data resolved from the Ghana Post GPS code. */
  locationData?: UserLocation;

  /** True when the provider has no fixed schedule. */
  isAlwaysAvailable: boolean;

  /**
   * Weekly schedule. Only relevant when isAlwaysAvailable is false.
   * Cleared automatically when setAvailability({ isAlwaysAvailable: true }) is called.
   */
  workingHours?: WorkingHours;

  /**
   * Set to true by an admin after manually confirming the stored address.
   * Providers cannot write this field directly.
   */
  isAddressVerified?: boolean;

  /**
   * Haversine distance in km from the caller's coordinates.
   * Present only when browseProviders is called with lat + lng.
   * Not persisted — annotated at query time.
   */
  distanceKm?: number;
}

// ─── Populated variant ────────────────────────────────────────────────────────
//
// Returned when getProviderProfileById / getMyProviderProfile is called
// with populate: true. Sub-document arrays are expanded in-place.

import { Service } from "@/types/services/service.types";
import { PopulatedProfilePicture } from "./core.user.profile.types";

export interface PopulatedProviderProfile extends Omit<
  ProviderProfile,
  "serviceOfferings" | "businessGalleryImages"
> {
  serviceOfferings?: Service[];
  businessGalleryImages?: GalleryImage[];
}

// ─── Gallery image ────────────────────────────────────────────────────────────

export interface GalleryImage {
  _id: ObjectId;
  url: string;
  /** Upload timestamp. */
  createdAt: string;
}

// ─── API: Query param shapes ──────────────────────────────────────────────────

export interface GetProviderProfileByIdParams {
  /**
   * Expand serviceOfferings, businessGalleryImages, and the UserProfile ref.
   * Defaults to false on the server (plain ObjectId arrays returned).
   */
  populate?: boolean;
}

export interface GetServiceOfferingsParams {
  /**
   * When true, inactive services are included.
   * Requires caller to be the profile owner or an admin.
   * Defaults to false.
   */
  includeInactive?: boolean;
}

export interface GetAllProvidersParams {
  /** Max records to return (default 20, server cap 100). */
  limit?: number;
  /** Zero-based offset for cursor-style pagination. */
  skip?: number;
  /** Include soft-deleted profiles in the result set. Defaults to false. */
  includeDeleted?: boolean;
}

export interface GetProviderStatsParams {
  /** Scope stats to a single provider. Omit for platform-wide stats. */
  providerId?: ObjectId;
}

// ─── API: Request body shapes ─────────────────────────────────────────────────

/**
 * Payload for PUT /providers/:profileId (general-purpose update).
 * For structured sub-documents prefer the dedicated body types below.
 */
export type UpdateProviderProfileBody = Partial<
  Omit<
    ProviderProfile,
    | "_id"
    | "createdAt"
    | "updatedAt"
    | "profile"
    | "isDeleted"
    | "deletedAt"
    | "deletedBy"
    | "distanceKm"
  >
>;

/**
 * Payload for PUT /providers/:profileId/business-name
 */
export interface UpdateBusinessNameBody {
  businessName: string;
}

/**
 * Payload for PUT /providers/:profileId/status
 */
export interface UpdateProviderStatusBody {
  status: ProviderStatus;
}

/**
 * Payload for PUT /providers/:profileId/location
 * The server resolves region, city, district, and coordinates via OpenStreetMap.
 */
export interface UpdateLocationBody {
  ghanaPostGPS: string;
  nearbyLandmark?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateWorkingHoursBody {
  workingHours: WorkingHours;
}

export type SetAvailabilityBody =
  | { isAlwaysAvailable: true }
  | { isAlwaysAvailable: false; workingHours: WorkingHours };

// ─── API: Response shapes ─────────────────────────────────────────────────────

export interface ProviderProfileListResponse {
  providerProfiles: ProviderProfile[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export interface ProviderStatsResponse {
  totalProviders?: number;
  activeProviders?: number;
  deletedProviders?: number;
  provider?: Partial<ProviderProfile>;
}

/**
 * Returned by checkLocationVerification.
 */
export interface LocationVerificationResult {
  verified: boolean;
  discrepancies: string[];
  locationData: UserLocation;
}

export interface PopulatedUserProfile {
  _id: ObjectId;
  userId: {
    _id: ObjectId;
    name: string;
    email: string;
    createdAt: string;
  };
  role: string;
  contactInfo?: {
    mainContact?: string | null;
    additionalContact?: string | null;
    businessEmail?: string | null;
  } | null;
  profilePictureId?: ObjectId | PopulatedProfilePicture | null;
}

