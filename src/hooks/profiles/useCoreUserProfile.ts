// hooks/useProfile.ts
import {
  ProfileStatsResponse,
  UpdateIdDetailsRequestBody,
  profileAPI,
} from "@/lib/api/profile/core.user.profile.api";
import {
  IUserProfile,
  CreateProfileRequestBody,
  UpdateProfileRequestBody,
} from "@/types/core.user.profile.types";
import { useState, useCallback, useEffect, useRef } from "react";

// ─── State Shape ───────────────────────────────────────────────────────────────

interface ProfileState {
  profile: Partial<IUserProfile> | null;
  stats: ProfileStatsResponse["stats"] | null;
  exists: boolean | null;
}

interface LoadingState {
  profile: boolean;
  stats: boolean;
  exists: boolean;
  creating: boolean;
  updating: boolean;
  updatingIdDetails: boolean;
  deleting: boolean;
  restoring: boolean;
}

interface ErrorState {
  profile: string | null;
  stats: string | null;
  exists: string | null;
  mutation: string | null;
}

// ─── Return Type ───────────────────────────────────────────────────────────────

export interface UseProfileReturn {
  // State
  profile: Partial<IUserProfile> | null;
  stats: ProfileStatsResponse["stats"] | null;
  exists: boolean | null;
  loading: LoadingState;
  errors: ErrorState;

  // Queries
  fetchProfile: () => Promise<void>;
  fetchCompleteProfile: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchExists: () => Promise<boolean | null>;

  // Mutations
  createProfile: (
    body: CreateProfileRequestBody,
  ) => Promise<Partial<IUserProfile> | null>;
  updateProfile: (
    body: UpdateProfileRequestBody,
  ) => Promise<Partial<IUserProfile> | null>;
  updateIdDetails: (
    body: UpdateIdDetailsRequestBody,
  ) => Promise<Partial<IUserProfile> | null>;
  deleteProfile: () => Promise<boolean>;
  restoreProfile: () => Promise<boolean>;

  // Helpers
  clearError: (key: keyof ErrorState) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useProfile(autoFetch = true): UseProfileReturn {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    stats: null,
    exists: null,
  });

  const [loading, setLoading] = useState<LoadingState>({
    // Start profile loading as true when autoFetch is enabled so the header
    // never flashes a "not authenticated" state before the first fetch settles.
    profile: autoFetch,
    stats: false,
    exists: false,
    creating: false,
    updating: false,
    updatingIdDetails: false,
    deleting: false,
    restoring: false,
  });

  const [errors, setErrors] = useState<ErrorState>({
    profile: null,
    stats: null,
    exists: null,
    mutation: null,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setLoadingKey = useCallback(
    (key: keyof LoadingState, value: boolean) =>
      setLoading((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setErrorKey = useCallback(
    (key: keyof ErrorState, value: string | null) =>
      setErrors((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const clearError = useCallback(
    (key: keyof ErrorState) => setErrorKey(key, null),
    [setErrorKey],
  );

  const extractError = (err: unknown): string =>
    err instanceof Error ? err.message : "An unexpected error occurred.";

  // ── Queries ────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoadingKey("profile", true);
    setErrorKey("profile", null);
    try {
      const profile = await profileAPI.getMyProfile();
      setState((prev) => ({ ...prev, profile: profile ?? null }));
    } catch (err) {
      setErrorKey("profile", extractError(err));
    } finally {
      setLoadingKey("profile", false);
    }
  }, [setLoadingKey, setErrorKey]);

  const fetchCompleteProfile = useCallback(async () => {
    setLoadingKey("profile", true);
    setErrorKey("profile", null);

    try {
      const response = await profileAPI.getCompleteProfile();

      setState((prev) => ({
        ...prev,
        profile: response.profile ?? null,
        profilePicture: response.profilePicture,
      }));
    } catch (err) {
      setErrorKey("profile", extractError(err));
    } finally {
      setLoadingKey("profile", false);
    }
  }, [setLoadingKey, setErrorKey]);

  const fetchStats = useCallback(async () => {
    setLoadingKey("stats", true);
    setErrorKey("stats", null);
    try {
      const res = await profileAPI.getMyProfileStats();
      setState((prev) => ({ ...prev, stats: res.stats ?? null }));
    } catch (err) {
      setErrorKey("stats", extractError(err));
    } finally {
      setLoadingKey("stats", false);
    }
  }, [setLoadingKey, setErrorKey]);

  // Returns the resolved exists value so callers can act on it immediately
  // without reading potentially-stale state.
  const fetchExists = useCallback(async (): Promise<boolean | null> => {
    setLoadingKey("exists", true);
    setErrorKey("exists", null);
    try {
      const res = await profileAPI.checkProfileExists();
      setState((prev) => ({ ...prev, exists: res.exists }));
      return res.exists;
    } catch (err) {
      setErrorKey("exists", extractError(err));
      return null;
    } finally {
      setLoadingKey("exists", false);
    }
  }, [setLoadingKey, setErrorKey]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createProfile = useCallback(
    async (
      body: CreateProfileRequestBody,
    ): Promise<Partial<IUserProfile> | null> => {
      setLoadingKey("creating", true);
      setErrorKey("mutation", null);
      try {
        const profile = await profileAPI.createProfile(body);
        const resolved = profile ?? ({} as Partial<IUserProfile>);
        setState((prev) => ({ ...prev, profile: resolved, exists: true }));
        return resolved;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("creating", false);
      }
    },
    [setLoadingKey, setErrorKey],
  );

  const updateProfile = useCallback(
    async (
      body: UpdateProfileRequestBody,
    ): Promise<Partial<IUserProfile> | null> => {
      setLoadingKey("updating", true);
      setErrorKey("mutation", null);
      try {
        const updated = await profileAPI.updateMyProfile(body);
        if (updated) {
          setState((prev) => ({
            ...prev,
            profile: { ...prev.profile, ...updated },
          }));
        }
        return updated ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("updating", false);
      }
    },
    [setLoadingKey, setErrorKey],
  );

  // Merges the returned profile into state so idDetails is immediately
  // reflected in the UI without a manual re-fetch.
  const updateIdDetails = useCallback(
    async (
      body: UpdateIdDetailsRequestBody,
    ): Promise<Partial<IUserProfile> | null> => {
      setLoadingKey("updatingIdDetails", true);
      setErrorKey("mutation", null);
      try {
        const updated = await profileAPI.updateMyIdDetails(body);
        if (updated) {
          setState((prev) => ({
            ...prev,
            profile: { ...prev.profile, ...updated },
          }));
        }
        return updated ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("updatingIdDetails", false);
      }
    },
    [setLoadingKey, setErrorKey],
  );

  const deleteProfile = useCallback(async (): Promise<boolean> => {
    setLoadingKey("deleting", true);
    setErrorKey("mutation", null);
    try {
      await profileAPI.deleteMyProfile();
      setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? { ...prev.profile, isDeleted: true, deletedAt: new Date().toISOString() }
          : null,
      }));
      return true;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return false;
    } finally {
      setLoadingKey("deleting", false);
    }
  }, [setLoadingKey, setErrorKey]);

  const restoreProfile = useCallback(async (): Promise<boolean> => {
    setLoadingKey("restoring", true);
    setErrorKey("mutation", null);
    try {
      const restored = await profileAPI.restoreMyProfile();
      if (restored) {
        setState((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            ...restored,
            isDeleted: false,
            deletedAt: undefined,
          },
        }));
      }
      return true;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return false;
    } finally {
      setLoadingKey("restoring", false);
    }
  }, [setLoadingKey, setErrorKey]);

  // ── Auto Fetch ─────────────────────────────────────────────────────────────
  // FIX: Hold loading.profile = true across the entire fetchExists → fetchProfile
  // chain so the header never sees a false-negative "not loading" gap between
  // the two sequential async calls that would flash Sign In buttons.

  const autoFetchRef = useRef(autoFetch);
  autoFetchRef.current = autoFetch;

  useEffect(() => {
    if (!autoFetch) return;

    let cancelled = false;

    const run = async () => {
      // loading.profile is already initialised to true when autoFetch=true.
      // Keep it true for the full chain; only release it at the very end.
      setErrorKey("profile", null);
      setErrorKey("exists", null);

      try {
        setLoadingKey("exists", true);
        let exists: boolean | null = null;

        try {
          const res = await profileAPI.checkProfileExists();
          if (cancelled) return;
          exists = res.exists;
          setState((prev) => ({ ...prev, exists }));
        } catch (err) {
          if (cancelled) return;
          setErrorKey("exists", extractError(err));
        } finally {
          setLoadingKey("exists", false);
        }

        if (exists) {
          try {
            const profile = await profileAPI.getMyProfile();
            if (cancelled) return;
            setState((prev) => ({ ...prev, profile: profile ?? null }));
          } catch (err) {
            if (cancelled) return;
            setErrorKey("profile", extractError(err));
          }
        }
      } finally {
        if (!cancelled) setLoadingKey("profile", false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    profile: state.profile,
    stats: state.stats,
    exists: state.exists,
    loading,
    errors,
    fetchProfile,
    fetchCompleteProfile,
    fetchStats,
    fetchExists,
    createProfile,
    updateProfile,
    updateIdDetails,
    deleteProfile,
    restoreProfile,
    clearError,
  };
}
