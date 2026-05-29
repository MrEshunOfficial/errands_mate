// types/tasks.types.ts  (client-side)
// Mirrors the backend task types with all Mongoose-specific constructs removed:
//   - Types.ObjectId  → string
//   - HydratedDocument, Model, BaseEntity, SoftDeletable → omitted
//   - Instance / static method interfaces → omitted

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * Full task lifecycle status set.
 *
 * PENDING   — created, matching not yet attempted or in progress
 * MATCHED   — at least one provider matched; awaiting client action
 * FLOATING  — open to all nearby providers (client cast a wider net,
 *             or intelligent matching yielded no results)
 * CANCELLED — cancelled by the client or an admin before a booking was made
 * EXPIRED   — passed expiresAt without being converted
 */
export enum TaskStatus {
  PENDING = "PENDING",
  MATCHED = "MATCHED",
  FLOATING = "FLOATING",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// ─── Matching ─────────────────────────────────────────────────────────────────

export interface ProviderMatchResult {
  providerId: string;
  matchScore: number;
  matchedServices?: string[];
  matchReasons: string[];
  distance?: number;
  scoreBreakdown?: {
    titleScore: number;
    descriptionScore: number;
    tagScore: number;
    categoryScore: number;
    locationScore: number;
  };
}

/**
 * Shape of the provider document when `providerId` is populated by the backend
 * (returned by GET /tasks/:taskId/matched-providers).
 */
export interface PopulatedProviderData {
  _id: string;
  businessName?: string;
  profile?: {
    _id: string;
    userId?: { _id: string; name?: string; email?: string };
    contactInfo?: {
      mainContact?: string;
      additionalContact?: string;
      businessEmail?: string;
    };
    profilePictureId?: string;
  };
  serviceOfferings?: Array<{
    _id: string;
    title?: string;
    slug?: string;
    servicePricing?: Record<string, unknown>;
    isActive?: boolean;
  }>;
  businessGalleryImages?: Array<{
    _id: string;
    thumbnailUrl?: string;
    url?: string;
  }>;
  locationData?: {
    ghanaPostGPS?: string;
    nearbyLandmark?: string;
    region?: string;
    city?: string;
    district?: string;
    locality?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
    isAddressVerified?: boolean;
    sourceProvider?: string;
  };
}

/** ProviderMatchResult with the provider document fully populated. */
export interface PopulatedProviderMatchResult
  extends Omit<ProviderMatchResult, "providerId"> {
  providerId: PopulatedProviderData;
}

export interface MatchingSummary {
  strategy: "intelligent" | "location-only";
  /**
   * Explicit outcome of the match so the client doesn't have to infer meaning
   * from the strategy/status combination:
   *   "matched"        — at least one content-relevant provider (task MATCHED)
   *   "proximity_only" — no relevant provider; only nearby ones attached, task FLOATING
   *   "none"           — no providers at all; task FLOATING
   * Optional for backwards-compatibility with responses predating the field.
   */
  matchOutcome?: "matched" | "proximity_only" | "none";
  totalMatches: number;
  averageMatchScore: number;
  searchTermsUsed: string[];
  radiusUsedKm: number;
  locationSourceUsed?: "registered" | "gps" | "both";
}

// ─── Location ─────────────────────────────────────────────────────────────────

/**
 * The client supplies ONE of these two shapes when creating a task:
 *
 *   existingLocationId — _id of a saved Location document.
 *   newLocation        — inline address; set saveForLater: true to also
 *                        persist it to the client's address book.
 */
export type TaskLocationInput =
  | {
      existingLocationId: string;
      newLocation?: never;
    }
  | {
      newLocation: {
        ghanaPostGPS: string;
        nearbyLandmark?: string;
        /** Required when saveForLater is true. */
        label?: string;
        customLabel?: string;
        saveForLater?: boolean;
        gpsCoordinates?: {
          latitude: number;
          longitude: number;
          accuracy?: number;
        };
      };
      existingLocationId?: never;
    };

// ─── Task entity (read model) ─────────────────────────────────────────────────

export interface Task {
  // BaseEntity fields
  _id: string;
  createdAt: string;
  updatedAt: string;

  // SoftDeletable fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;

  title: string;
  description: string;
  tags?: string[];
  category?: string;
  clientId: string;
  locationContext: TaskLocationContext;
  taskAttachment?: File;
  status: TaskStatus;
  expiresAt?: string;

  // Matching outputs
  matchedProviders?: ProviderMatchResult[];
  matchingAttemptedAt?: string;
  /** Persisted outcome of the most recent matching run. See MatchingSummary.matchOutcome. */
  matchOutcome?: "matched" | "proximity_only" | "none";
  matchingCriteria?: {
    useLocationOnly: boolean;
    searchTerms?: string[];
    categoryMatch: boolean;
    radiusUsedKm?: number;
    locationSourceUsed?: "registered" | "gps" | "both";
  };

  // Provider interest (floating flow)
  interestedProviders?: Array<{
    providerId: string;
    expressedAt: string;
    message?: string;
  }>;

  viewCount: number;
}

/** Matches the backend TaskLocationContext shape. */
export interface TaskLocationContext {
  ghanaPostGPS?: string;
  nearbyLandmark?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  resolvedAddress?: string;
  [key: string]: unknown;
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface CreateTaskRequestBody {
  title: string;
  description: string;
  tags?: string[];
  category?: string;
  location: TaskLocationInput;
  /** Live GPS fix captured when the form is submitted. */
  gpsLocationAtPosting?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt: string;
  };
  matchingStrategy?: "intelligent" | "location-only";
}

export interface UpdateTaskRequestBody {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

export interface RematchRequestBody {
  strategy?: "intelligent" | "location-only";
}

export interface CancelTaskRequestBody {
  reason?: string;
}

export interface ExpressInterestRequestBody {
  message?: string;
}

// ─── Query param shapes ───────────────────────────────────────────────────────
export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface GetFloatingTasksParams extends QueryParams {
  region?: string;
  city?: string;
  categoryId?: string;
  limit?: number;
  skip?: number;
}

export interface SearchTasksParams extends QueryParams {
  q: string;
  status?: TaskStatus;
  categoryId?: string;
  region?: string;
  clientId?: string;
  limit?: number;
  skip?: number;
}

export interface GetMyTasksParams extends QueryParams {
  status?: TaskStatus;
  limit?: number;
  skip?: number;
}

export interface GetMatchedTasksParams extends QueryParams {
  limit?: number;
  skip?: number;
}

export interface GetTaskByIdParams extends QueryParams {
  populate?: boolean;
}

// Admin-specific query params
export interface AdminGetAllTasksParams extends QueryParams {
  status?: TaskStatus;
  clientId?: string;
  includeDeleted?: boolean;
  limit?: number;
  skip?: number;
}

export interface AdminGetTaskStatsParams extends QueryParams {
  clientId?: string;
}

// ─── Response shapes ──────────────────────────────────────────────────────────
export interface TaskResponse {
  success: boolean;
  message: string;
  task?: Task;
  error?: string;
}

export interface TaskListResponse {
  success: boolean;
  message: string;
  tasks?: Task[] | Partial<Task>[];
  error?: string;
}

export interface TaskWithMatchesResponse {
  success: boolean;
  message: string;
  task?: Task;
  matchedProviders?: ProviderMatchResult[];
  matchingSummary?: MatchingSummary;
  /** Set when a new location was also saved to the client's address book. */
  savedLocationId?: string;
  error?: string;
}

export interface ClientTaskSummary {
  total: number;
  active: number;
  cancelled: number;
  expired: number;
}

export interface TaskSummaryResponse {
  success: boolean;
  message: string;
  summary?: ClientTaskSummary;
  error?: string;
}

export interface MatchedProvidersResponse {
  success: boolean;
  message: string;
  matchedProviders?: PopulatedProviderMatchResult[];
  matchingCriteria?: Task["matchingCriteria"];
  task?: {
    _id: string;
    status: string;
    title: string;
    matchingAttemptedAt?: string;
  };
  error?: string;
}

export interface InterestedProvidersResponse {
  success: boolean;
  message: string;
  interestedProviders?: Task["interestedProviders"];
  error?: string;
}

// Admin-only responses
export interface AdminTaskStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    total: number;
    pending: number;
    matched: number;
    floating: number;
    cancelled: number;
    expired: number;
    deleted: number;
    matchingSuccessRate: number;
  };
  error?: string;
}

export interface AdminExpireOverdueResponse {
  success: boolean;
  message: string;
  expiredCount: number;
}

export interface TaskWithProvidersResponse {
  success: boolean;
  message: string;
  task?: Task;
  matchedProviders?: ProviderMatchResult[];
  matchingSummary?: MatchingSummary;
  error?: string;
}