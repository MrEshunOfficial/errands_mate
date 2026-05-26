// hooks/useClientPreference.ts

import {
  clientAPI,
  SaveAddressBody,
  UpdateAddressBody,
} from "@/lib/api/profile/client.preference.api";
import {
  ClientPreferencePopulatedDTO,
  ClientPreferenceDTO,
  UpdateCommunicationPreferencesRequestBody,
  UpdateSchedulingPreferencesBody,
  UpdateBudgetPreferencesBody,
  UpdateServicePreferencesBody,
  UpdatePrivacyPreferencesBody,
  CreateClientPreferenceBody,
} from "@/types/clientPreferences.types";
import { Location } from "@/types/location.types";
import { useReducer, useEffect, useCallback, useRef } from "react";

// ─── sessionStorage helpers for favorite categories ───────────────────────────

const FAV_CAT_KEY = "em_fav_cat_ids";

function readCachedCatIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(FAV_CAT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeCachedCatIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FAV_CAT_KEY, JSON.stringify(ids));
  } catch {
    // quota exceeded or private-mode restriction — silently ignore
  }
}

// ─── Discriminated union for the two populate modes ───────────────────────────

type ClientPreference<Populated extends boolean> = Populated extends true
  ? ClientPreferencePopulatedDTO
  : ClientPreferenceDTO;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type PreferenceState<Populated extends boolean> = {
  preference: ClientPreference<Populated> | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

type LocationState = {
  locations: Location[];
  defaultLocation: Location | null;
  isLoadingLocations: boolean;
  isSavingLocation: boolean;
  locationError: string | null;
};

type State<Populated extends boolean> = PreferenceState<Populated> &
  LocationState;

type Action<Populated extends boolean> =
  // ── Preference actions ────────────────────────────────────────────────────
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ClientPreference<Populated> }
  | { type: "FETCH_ERROR"; message: string }
  | { type: "SAVE_START" }
  | { type: "SAVE_ERROR"; message: string }
  | { type: "MERGE_PREFERENCE"; partial: Partial<ClientPreferenceDTO> }
  | { type: "REMOVE_FAVORITE_SERVICE"; serviceId: string }
  | { type: "ADD_FAVORITE_SERVICE"; id: string }
  | { type: "REMOVE_FAVORITE_PROVIDER"; providerId: string }
  | { type: "ADD_FAVORITE_PROVIDER"; id: string }
  // favoriteCategories is always string[] — actions carry plain IDs
  | { type: "REMOVE_FAVORITE_CATEGORY"; categoryId: string }
  | { type: "ADD_FAVORITE_CATEGORY"; id: string }
  // ── Location actions ──────────────────────────────────────────────────────
  | { type: "LOCATIONS_FETCH_START" }
  | {
      type: "LOCATIONS_FETCH_SUCCESS";
      locations: Location[];
      defaultLocation: Location | null;
    }
  | { type: "LOCATIONS_FETCH_ERROR"; message: string }
  | { type: "LOCATION_SAVE_START" }
  | { type: "LOCATION_SAVE_ERROR"; message: string }
  | { type: "LOCATION_ADDED"; location: Location }
  | { type: "LOCATION_UPDATED"; location: Location }
  | { type: "LOCATION_REMOVED"; locationId: string }
  | { type: "LOCATION_SET_DEFAULT"; locationId: string }
  | { type: "LOCATION_UNSET_DEFAULT"; locationId: string }
  | { type: "LOCATION_MARK_USED"; locationId: string };

function makeInitialState<Populated extends boolean>(): State<Populated> {
  return {
    preference: null,
    isLoading: true,
    isSaving: false,
    error: null,
    locations: [],
    defaultLocation: null,
    isLoadingLocations: false,
    isSavingLocation: false,
    locationError: null,
  };
}

function reducer<Populated extends boolean>(
  state: State<Populated>,
  action: Action<Populated>,
): State<Populated> {
  switch (action.type) {
    // ── Preference ──────────────────────────────────────────────────────────

    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        preference: action.payload,
        isLoading: false,
        isSaving: false,
        error: null,
      };

    case "FETCH_ERROR":
      return {
        ...state,
        preference: null,
        isLoading: false,
        isSaving: false,
        error: action.message,
      };

    case "SAVE_START":
      return { ...state, isSaving: true, error: null };

    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.message };

    case "MERGE_PREFERENCE":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? { ...state.preference, ...action.partial }
          : null,
      };

    case "ADD_FAVORITE_SERVICE":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              favoriteServices: [
                ...(state.preference.favoriteServices ?? []),
                action.id,
              ],
            }
          : null,
      };

    case "REMOVE_FAVORITE_SERVICE":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              favoriteServices: (
                state.preference.favoriteServices ?? []
              ).filter((entry) =>
                typeof entry === "string"
                  ? entry !== action.serviceId
                  : entry._id !== action.serviceId,
              ),
            }
          : null,
      };

    case "ADD_FAVORITE_PROVIDER":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              favoriteProviders: [
                ...(state.preference.favoriteProviders ?? []),
                action.id,
              ],
            }
          : null,
      };

    case "REMOVE_FAVORITE_PROVIDER":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              favoriteProviders: (
                state.preference.favoriteProviders ?? []
              ).filter((entry) =>
                typeof entry === "string"
                  ? entry !== action.providerId
                  : entry._id !== action.providerId,
              ),
            }
          : null,
      };

    case "ADD_FAVORITE_CATEGORY":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              // favoriteCategories is always string[] — append the new ID
              favoriteCategories: [
                ...(state.preference.favoriteCategories ?? []),
                action.id,
              ],
            }
          : null,
      };

    case "REMOVE_FAVORITE_CATEGORY":
      return {
        ...state,
        isSaving: false,
        error: null,
        preference: state.preference
          ? {
              ...state.preference,
              // favoriteCategories is string[] — simple string comparison
              favoriteCategories: (
                state.preference.favoriteCategories ?? []
              ).filter((id) => id !== action.categoryId),
            }
          : null,
      };

    // ── Locations ───────────────────────────────────────────────────────────

    case "LOCATIONS_FETCH_START":
      return { ...state, isLoadingLocations: true, locationError: null };

    case "LOCATIONS_FETCH_SUCCESS":
      return {
        ...state,
        isLoadingLocations: false,
        isSavingLocation: false,
        locationError: null,
        locations: action.locations,
        defaultLocation: action.defaultLocation,
      };

    case "LOCATIONS_FETCH_ERROR":
      return {
        ...state,
        isLoadingLocations: false,
        isSavingLocation: false,
        locationError: action.message,
      };

    case "LOCATION_SAVE_START":
      return { ...state, isSavingLocation: true, locationError: null };

    case "LOCATION_SAVE_ERROR":
      return {
        ...state,
        isSavingLocation: false,
        locationError: action.message,
      };

    case "LOCATION_ADDED":
      return {
        ...state,
        isSavingLocation: false,
        locationError: null,
        locations: [...state.locations, action.location],
        defaultLocation: action.location.isDefault
          ? action.location
          : state.defaultLocation,
      };

    case "LOCATION_UPDATED": {
      const updatedId = action.location._id?.toString();
      const updated = state.locations.map((loc) =>
        loc._id?.toString() === updatedId ? action.location : loc,
      );
      const defaultId = state.defaultLocation?._id?.toString();
      return {
        ...state,
        isSavingLocation: false,
        locationError: null,
        locations: updated,
        defaultLocation: action.location.isDefault
          ? action.location
          : defaultId != null && updatedId != null && defaultId === updatedId
            ? null
            : state.defaultLocation,
      };
    }

    case "LOCATION_REMOVED": {
      const remaining = state.locations.filter(
        (loc) => loc._id?.toString() !== action.locationId,
      );
      return {
        ...state,
        isSavingLocation: false,
        locationError: null,
        locations: remaining,
        defaultLocation:
          state.defaultLocation?._id?.toString() === action.locationId
            ? null
            : state.defaultLocation,
      };
    }

    case "LOCATION_SET_DEFAULT": {
      const retagged = state.locations.map((loc) => ({
        ...loc,
        isDefault: loc._id?.toString() === action.locationId,
      }));
      const nextDefault =
        retagged.find((loc) => loc._id?.toString() === action.locationId) ??
        null;
      return {
        ...state,
        isSavingLocation: false,
        locationError: null,
        locations: retagged,
        defaultLocation: nextDefault,
      };
    }

    case "LOCATION_UNSET_DEFAULT": {
      const cleared = state.locations.map((loc) =>
        loc._id?.toString() === action.locationId
          ? { ...loc, isDefault: false }
          : loc,
      );
      return {
        ...state,
        isSavingLocation: false,
        locationError: null,
        locations: cleared,
        defaultLocation:
          state.defaultLocation?._id?.toString() === action.locationId
            ? null
            : state.defaultLocation,
      };
    }

    case "LOCATION_MARK_USED": {
      const now = new Date();
      const stamped = state.locations.map((loc) =>
        loc._id?.toString() === action.locationId
          ? { ...loc, lastUsedAt: now }
          : loc,
      );
      return { ...state, isSavingLocation: false, locations: stamped };
    }

    default:
      return state;
  }
}

// ─── Public Interfaces ────────────────────────────────────────────────────────

export type UseClientPreferenceState<Populated extends boolean> =
  State<Populated>;

export interface UseClientPreferenceReturn<
  Populated extends boolean,
> extends State<Populated> {
  refresh: () => void;
  createPreference: (body: CreateClientPreferenceBody) => Promise<void>;
  updateCommunication: (
    body: UpdateCommunicationPreferencesRequestBody,
  ) => Promise<void>;
  updateCategories: (categoryIds: string[]) => Promise<void>;
  addFavoriteService: (serviceId: string) => Promise<boolean>;
  removeFavoriteService: (serviceId: string) => Promise<boolean>;
  addFavoriteProvider: (providerId: string) => Promise<boolean>;
  removeFavoriteProvider: (providerId: string) => Promise<boolean>;
  addFavoriteCategory: (categoryId: string) => Promise<boolean>;
  removeFavoriteCategory: (categoryId: string) => Promise<boolean>;
  updateScheduling: (body: UpdateSchedulingPreferencesBody) => Promise<void>;
  updateBudget: (body: UpdateBudgetPreferencesBody) => Promise<void>;
  updateService: (body: UpdateServicePreferencesBody) => Promise<void>;
  updatePrivacy: (body: UpdatePrivacyPreferencesBody) => Promise<void>;
  refreshLocations: () => void;
  saveAddress: (body: SaveAddressBody) => Promise<Location | null>;
  updateAddress: (
    locationId: string,
    body: UpdateAddressBody,
  ) => Promise<Location | null>;
  removeAddress: (locationId: string) => Promise<void>;
  setDefaultAddress: (locationId: string) => Promise<void>;
  unsetDefaultAddress: (locationId: string) => Promise<void>;
  markLocationUsed: (locationId: string) => Promise<void>;
}

// ─── Overloads ────────────────────────────────────────────────────────────────

export function useClientPreference(
  populate: true,
): UseClientPreferenceReturn<true>;
export function useClientPreference(
  populate?: false,
): UseClientPreferenceReturn<false>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useClientPreference(
  populate = false,
): UseClientPreferenceReturn<boolean> {
  const [state, dispatch] = useReducer(
    reducer<boolean>,
    undefined,
    makeInitialState<boolean>,
  );

  const populateRef = useRef(populate);
  useEffect(() => {
    populateRef.current = populate;
  });

  const [fetchKey, setFetchKey] = useReducer((n: number) => n + 1, 0);
  const [locationFetchKey, setLocationFetchKey] = useReducer(
    (n: number) => n + 1,
    0,
  );

  // ─── Preference Fetch ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      clientAPI.getPreference(populateRef.current),
      clientAPI.getFavoriteCategories().catch(() => undefined),
    ])
      .then(([preference, serverCategories]) => {
        if (cancelled) return;

        // favoriteCategories: server field (string[]) > dedicated endpoint > sessionStorage
        const resolved: string[] =
          (preference.favoriteCategories?.length
            ? preference.favoriteCategories
            : null) ??
          (serverCategories?.length
            ? (serverCategories as unknown as string[])
            : null) ??
          readCachedCatIds();

        dispatch({
          type: "FETCH_SUCCESS",
          payload: { ...preference, favoriteCategories: resolved },
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "FETCH_ERROR",
            message:
              err instanceof Error
                ? err.message
                : "Failed to load preferences.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  // ─── Location Fetch ───────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: "LOCATIONS_FETCH_START" });

    Promise.all([
      clientAPI.listAddresses(),
      clientAPI.getDefaultAddress().catch(() => null),
    ])
      .then(([locations, defaultLocation]) => {
        if (!cancelled) {
          dispatch({
            type: "LOCATIONS_FETCH_SUCCESS",
            locations,
            defaultLocation,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "LOCATIONS_FETCH_ERROR",
            message:
              err instanceof Error ? err.message : "Failed to load locations.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locationFetchKey]);

  // ─── Refresh ──────────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    dispatch({ type: "FETCH_START" });
    setFetchKey();
  }, []);

  const refreshLocations = useCallback(() => {
    setLocationFetchKey();
  }, []);

  // ─── Create ───────────────────────────────────────────────────────────────

  const createPreference = useCallback(
    async (body: CreateClientPreferenceBody) => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.createPreference(body);
        dispatch({ type: "FETCH_START" });
        setFetchKey();
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to create preference record.",
        });
      }
    },
    [],
  );

  // ─── Communication ────────────────────────────────────────────────────────

  const updateCommunication = useCallback(
    async (body: UpdateCommunicationPreferencesRequestBody) => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.updateCommunicationPreferences(body);
        dispatch({
          type: "MERGE_PREFERENCE",
          partial: {
            communicationPreferences: {
              emailNotifications: body.emailNotifications ?? false,
              smsNotifications: body.smsNotifications ?? false,
              pushNotifications: body.pushNotifications ?? false,
            },
          },
        });
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to update communication preferences.",
        });
      }
    },
    [],
  );

  // ─── Preferred Categories ─────────────────────────────────────────────────
  //
  // updateCategories patches `preferredCategories` (the populated field), but
  // the MERGE_PREFERENCE action merges into ClientPreferenceDTO whose
  // preferredCategories is typed as a populated object array.  We send the raw
  // IDs to the server and trigger a full re-fetch so the state is always
  // sourced from the server-populated response rather than trying to
  // reconstruct populated objects from plain IDs on the client.

  const updateCategories = useCallback(async (categoryIds: string[]) => {
    dispatch({ type: "SAVE_START" });
    try {
      await clientAPI.updatePreferredCategories(categoryIds);
      // Re-fetch so `preferredCategories` is populated by the server
      dispatch({ type: "FETCH_START" });
      setFetchKey();
    } catch (err) {
      dispatch({
        type: "SAVE_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to update categories.",
      });
    }
  }, []);

  // ─── Scheduling Preferences ──────────────────────────────────────────────

  const updateScheduling = useCallback(
    async (body: UpdateSchedulingPreferencesBody): Promise<void> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.updateSchedulingPreferences(body);
        dispatch({
          type: "MERGE_PREFERENCE",
          partial: { schedulingPreferences: body },
        });
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message: err instanceof Error ? err.message : "Failed to update scheduling preferences.",
        });
      }
    },
    [],
  );

  // ─── Budget Preferences ───────────────────────────────────────────────────

  const updateBudget = useCallback(
    async (body: UpdateBudgetPreferencesBody): Promise<void> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.updateBudgetPreferences(body);
        dispatch({
          type: "MERGE_PREFERENCE",
          partial: { budgetPreferences: body },
        });
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message: err instanceof Error ? err.message : "Failed to update budget preferences.",
        });
      }
    },
    [],
  );

  // ─── Service Preferences ──────────────────────────────────────────────────

  const updateService = useCallback(
    async (body: UpdateServicePreferencesBody): Promise<void> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.updateServicePreferences(body);
        dispatch({
          type: "MERGE_PREFERENCE",
          partial: { servicePreferences: body },
        });
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message: err instanceof Error ? err.message : "Failed to update service preferences.",
        });
      }
    },
    [],
  );

  // ─── Privacy Preferences ──────────────────────────────────────────────────

  const updatePrivacy = useCallback(
    async (body: UpdatePrivacyPreferencesBody): Promise<void> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.updatePrivacyPreferences(body);
        dispatch({
          type: "MERGE_PREFERENCE",
          partial: { privacyPreferences: body },
        });
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message: err instanceof Error ? err.message : "Failed to update privacy preferences.",
        });
      }
    },
    [],
  );

  // ─── Favourite Services ───────────────────────────────────────────────────

  const addFavoriteService = useCallback(
    async (serviceId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.addFavoriteService(serviceId);
        dispatch({ type: "ADD_FAVORITE_SERVICE", id: serviceId });
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to add favourite service.",
        });
        return false;
      }
    },
    [],
  );

  const removeFavoriteService = useCallback(
    async (serviceId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.removeFavoriteService(serviceId);
        dispatch({ type: "REMOVE_FAVORITE_SERVICE", serviceId });
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to remove favourite service.",
        });
        return false;
      }
    },
    [],
  );

  // ─── Favourite Providers ──────────────────────────────────────────────────

  const addFavoriteProvider = useCallback(
    async (providerId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.addFavoriteProvider(providerId);
        dispatch({ type: "ADD_FAVORITE_PROVIDER", id: providerId });
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to add favourite provider.",
        });
        return false;
      }
    },
    [],
  );

  const removeFavoriteProvider = useCallback(
    async (providerId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.removeFavoriteProvider(providerId);
        dispatch({ type: "REMOVE_FAVORITE_PROVIDER", providerId });
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to remove favourite provider.",
        });
        return false;
      }
    },
    [],
  );

  // ─── Favourite Categories ─────────────────────────────────────────────────

  const addFavoriteCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.addFavoriteCategory(categoryId);
        dispatch({ type: "ADD_FAVORITE_CATEGORY", id: categoryId });
        const cached = readCachedCatIds();
        if (!cached.includes(categoryId)) {
          writeCachedCatIds([...cached, categoryId]);
        }
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to add favourite category.",
        });
        return false;
      }
    },
    [],
  );

  const removeFavoriteCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      dispatch({ type: "SAVE_START" });
      try {
        await clientAPI.removeFavoriteCategory(categoryId);
        dispatch({ type: "REMOVE_FAVORITE_CATEGORY", categoryId });
        writeCachedCatIds(readCachedCatIds().filter((id) => id !== categoryId));
        return true;
      } catch (err) {
        dispatch({
          type: "SAVE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to remove favourite category.",
        });
        return false;
      }
    },
    [],
  );

  // ─── Locations ────────────────────────────────────────────────────────────

  const saveAddress = useCallback(
    async (body: SaveAddressBody): Promise<Location | null> => {
      dispatch({ type: "LOCATION_SAVE_START" });
      try {
        const res = await clientAPI.saveAddress(body);
        if (!res.location) throw new Error(res.message ?? "Save failed.");
        dispatch({ type: "LOCATION_ADDED", location: res.location });
        return res.location;
      } catch (err) {
        dispatch({
          type: "LOCATION_SAVE_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to save address.",
        });
        return null;
      }
    },
    [],
  );

  const updateAddress = useCallback(
    async (
      locationId: string,
      body: UpdateAddressBody,
    ): Promise<Location | null> => {
      dispatch({ type: "LOCATION_SAVE_START" });
      try {
        const res = await clientAPI.updateAddress(locationId, body);
        if (!res.location) throw new Error(res.message ?? "Update failed.");
        dispatch({ type: "LOCATION_UPDATED", location: res.location });
        return res.location;
      } catch (err) {
        dispatch({
          type: "LOCATION_SAVE_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to update address.",
        });
        return null;
      }
    },
    [],
  );

  const removeAddress = useCallback(async (locationId: string) => {
    dispatch({ type: "LOCATION_SAVE_START" });
    try {
      await clientAPI.removeAddress(locationId);
      dispatch({ type: "LOCATION_REMOVED", locationId });
    } catch (err) {
      dispatch({
        type: "LOCATION_SAVE_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to remove address.",
      });
    }
  }, []);

  const setDefaultAddress = useCallback(async (locationId: string) => {
    dispatch({ type: "LOCATION_SAVE_START" });
    try {
      await clientAPI.setDefaultAddress(locationId);
      dispatch({ type: "LOCATION_SET_DEFAULT", locationId });
    } catch (err) {
      dispatch({
        type: "LOCATION_SAVE_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to set default address.",
      });
    }
  }, []);

  const unsetDefaultAddress = useCallback(async (locationId: string) => {
    dispatch({ type: "LOCATION_SAVE_START" });
    try {
      await clientAPI.unsetDefaultAddress(locationId);
      dispatch({ type: "LOCATION_UNSET_DEFAULT", locationId });
    } catch (err) {
      dispatch({
        type: "LOCATION_SAVE_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to unset default address.",
      });
    }
  }, []);

  const markLocationUsed = useCallback(async (locationId: string) => {
    dispatch({ type: "LOCATION_SAVE_START" });
    try {
      await clientAPI.markLocationUsed(locationId);
      dispatch({ type: "LOCATION_MARK_USED", locationId });
    } catch (err) {
      dispatch({
        type: "LOCATION_SAVE_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to mark location as used.",
      });
    }
  }, []);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    ...state,
    refresh,
    createPreference,
    updateCommunication,
    updateCategories,
    updateScheduling,
    updateBudget,
    updateService,
    updatePrivacy,
    addFavoriteService,
    removeFavoriteService,
    addFavoriteProvider,
    removeFavoriteProvider,
    addFavoriteCategory,
    removeFavoriteCategory,
    refreshLocations,
    saveAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    unsetDefaultAddress,
    markLocationUsed,
  };
}
