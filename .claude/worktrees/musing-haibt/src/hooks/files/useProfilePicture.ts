// hooks/useProfilePicture.ts

import { profilePictureAPI } from "@/lib/api/files/profile/profile-picture.api";
import {
  IFile,
  ProfilePictureStatsResponse,
  UpdateFileMetadataBody,
  OptimizedPictureResponse,
} from "@/types/files.types";
import { useState, useCallback } from "react";

// ─── State Shape ───────────────────────────────────────────────────────────────

interface ProfilePictureState {
  /** Active picture record from MongoDB */
  record: IFile | null;
  /** Cloudinary-optimized URL for display */
  optimizedUrl: string | null;
  /** Full upload history including archived records */
  history: IFile[];
  /** Storage/count stats */
  stats: ProfilePictureStatsResponse["stats"] | null;
}

// ─── Loading Keys ──────────────────────────────────────────────────────────────
interface LoadingState {
  record: boolean;
  optimizedUrl: boolean;
  history: boolean;
  stats: boolean;
  uploading: boolean;
  deleting: boolean;
  updatingMetadata: boolean;
  archiving: boolean;
  restoring: boolean;
  cleaningUp: boolean;
}

interface ErrorState {
  fetch: string | null;
  mutation: string | null;
}

// ─── Return Type ───────────────────────────────────────────────────────────────

export interface UseProfilePictureReturn {
  // State
  record: IFile | null;
  optimizedUrl: string | null;
  history: IFile[];
  stats: ProfilePictureStatsResponse["stats"] | null;
  loading: LoadingState;
  errors: ErrorState;

  // Cloudinary queries
  fetchMyCloudinaryPicture: () => Promise<void>;
  fetchOptimizedUrl: () => Promise<void>;
  fetchPublicCloudinaryPicture: (userId: string) => Promise<IFile | null>;

  // Cloudinary mutations
  uploadPicture: (file: File) => Promise<IFile | null>;
  deleteMyCloudinaryPicture: () => Promise<boolean>;

  // MongoDB queries
  fetchMyRecord: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPublicRecord: (userId: string) => Promise<IFile | null>;

  // MongoDB mutations
  updateMetadata: (body: UpdateFileMetadataBody) => Promise<IFile | null>;
  archive: () => Promise<IFile | null>;
  restore: (fileId: string) => Promise<IFile | null>;
  deleteMyRecord: () => Promise<boolean>;
  cleanupArchived: () => Promise<number | null>;

  // Helpers
  clearError: (key: keyof ErrorState) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useProfilePicture(): UseProfilePictureReturn {
  const [state, setState] = useState<ProfilePictureState>({
    record: null,
    optimizedUrl: null,
    history: [],
    stats: null,
  });

  const [loading, setLoading] = useState<LoadingState>({
    record: false,
    optimizedUrl: false,
    history: false,
    stats: false,
    uploading: false,
    deleting: false,
    updatingMetadata: false,
    archiving: false,
    restoring: false,
    cleaningUp: false,
  });

  const [errors, setErrors] = useState<ErrorState>({
    fetch: null,
    mutation: null,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setLoadingKey = (key: keyof LoadingState, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));

  const setErrorKey = (key: keyof ErrorState, value: string | null) =>
    setErrors((prev) => ({ ...prev, [key]: value }));

  const clearError = useCallback((key: keyof ErrorState) => {
    setErrorKey(key, null);
  }, []);

  const extractError = (err: unknown): string =>
    err instanceof Error ? err.message : "An unexpected error occurred.";

  // ── Cloudinary Queries ─────────────────────────────────────────────────────

  const fetchMyCloudinaryPicture = useCallback(async () => {
    setLoadingKey("record", true);
    setErrorKey("fetch", null);
    try {
      const file = await profilePictureAPI.getMyCloudinaryPicture();
      setState((prev) => ({ ...prev, record: file ?? null }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("record", false);
    }
  }, []);

  const fetchOptimizedUrl = useCallback(async () => {
    setLoadingKey("optimizedUrl", true);
    setErrorKey("fetch", null);
    try {
      const res: OptimizedPictureResponse =
        await profilePictureAPI.getOptimizedUrl();
      setState((prev) => ({ ...prev, optimizedUrl: res.url ?? null }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("optimizedUrl", false);
    }
  }, []);

  // Returns the file directly (not stored in shared state) so callers can use
  // it to render another user's picture without overwriting the current user's.
  const fetchPublicCloudinaryPicture = useCallback(
    async (userId: string): Promise<IFile | null> => {
      try {
        return await profilePictureAPI.getPublicCloudinaryPicture(userId);
      } catch (err) {
        setErrorKey("fetch", extractError(err));
        return null;
      }
    },
    [],
  );

  // ── Cloudinary Mutations ───────────────────────────────────────────────────

  const uploadPicture = useCallback(
    async (file: File): Promise<IFile | null> => {
      setLoadingKey("uploading", true);
      setErrorKey("mutation", null);
      try {
        const res = await profilePictureAPI.uploadProfilePicture(file);
        // Optimistically update the displayed record to the newly uploaded file.
        if (res.file) {
          setState((prev) => ({ ...prev, record: res.file }));
        }
        return res.file ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("uploading", false);
      }
    },
    [],
  );

  const deleteMyCloudinaryPicture = useCallback(async (): Promise<boolean> => {
    setLoadingKey("deleting", true);
    setErrorKey("mutation", null);
    try {
      await profilePictureAPI.deleteMyCloudinaryPicture();
      // Clear local state — the profile no longer has a linked picture.
      setState((prev) => ({
        ...prev,
        record: null,
        optimizedUrl: null,
      }));
      return true;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return false;
    } finally {
      setLoadingKey("deleting", false);
    }
  }, []);

  // ── MongoDB Queries ────────────────────────────────────────────────────────

  const fetchMyRecord = useCallback(async () => {
    setLoadingKey("record", true);
    setErrorKey("fetch", null);
    try {
      const file = await profilePictureAPI.getMyRecord();
      setState((prev) => ({ ...prev, record: file ?? null }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("record", false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingKey("history", true);
    setErrorKey("fetch", null);
    try {
      const res = await profilePictureAPI.getHistory();
      setState((prev) => ({ ...prev, history: res.history ?? [] }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("history", false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingKey("stats", true);
    setErrorKey("fetch", null);
    try {
      const res = await profilePictureAPI.getStats();
      setState((prev) => ({ ...prev, stats: res.stats ?? null }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("stats", false);
    }
  }, []);

  const fetchPublicRecord = useCallback(
    async (userId: string): Promise<IFile | null> => {
      try {
        return await profilePictureAPI.getPublicRecord(userId);
      } catch (err) {
        setErrorKey("fetch", extractError(err));
        return null;
      }
    },
    [],
  );

  // ── MongoDB Mutations ──────────────────────────────────────────────────────

  const updateMetadata = useCallback(
    async (body: UpdateFileMetadataBody): Promise<IFile | null> => {
      setLoadingKey("updatingMetadata", true);
      setErrorKey("mutation", null);
      try {
        const updated = await profilePictureAPI.updateMetadata(body);
        if (updated) {
          setState((prev) => ({
            ...prev,
            record: prev.record ? { ...prev.record, ...updated } : updated,
          }));
        }
        return updated ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("updatingMetadata", false);
      }
    },
    [],
  );

  const archive = useCallback(async (): Promise<IFile | null> => {
    setLoadingKey("archiving", true);
    setErrorKey("mutation", null);
    try {
      const archived = await profilePictureAPI.archive();
      if (archived) {
        // Move record into history and clear the active record.
        setState((prev) => ({
          ...prev,
          record: null,
          history: [archived, ...prev.history],
        }));
      }
      return archived ?? null;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return null;
    } finally {
      setLoadingKey("archiving", false);
    }
  }, []);

  const restore = useCallback(async (fileId: string): Promise<IFile | null> => {
    setLoadingKey("restoring", true);
    setErrorKey("mutation", null);
    try {
      const restored = await profilePictureAPI.restore(fileId);
      if (restored) {
        setState((prev) => ({
          ...prev,
          record: restored,
          // Remove restored file from history list.
          history: prev.history.filter((f) => f._id !== fileId),
        }));
      }
      return restored ?? null;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return null;
    } finally {
      setLoadingKey("restoring", false);
    }
  }, []);

  const deleteMyRecord = useCallback(async (): Promise<boolean> => {
    setLoadingKey("deleting", true);
    setErrorKey("mutation", null);
    try {
      await profilePictureAPI.deleteMyRecord();
      setState((prev) => ({ ...prev, record: null }));
      return true;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return false;
    } finally {
      setLoadingKey("deleting", false);
    }
  }, []);

  // Returns the count of deleted records so the caller can surface feedback.
  const cleanupArchived = useCallback(async (): Promise<number | null> => {
    setLoadingKey("cleaningUp", true);
    setErrorKey("mutation", null);
    try {
      const res = await profilePictureAPI.cleanupArchived();
      // Clear local history since all archived entries are now gone.
      setState((prev) => ({
        ...prev,
        history: prev.history.filter((f) => f.status === "active"),
      }));
      return res.deletedCount ?? null;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return null;
    } finally {
      setLoadingKey("cleaningUp", false);
    }
  }, []);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    record: state.record,
    optimizedUrl: state.optimizedUrl,
    history: state.history,
    stats: state.stats,
    loading,
    errors,
    fetchMyCloudinaryPicture,
    fetchOptimizedUrl,
    fetchPublicCloudinaryPicture,
    uploadPicture,
    deleteMyCloudinaryPicture,
    fetchMyRecord,
    fetchHistory,
    fetchStats,
    fetchPublicRecord,
    updateMetadata,
    archive,
    restore,
    deleteMyRecord,
    cleanupArchived,
    clearError,
  };
}
