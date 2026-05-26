// types/provider.request.types.ts  (client-side)
// Mirrors the backend provider request types with all Mongoose-specific constructs removed:
//   - Types.ObjectId  → string
//   - Date            → string (ISO 8601)
//   - HydratedDocument, Model → omitted
//   - Instance / static method interfaces → omitted

import { ActorRole } from "./base.types";
import {
  UserLocation,
  GPSLocation,
  BrowseLocationContext,
} from "./location.types";
import { TaskPriority } from "./task.types";
import { Service } from "@/types/services/service.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum RequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  RESCHEDULED = "RESCHEDULED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

/**
 * Describes how the client arrived at choosing this provider.
 *
 * TASK_MATCH     — client posted a task; the system matched providers; client
 *                  picked one from the matchedProviders list.
 * TASK_INTEREST  — task was FLOATING; provider expressed interest; client
 *                  chose to request that provider.
 * SERVICE_BROWSE — client browsed services by location and selected a provider
 *                  directly (no task involved).
 */
export enum RequestSource {
  TASK_MATCH = "TASK_MATCH",
  TASK_INTEREST = "TASK_INTEREST",
  SERVICE_BROWSE = "SERVICE_BROWSE",
}

// ─── Provider Request Entity ──────────────────────────────────────────────────

export interface ProviderRequest {
  // BaseEntity fields
  _id: string;
  createdAt: string;
  updatedAt: string;

  // SoftDeletable fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;

  clientId?: string;
  providerId?: string;

  // ── Origin context ────────────────────────────────────────────────────────
  source: RequestSource;
  taskId?: string; // present for TASK_MATCH and TASK_INTEREST
  taskTitle?: string; // populated by list/detail endpoints when taskId is present
  serviceId?: string; // present for SERVICE_BROWSE (and optionally TASK_*)

  // ── Service details ───────────────────────────────────────────────────────
  serviceLocation: UserLocation;
  schedule: {
    priority: TaskPriority;
    preferredDate?: string;
    flexibleDates?: boolean;
    timeSlot?: {
      start: string;
      end?: string;
    };
  };

  clientMessage?: string;
  estimatedBudget?: {
    min?: number;
    max?: number;
    currency: string;
  };

  // ── Status & provider response ────────────────────────────────────────────
  status: RequestStatus;
  providerResponse?: {
    message?: string;
    respondedAt: string;
  };

  providerProposedSchedule?: {
    preferredDate: string;
    timeSlot: { start: string; end: string };
    message?: string;
    proposedAt: string;
  };

  // ── Discovery analytics ───────────────────────────────────────────────────
  discoveryContext?: {
    source: "task_match" | "task_interest" | "gps_browse" | "registered" | "manual";
    gpsLocation?: GPSLocation;
    radiusKm?: number;
    wasExpanded?: boolean;
  };

  // ── Conversion ────────────────────────────────────────────────────────────
  convertedToBookingId?: string;
  convertedAt?: string;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  expiresAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: ActorRole;
}

// ─── Service Browse (Flow 2 entry point) ──────────────────────────────────────

export interface BrowseServicesParams {
  locationContext: BrowseLocationContext;
  categoryId?: string;
  searchTerm?: string;
  priceRange?: { min?: number; max?: number; currency?: string };
  page?: number;
  limit?: number;
}

export interface ExpandServiceSearchParams {
  originalLocationContext: BrowseLocationContext;
  expandedRadiusKm: number;
  page: number;
  limit?: number;
}

export interface BrowseServicesResponse {
  success: boolean;
  message: string;
  services?: Array<{
    serviceId: string;
    providerId: string;
    distanceKm: number;
    service: Service;
  }>;
  locationContext: BrowseLocationContext;
  totalResults?: number;
  hasMore?: boolean;
  error?: string;
}

// ─── API Request Bodies ───────────────────────────────────────────────────────

/**
 * Shared fields for all request creation paths.
 * Use one of the three specialised bodies below instead of this directly.
 */
interface BaseCreateProviderRequestBody {
  providerId: string;
  serviceLocation: UserLocation;
  schedule: {
    priority: TaskPriority;
    preferredDate?: string;
    flexibleDates?: boolean;
    timeSlot?: { start: string; end?: string };
  };
  clientMessage?: string;
  estimatedBudget?: { min?: number; max?: number; currency?: string };
}

/** Client requests a provider from their task's matchedProviders list. */
export interface CreateTaskMatchRequestBody extends BaseCreateProviderRequestBody {
  source: RequestSource.TASK_MATCH;
  taskId: string;
  serviceId?: string;
  discoveryContext?: {
    source: "task_match";
    gpsLocation?: GPSLocation;
    radiusKm?: number;
  };
}

/** Client requests a provider who expressed interest in their floating task. */
export interface CreateTaskInterestRequestBody extends BaseCreateProviderRequestBody {
  source: RequestSource.TASK_INTEREST;
  taskId: string;
  serviceId?: string;
  discoveryContext?: {
    source: "task_interest";
  };
}

/** Client requests a provider directly after browsing services by location. */
export interface CreateServiceBrowseRequestBody extends BaseCreateProviderRequestBody {
  source: RequestSource.SERVICE_BROWSE;
  serviceId: string;
  discoveryContext?: {
    source: "gps_browse" | "registered" | "manual";
    gpsLocation?: GPSLocation;
    radiusKm?: number;
    wasExpanded?: boolean;
  };
}

export type CreateProviderRequestBody =
  | CreateTaskMatchRequestBody
  | CreateTaskInterestRequestBody
  | CreateServiceBrowseRequestBody;

/** Provider accepts or rejects a request. */
export interface RespondToProviderRequestBody {
  action: "accept" | "reject";
  message?: string;
}

/** Provider proposes a new date/time for the request. */
export interface ProposeScheduleBody {
  preferredDate: string;
  timeSlot: { start: string; end: string };
  message?: string;
}

/** Client counter-proposes their own schedule on a RESCHEDULED request. */
export interface NegotiateScheduleBody {
  preferredDate: string;
  timeSlot: { start: string; end: string };
  message?: string;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

// ─── Request detail context (returned by GET /requests/:id) ──────────────────

export interface RequestContextAttachment {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
}

export interface RequestContextParty {
  name?: string;
  businessName?: string;
  mainContact?: string;
  profilePicture?: { url: string; thumbnailUrl?: string };
}

export interface RequestContextRegisteredLocation {
  ghanaPostGPS?: string;
  nearbyLandmark?: string;
  locality?: string;
  city?: string;
  district?: string;
  region?: string;
  gpsCoordinates?: { latitude: number; longitude: number };
}

export interface RequestContextTaskLocation {
  registeredLocation?: RequestContextRegisteredLocation;
  gpsLocationAtPosting?: { latitude: number; longitude: number; accuracy?: number };
}

export interface RequestContextServiceDetails {
  name: string;
  description?: string;
  pricingModel?: string;
  basePrice?: number;
  currency?: string;
}

export interface RequestViewContext {
  viewer: "client" | "provider";
  clientDetails?: RequestContextParty;
  providerDetails?: RequestContextParty;
  serviceDetails?: RequestContextServiceDetails;
  taskAttachments?: RequestContextAttachment[];
  taskLocation?: RequestContextTaskLocation;
  taskTitle?: string;
  taskDescription?: string;
  taskTags?: string[];
}

export interface ProviderRequestResponse {
  success: boolean;
  message: string;
  providerRequest?: Partial<ProviderRequest>;
  booking?: Record<string, unknown>;
  context?: RequestViewContext;
  error?: string;
}

export interface ProviderRequestListResponse {
  success: boolean;
  message: string;
  providerRequests?: Partial<ProviderRequest>[];
  error?: string;
}
