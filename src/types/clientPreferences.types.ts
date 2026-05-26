// types/clientPreferences.types.ts
//
// Frontend-only type definitions for client preferences.
// All IDs are `string` (JSON-serialised ObjectIds from the API).
// No mongoose imports — safe to use in any browser bundle.

import { PopulatedUserProfile } from "./provider.profile.types";
import { Category } from "./services/categories/service.category.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type TimeSlot = "morning" | "afternoon" | "evening";
export type ProviderGender = "male" | "female" | "any";
export type ProfileVisibility = "public" | "private";

// ─── Sub-documents ────────────────────────────────────────────────────────────

export interface CommunicationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface SchedulingPreferences {
  preferredDays?: DayOfWeek[];
  preferredTimeSlots?: TimeSlot[];
  advanceBookingLeadTime?: number;
}

export interface BudgetPreferences {
  min?: number;
  max?: number;
  currency?: string;
}

export interface ServicePreferences {
  maxProviderDistance?: number;
  preferredProviderGender?: ProviderGender;
  preferredLanguage?: string;
}

export interface PrivacyPreferences {
  profileVisibility?: ProfileVisibility;
  shareLocationWithProviders?: boolean;
}

// ─── Actual API shapes for favorite items ────────────────────────────────────

/**
 * Shape of a favoriteService entry as returned by the API.
 * NOTE: The API returns `title` (not `name`) and `coverImage` is an ObjectId
 * string referencing a file document — NOT a direct URL.
 */
export interface FavoriteServiceEntry {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string | null; // ObjectId ref — not a URL
  isActive: boolean;
}

/**
 * Shape of a favoriteProvider entry as returned by the API (populated).
 * The provider's display name comes from `businessName` at top level.
 * Avatar URL is nested at `profile.profilePictureId.url`.
 */
export interface FavoriteProviderEntry {
  _id: string;
  businessName?: string;
  profile?: {
    _id: string;
    contactInfo?: {
      mainContact?: string | null;
      additionalContact?: string | null;
      businessEmail?: string | null;
    } | null;
    profilePictureId?: {
      _id: string;
      url: string;
      thumbnailUrl: string;
    } | null;
  };
  locationData?: {
    ghanaPostGPS?: string;
    city?: string;
    region?: string;
    district?: string;
    locality?: string;
  };
  rating?: number;
}

// ─── Core DTO ─────────────────────────────────────────────────────────────────

/**
 * Shape returned by GET /client/preferences (with or without ?populate=true).
 *
 * Key observations from actual API response:
 * - `preferredCategories` is POPULATED (array of Category objects with catName/slug)
 * - `favoriteServices` entries use `title` not `name`
 * - `favoriteProviders` entries are nested with `profile.profilePictureId`
 * - `favoriteCategories` returns PLAIN ID STRINGS (not populated)
 */
export interface ClientPreferenceDTO {
  _id: string;
  profile: PopulatedUserProfile | string;
  /** Populated category objects — the API populates this field */
  preferredCategories: Array<{
    _id: string;
    catName: string;
    catCoverId?: { _id: string; url: string; thumbnailUrl: string } | null;
    isActive: boolean;
    slug: string;
  }>;
  communicationPreferences: CommunicationPreferences;
  /** Populated service entries — note: uses `title` not `name` */
  favoriteServices: FavoriteServiceEntry[];
  /** Populated provider entries — nested profile with profilePictureId */
  favoriteProviders: FavoriteProviderEntry[];
  /** Plain ObjectId strings — NOT populated by default */
  favoriteCategories: string[];
  schedulingPreferences?: SchedulingPreferences;
  budgetPreferences?: BudgetPreferences;
  servicePreferences?: ServicePreferences;
  privacyPreferences?: PrivacyPreferences;
  /** ISO-8601 date string */
  createdAt: string;
  /** ISO-8601 date string */
  updatedAt: string;
}

// ─── Normalised UI summary shapes ────────────────────────────────────────────
//
// These are the shapes the UI components consume after normalisation.
// They are stable regardless of what the API sends.

export interface ServiceSummary {
  _id: string;
  name: string; // normalised from `title`
  slug?: string;
  description?: string;
  imageUrl?: string; // set only when the API returns a direct URL; otherwise
  // the card resolves the cover via getPublicCoverRecord(_id)
  isActive: boolean;
}

export interface ProviderSummary {
  _id: string;
  displayName: string; // normalised from `businessName`
  avatarUrl?: string; // resolved from profile.profilePictureId.thumbnailUrl
  rating?: number;
  distanceKm?: number;
}

export interface CategorySummary {
  _id: string;
  name: string; // normalised from `catName`
  slug: string;
  iconUrl?: string; // resolved from catCoverId.url
}

/**
 * Populated variant — exists for backwards compatibility with the hook's
 * generic type parameter. In practice the API returns the same shape for
 * both populate=true and populate=false with the fields described above.
 */
export type ClientPreferencePopulatedDTO = ClientPreferenceDTO

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface CreateClientPreferenceBody {
  preferredCategories?: string[];
  communicationPreferences?: Partial<CommunicationPreferences>;
  favoriteServices?: string[];
  favoriteProviders?: string[];
}

export type UpdateCommunicationPreferencesRequestBody =
  Partial<CommunicationPreferences>;

export type UpdateSchedulingPreferencesBody = Partial<SchedulingPreferences>;
export type UpdateBudgetPreferencesBody = Partial<BudgetPreferences>;
export type UpdateServicePreferencesBody = Partial<ServicePreferences>;
export type UpdatePrivacyPreferencesBody = Partial<PrivacyPreferences>;

export interface UpdateCategoriesBody {
  categoryIds: string[];
}

export interface AddFavoriteServiceBody {
  serviceId: string;
}

export interface AddFavoriteProviderBody {
  providerId: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ClientPreferenceResponse {
  success: boolean;
  message: string;
  clientPreference?: ClientPreferenceDTO;
  error?: string;
}

export interface ClientPreferencePopulatedResponse {
  success: boolean;
  message: string;
  clientPreference?: ClientPreferencePopulatedDTO;
  error?: string;
}

export interface FavoriteServicesResponse {
  success: boolean;
  message: string;
  favoriteServices?: ServiceSummary[];
  error?: string;
}

export interface FavoriteProvidersResponse {
  success: boolean;
  message: string;
  favoriteProviders?: ProviderSummary[];
  error?: string;
}
