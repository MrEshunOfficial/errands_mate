// api/client/client.api.ts

import { APIClient } from "../base/api-client";
import {
  ClientPreferenceDTO,
  ClientPreferenceResponse,
  UpdateCommunicationPreferencesRequestBody,
  UpdateSchedulingPreferencesBody,
  UpdateBudgetPreferencesBody,
  UpdateServicePreferencesBody,
  UpdatePrivacyPreferencesBody,
  CreateClientPreferenceBody,
} from "@/types/clientPreferences.types";
import {
  Location,
  LocationLabel,
  LocationResponse,
  UserLocation,
} from "@/types/location.types";

// ─── Raw Response Wrappers ────────────────────────────

interface WrappedPreferenceResponse {
  success: boolean;
  message: string;
  clientPreference: ClientPreferenceDTO;
}

// ─── Lightweight Request DTOs ─────────────────────────────────────────────────

interface AddFavoriteServiceBody {
  serviceId: string;
}

interface AddFavoriteProviderBody {
  providerId: string;
}

interface AddFavoriteCategoryBody {
  categoryId: string;
}

interface UpdateCategoriesBody {
  categoryIds: string[];
}

export interface SaveAddressBody {
  label: LocationLabel;
  customLabel?: string;
  ghanaPostGPS: string;
  nearbyLandmark?: string;
  liveCoordinates?: { latitude: number; longitude: number };
  isDefault?: boolean;
}

export interface UpdateAddressBody {
  label?: LocationLabel;
  customLabel?: string;
  ghanaPostGPS?: string;
  nearbyLandmark?: string;
  liveCoordinates?: { latitude: number; longitude: number };
  isDefault?: boolean;
  address?: Partial<UserLocation>;
}

// ─── API Client ───────────────────────────────────────────────────────────────

class ClientAPI extends APIClient {
  private readonly prefBase = "/api/client/preferences";
  private readonly locBase = "/api/client/locations";

  // ───────────────────────────────────────────────────────────────────────────
  // PREFERENCES
  // ───────────────────────────────────────────────────────────────────────────

  // ─── Core Preference ───────────────────────────────────────────────────────

  /**
   * GET /client/preferences
   * GET /client/preferences?populate=true
   *
   * Defensively handles two possible shapes returned by the base client:
   *   1. { clientPreference: DTO }  — wrapper intact (direct backend call)
   *   2. DTO                        — already unwrapped by the base client
   *                                   (proxy inserted a `data` key en route)
   */
  async getPreference(populate = false): Promise<ClientPreferenceDTO> {
    const raw = await this.get<WrappedPreferenceResponse>(
      `${this.prefBase}`,
      populate ? { populate: true } : undefined,
    );
    return raw.clientPreference ?? (raw as unknown as ClientPreferenceDTO);
  }

  /**
   * POST /client/preferences
   *
   * Seeds the preference record during client onboarding.
   * Idempotent on the server — returns 409 if a record already exists.
   */
  async createPreference(
    body: CreateClientPreferenceBody,
  ): Promise<ClientPreferenceResponse> {
    return this.post<ClientPreferenceResponse>(`${this.prefBase}`, body);
  }

  // ─── Favourite Services ────────────────────────────────────────────────────

  /**
   * GET /client/preferences/favorites/services
   *
   * Returns the client's favourite services (populated, active only).
   */
  async getFavoriteServices(): Promise<
    ClientPreferenceDTO["favoriteServices"]
  > {
    return this.get<ClientPreferenceDTO["favoriteServices"]>(
      `${this.prefBase}/favorites/services`,
    );
  }

  /**
   * POST /client/preferences/favorites/services
   *
   * Adds a service to the client's favourites list. Idempotent ($addToSet).
   */
  async addFavoriteService(
    serviceId: string,
  ): Promise<ClientPreferenceResponse> {
    const body: AddFavoriteServiceBody = { serviceId };
    return this.post<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/services`,
      body,
    );
  }

  /**
   * DELETE /client/preferences/favorites/services/:serviceId
   *
   * Removes a service from the client's favourites list.
   */
  async removeFavoriteService(
    serviceId: string,
  ): Promise<ClientPreferenceResponse> {
    return this.delete<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/services/${serviceId}`,
    );
  }

  // ─── Favourite Providers ───────────────────────────────────────────────────

  /**
   * GET /client/preferences/favorites/providers
   * GET /client/preferences/favorites/providers?lat=5.6037&lng=-0.1870
   *
   * Optionally pass coordinates to receive distance-annotated results
   * sorted nearest-first.
   */
  async getFavoriteProviders(coords?: {
    lat: number;
    lng: number;
  }): Promise<ClientPreferenceDTO["favoriteProviders"]> {
    const params = coords ? { lat: coords.lat, lng: coords.lng } : undefined;
    return this.get<ClientPreferenceDTO["favoriteProviders"]>(
      `${this.prefBase}/favorites/providers`,
      params,
    );
  }

  /**
   * POST /client/preferences/favorites/providers
   *
   * Adds a provider to the client's favourites list. Idempotent ($addToSet).
   */
  async addFavoriteProvider(
    providerId: string,
  ): Promise<ClientPreferenceResponse> {
    const body: AddFavoriteProviderBody = { providerId };
    return this.post<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/providers`,
      body,
    );
  }

  /**
   * DELETE /client/preferences/favorites/providers/:providerId
   *
   * Removes a provider from the client's favourites list.
   */
  async removeFavoriteProvider(
    providerId: string,
  ): Promise<ClientPreferenceResponse> {
    return this.delete<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/providers/${providerId}`,
    );
  }

  // ─── Favourite Categories ──────────────────────────────────────────────────

  /**
   * GET /client/preferences/favorites/categories
   *
   * Returns the client's favourite categories populated with catName,
   * catCoverId, and slug (active only).
   */
  async getFavoriteCategories(): Promise<
    ClientPreferenceDTO["favoriteCategories"]
  > {
    const raw = await this.get<unknown>(`${this.prefBase}/favorites/categories`);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as ClientPreferenceDTO["favoriteCategories"];
    if (typeof raw !== "object") return [];
    const obj = raw as Record<string, unknown>;
    // { favoriteCategories: [...] }
    if (Array.isArray(obj.favoriteCategories))
      return obj.favoriteCategories as ClientPreferenceDTO["favoriteCategories"];
    // { clientPreference: { favoriteCategories: [...] } }
    if (obj.clientPreference && typeof obj.clientPreference === "object") {
      const cp = obj.clientPreference as Record<string, unknown>;
      if (Array.isArray(cp.favoriteCategories))
        return cp.favoriteCategories as ClientPreferenceDTO["favoriteCategories"];
    }
    return [];
  }

  /**
   * POST /client/preferences/favorites/categories
   *
   * Adds a category to the client's favourites list. Idempotent ($addToSet).
   */
  async addFavoriteCategory(
    categoryId: string,
  ): Promise<ClientPreferenceResponse> {
    const body: AddFavoriteCategoryBody = { categoryId };
    return this.post<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/categories`,
      body,
    );
  }

  /**
   * DELETE /client/preferences/favorites/categories/:categoryId
   *
   * Removes a category from the client's favourites list.
   */
  async removeFavoriteCategory(
    categoryId: string,
  ): Promise<ClientPreferenceResponse> {
    return this.delete<ClientPreferenceResponse>(
      `${this.prefBase}/favorites/categories/${categoryId}`,
    );
  }

  // ─── Communication Preferences ─────────────────────────────────────────────

  /**
   * PATCH /client/preferences/communication
   *
   * Merges the supplied flags into the existing communication sub-document.
   * Partial updates are supported — send only the fields you want to change.
   */
  async updateCommunicationPreferences(
    body: UpdateCommunicationPreferencesRequestBody,
  ): Promise<ClientPreferenceResponse> {
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/communication`,
      body,
    );
  }

  // ─── Preferred Categories ──────────────────────────────────────────────────

  /**
   * PATCH /client/preferences/categories
   *
   * Replaces the preferredCategories array wholesale.
   * Pass an empty array to clear all preferred categories.
   */
  async updatePreferredCategories(
    categoryIds: string[],
  ): Promise<ClientPreferenceResponse> {
    const body: UpdateCategoriesBody = { categoryIds };
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/categories`,
      body,
    );
  }

  // ─── Scheduling Preferences ────────────────────────────────────────────────

  async updateSchedulingPreferences(
    body: UpdateSchedulingPreferencesBody,
  ): Promise<ClientPreferenceResponse> {
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/scheduling`,
      body,
    );
  }

  // ─── Budget Preferences ────────────────────────────────────────────────────

  async updateBudgetPreferences(
    body: UpdateBudgetPreferencesBody,
  ): Promise<ClientPreferenceResponse> {
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/budget`,
      body,
    );
  }

  // ─── Service Preferences ──────────────────────────────────────────────────

  async updateServicePreferences(
    body: UpdateServicePreferencesBody,
  ): Promise<ClientPreferenceResponse> {
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/service-settings`,
      body,
    );
  }

  // ─── Privacy Preferences ──────────────────────────────────────────────────

  async updatePrivacyPreferences(
    body: UpdatePrivacyPreferencesBody,
  ): Promise<ClientPreferenceResponse> {
    return this.patch<ClientPreferenceResponse>(
      `${this.prefBase}/privacy`,
      body,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOCATIONS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * GET /client/locations
   *
   * Returns all saved locations for the authenticated client,
   * most recently used first.
   */
  async listAddresses(): Promise<Location[]> {
    const res = await this.get<Location[] | { locations?: Location[] }>(
      `${this.locBase}`,
    );
    return Array.isArray(res) ? res : (res.locations ?? []);
  }

  /**
   * POST /client/locations
   *
   * Enriches the Ghana Post GPS code via OSM and persists the result.
   */
  async saveAddress(body: SaveAddressBody): Promise<LocationResponse> {
    return this.post<LocationResponse>(`${this.locBase}`, body);
  }

  /**
   * GET /client/locations/default
   *
   * Returns the client's default Location document, or null when none is set.
   */
  async getDefaultAddress(): Promise<Location | null> {
    const res = await this.get<unknown>(`${this.locBase}/default`);
    if (!res || typeof res !== "object") return null;
    // Unwrap { location: {...} } or { defaultLocation: {...} } envelope
    const obj = res as Record<string, unknown>;
    if ("_id" in obj) return obj as unknown as Location;
    const inner = (obj.location ?? obj.defaultLocation ?? null) as unknown;
    if (inner && typeof inner === "object" && "_id" in (inner as object))
      return inner as Location;
    return null;
  }

  /**
   * PATCH /client/locations/:locationId
   *
   * Re-enriches and updates an existing Location document.
   */
  async updateAddress(
    locationId: string,
    body: UpdateAddressBody,
  ): Promise<LocationResponse> {
    return this.patch<LocationResponse>(`${this.locBase}/${locationId}`, body);
  }

  /**
   * PATCH /client/locations/:locationId/default
   *
   * Marks one location as the client's default, clearing the flag on all others.
   */
  async setDefaultAddress(locationId: string): Promise<LocationResponse> {
    return this.patch<LocationResponse>(
      `${this.locBase}/${locationId}/default`,
      {},
    );
  }

  /**
   * DELETE /client/locations/:locationId/default
   *
   * Clears the isDefault flag without promoting another location.
   */
  async unsetDefaultAddress(locationId: string): Promise<LocationResponse> {
    return this.delete<LocationResponse>(
      `${this.locBase}/${locationId}/default`,
    );
  }

  /**
   * PATCH /client/locations/:locationId/used
   *
   * Stamps lastUsedAt with the current time. Call whenever the client
   * selects a location for a task or booking.
   */
  async markLocationUsed(locationId: string): Promise<LocationResponse> {
    return this.patch<LocationResponse>(
      `${this.locBase}/${locationId}/used`,
      {},
    );
  }

  /**
   * DELETE /client/locations/:locationId
   *
   * Soft-deletes the location. Check `LocationResponse.message` to determine
   * whether the deleted record was the active default so the UI can prompt
   * the client to pick a new one.
   */
  async removeAddress(locationId: string): Promise<LocationResponse> {
    return this.delete<LocationResponse>(`${this.locBase}/${locationId}`);
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const clientAPI = new ClientAPI();
