import { useState, useEffect, useCallback, useRef } from "react";

import type {
  ObjectId,
  ProviderProfile,
  PopulatedProviderProfile,
  GetProviderProfileByIdParams,
  GetServiceOfferingsParams,
  UpdateProviderProfileBody,
  UpdateLocationBody,
  UpdateWorkingHoursBody,
  SetAvailabilityBody,
  GetAllProvidersParams,
  GetProviderStatsParams,
  ProviderProfileListResponse,
  ProviderStatsResponse,
  UpdateBusinessNameBody,
  UpdateProviderStatusBody,
} from "@/types/provider.profile.types";

import type { Service } from "@/types/services/service.types";
import {
  BrowseProvidersParams,
  BrowseProvidersResponse,
  providerProfileAPI,
} from "@/lib/api/profile/business.profile.api";

// ─── Shared state shapes ──────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface MutationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function initialAsync<T>(): AsyncState<T> {
  return { data: null, loading: true, error: null };
}

function initialMutation(): MutationState {
  return { loading: false, error: null, success: false };
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

/**
 * Stable serialisation of a params object for use as a `useEffect` dep.
 * Returns "" for undefined so effects still fire on first mount.
 */
function stableKey(params?: object): string {
  if (!params) return "";
  return JSON.stringify(params, Object.keys(params).sort());
}

// ─── Auto-fetch hook factory ──────────────────────────────────────────────────

function useAutoFetch<T>(
  fetcher: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>(initialAsync<T>());
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ data: null, loading: false, error: extractMessage(err) });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run]);

  return { ...state, refetch: run };
}

// ─── Mutation hook factory ────────────────────────────────────────────────────

export interface UseMutationOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (message: string) => void;
}

function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: UseMutationOptions<TResult>,
): [(...args: TArgs) => Promise<void>, MutationState] {
  const [state, setState] = useState<MutationState>(initialMutation());

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const mutate = useCallback(
    async (...args: TArgs) => {
      setState({ loading: true, error: null, success: false });
      try {
        const result = await action(...args);
        setState({ loading: false, error: null, success: true });
        optionsRef.current?.onSuccess?.(result);
      } catch (err) {
        const message = extractMessage(err);
        setState({ loading: false, error: message, success: false });
        optionsRef.current?.onError?.(message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action],
  );

  return [mutate, state];
}

// ─── Public: Browse & Discovery ───────────────────────────────────────────────

/**
 * Unified provider discovery.
 * Supply `lat` + `lng` to annotate results with `distanceKm` and populate
 * `nearbyProviders`. Re-fetches automatically when `params` changes.
 */
export function useBrowseProviders(
  params?: BrowseProvidersParams,
): AsyncState<BrowseProvidersResponse> & { refetch: () => void } {
  return useAutoFetch(
    () => providerProfileAPI.browseProviders(params),
    [stableKey(params)],
  );
}

// ─── Public: Profile & Services ───────────────────────────────────────────────

/**
 * Public profile view. Pass `params.populate = true` to expand sub-documents.
 * Only fetches when `profileId` is provided.
 */
export function useProviderProfile(
  profileId: ObjectId | null,
  params?: GetProviderProfileByIdParams,
): AsyncState<ProviderProfile | PopulatedProviderProfile> & {
  refetch: () => void;
} {
  return useAutoFetch(
    () =>
      profileId
        ? providerProfileAPI.getProviderProfileById(profileId, params)
        : Promise.resolve(null as unknown as ProviderProfile),
    [profileId, stableKey(params)],
  );
}

/**
 * Active service offerings for a profile.
 * Pass `includeInactive: true` as the profile owner or admin to see all.
 * Only fetches when `profileId` is provided.
 */
export function useServiceOfferings(
  profileId: ObjectId | null,
  params?: GetServiceOfferingsParams,
): AsyncState<Service[]> & { refetch: () => void } {
  return useAutoFetch(
    () =>
      profileId
        ? providerProfileAPI.getServiceOfferings(profileId, params)
        : Promise.resolve([]),
    [profileId, stableKey(params)],
  );
}

// ─── Authenticated Provider: Own Profile ─────────────────────────────────────

/**
 * Returns the calling provider's full profile resolved server-side via /me.
 * Fetches immediately on mount — suitable for dashboard / settings pages.
 */
export function useMyProviderProfile(): AsyncState<ProviderProfile> & {
  refetch: () => void;
} {
  return useAutoFetch(() => providerProfileAPI.getMyProviderProfile(), []);
}

// ─── Authenticated Provider: Combined Manager ─────────────────────────────────

/**
 * All provider self-service operations in one hook.
 *
 * Fetches the profile via GET /providers/me (no profileId prop needed).
 * The profileId required for mutation routes is derived from the fetched
 * profile._id — the frontend never needs to supply it independently.
 *
 * @example
 * const {
 *   profile, loading, refetch,
 *   updateProfile, updateProfileState,
 *   updateBusinessName, updateBusinessNameState,
 *   updateStatus, updateStatusState,
 *   updateLocation, updateLocationState,
 *   updateWorkingHours, updateWorkingHoursState,
 *   setAvailability, setAvailabilityState,
 *   deleteProfile, deleteProfileState,
 *   restoreProfile, restoreProfileState,
 *   checkLocationVerification, checkLocationState,
 * } = useProviderProfileManager();
 */
export function useProviderProfileManager() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── auto-fetch via /me ──────────────────────────────────────────────────────
  // No profileId needed — the server resolves the profile from the JWT.

  const fetchProfile = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const data = await providerProfileAPI.getMyProviderProfile();
      setProfile(data);
    } catch (err) {
      setFetchError(extractMessage(err));
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── profileId is derived from the fetched profile ──────────────────────────
  // Mutation routes need /:profileId, but the caller never has to supply it.
  // We read it from the profile once it loads and guard every callback below.

  const profileId = profile?._id ?? null;

  // ── shared success handler ──────────────────────────────────────────────────

  const sync = useCallback(
    (updated: ProviderProfile) => setProfile(updated),
    [],
  );

  // ── runtime guard ───────────────────────────────────────────────────────────
  // Prevents mutation callbacks from producing /providers/null/... URLs if
  // they are somehow called before the profile has loaded.

  const requireId = (label: string): string => {
    if (!profileId)
      throw new Error(`${label}: profile has not loaded yet — please wait`);
    return profileId as unknown as string;
  };
  // ── guarded action callbacks ────────────────────────────────────────────────

  const _updateProfile = useCallback(
    (body: UpdateProviderProfileBody) =>
      providerProfileAPI.updateProviderProfile(
        requireId("updateProfile"),
        body,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _updateBusinessName = useCallback(
    (body: UpdateBusinessNameBody) =>
      providerProfileAPI.updateBusinessName(
        requireId("updateBusinessName"),
        body,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _updateStatus = useCallback(
    (body: UpdateProviderStatusBody) =>
      providerProfileAPI.updateProviderStatus(requireId("updateStatus"), body),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _updateLocation = useCallback(
    (body: UpdateLocationBody) =>
      providerProfileAPI.updateLocationData(requireId("updateLocation"), body),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _updateWorkingHours = useCallback(
    (body: UpdateWorkingHoursBody) =>
      providerProfileAPI.updateWorkingHours(
        requireId("updateWorkingHours"),
        body,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _setAvailability = useCallback(
    (body: SetAvailabilityBody) =>
      providerProfileAPI.setAvailability(requireId("setAvailability"), body),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _deleteProfile = useCallback(
    () => providerProfileAPI.deleteProviderProfile(requireId("deleteProfile")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _restoreProfile = useCallback(
    () =>
      providerProfileAPI.restoreProviderProfile(requireId("restoreProfile")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  const _checkLocation = useCallback(
    () =>
      providerProfileAPI.checkLocationVerification(
        requireId("checkLocationVerification"),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileId],
  );

  // ── mutations ───────────────────────────────────────────────────────────────

  const [updateProfile, updateProfileState] = useMutation(_updateProfile, {
    onSuccess: sync,
  });

  const [updateBusinessName, updateBusinessNameState] = useMutation(
    _updateBusinessName,
    { onSuccess: sync },
  );

  const [updateStatus, updateStatusState] = useMutation(_updateStatus, {
    onSuccess: sync,
  });

  const [updateLocation, updateLocationState] = useMutation(_updateLocation, {
    onSuccess: sync,
  });

  const [updateWorkingHours, updateWorkingHoursState] = useMutation(
    _updateWorkingHours,
    { onSuccess: sync },
  );

  const [setAvailability, setAvailabilityState] = useMutation(
    _setAvailability,
    {
      onSuccess: sync,
    },
  );

  // deleteProfile resolves void — no profile to sync back
  const [deleteProfile, deleteProfileState] = useMutation(_deleteProfile);

  const [restoreProfile, restoreProfileState] = useMutation(_restoreProfile, {
    onSuccess: sync,
  });

  const [checkLocationVerification, checkLocationState] =
    useMutation(_checkLocation);

  return {
    // ── fetch state ─────────────────────────────────────────────────────────
    profile,
    loading: fetchLoading,
    error: fetchError,
    refetch: fetchProfile,

    // ── mutations ────────────────────────────────────────────────────────────
    updateProfile,
    updateProfileState,

    updateBusinessName,
    updateBusinessNameState,

    updateStatus,
    updateStatusState,

    updateLocation,
    updateLocationState,

    updateWorkingHours,
    updateWorkingHoursState,

    setAvailability,
    setAvailabilityState,

    deleteProfile,
    deleteProfileState,

    restoreProfile,
    restoreProfileState,

    checkLocationVerification,
    checkLocationState,
  };
}

// ─── Admin: Read hooks ────────────────────────────────────────────────────────

/**
 * Paginated list of all providers (admin only).
 * Pass `includeDeleted: true` to include soft-deleted profiles.
 */
export function useAllProviders(
  params?: GetAllProvidersParams,
): AsyncState<ProviderProfileListResponse> & { refetch: () => void } {
  return useAutoFetch(
    () => providerProfileAPI.getAllProviders(params),
    [stableKey(params)],
  );
}

/**
 * Platform-wide provider stats (admin only).
 * Pass `params.providerId` to scope stats to a single provider.
 */
export function useProviderStats(
  params?: GetProviderStatsParams,
): AsyncState<ProviderStatsResponse> & { refetch: () => void } {
  return useAutoFetch(
    () => providerProfileAPI.getProviderStats(params),
    [stableKey(params)],
  );
}

/**
 * Look up a ProviderProfile by its parent UserProfile._id (admin only).
 * Only fetches when `userProfileId` is provided.
 */
export function useProviderProfileByRef(
  userProfileId: ObjectId | null,
): AsyncState<ProviderProfile> & { refetch: () => void } {
  return useAutoFetch(
    () =>
      userProfileId
        ? providerProfileAPI.getProviderProfileByRef(userProfileId)
        : Promise.resolve(null as unknown as ProviderProfile),
    [userProfileId],
  );
}

// ─── Admin: Mutation hooks ────────────────────────────────────────────────────

/**
 * Admin mutations scoped to a single provider profile.
 * All actions guard against a null `profileId` at call-time.
 */
export function useAdminProviderActions(
  profileId: ObjectId | null,
  options?: UseMutationOptions<ProviderProfile>,
) {
  const guard = (label: string): ObjectId => {
    if (!profileId)
      throw new Error(`${label}: profile ID is not available yet`);
    return profileId;
  };

  const [verifyAddress, verifyAddressState] = useMutation(
    () => providerProfileAPI.verifyProviderAddress(guard("verifyAddress")),
    options,
  );

  const [adminDeleteProvider, adminDeleteProviderState] = useMutation(() =>
    providerProfileAPI.adminDeleteProvider(guard("adminDeleteProvider")),
  );

  const [adminRestoreProvider, adminRestoreProviderState] = useMutation(
    () =>
      providerProfileAPI.adminRestoreProvider(guard("adminRestoreProvider")),
    options,
  );

  return {
    verifyAddress,
    verifyAddressState,
    adminDeleteProvider,
    adminDeleteProviderState,
    adminRestoreProvider,
    adminRestoreProviderState,
  };
}
