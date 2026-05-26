// hooks/useIdImage.ts

import { idImageAPI } from "@/lib/api/files/profile/id-image.api";
import {
  IFile,
  IdImageStatsResponse,
  UpdateFileMetadataBody,
} from "@/types/files.types";
import { useState, useCallback } from "react";

// ─── State Shape ───────────────────────────────────────────────────────────────

interface IdImageState {
  /** Active ID image records from Cloudinary (CDN URLs) */
  images: IFile[];
  /** Single active MongoDB record (primary reference) */
  record: IFile | null;
  /** Full upload history including archived records */
  history: IFile[];
  /** Storage/count stats */
  stats: IdImageStatsResponse["stats"] | null;
}

// ─── Loading Keys ──────────────────────────────────────────────────────────────

interface LoadingState {
  images: boolean;
  record: boolean;
  history: boolean;
  stats: boolean;
  uploadingSingle: boolean;
  uploadingBatch: boolean;
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

export interface UseIdImageReturn {
  // State
  images: IFile[];
  record: IFile | null;
  history: IFile[];
  stats: IdImageStatsResponse["stats"] | null;
  loading: LoadingState;
  errors: ErrorState;

  // Cloudinary queries
  fetchMyCloudinaryImages: () => Promise<void>;

  // Cloudinary mutations
  uploadSingle: (file: File) => Promise<IFile | null>;
  uploadBatch: (files: File[]) => Promise<IFile[] | null>;
  deleteFromCloudinary: (fileId: string) => Promise<boolean>;

  // MongoDB queries
  fetchRecord: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchStats: () => Promise<void>;

  // MongoDB mutations
  updateMetadata: (
    fileId: string,
    body: UpdateFileMetadataBody,
  ) => Promise<IFile | null>;
  archive: (fileId: string) => Promise<IFile | null>;
  restore: (fileId: string) => Promise<IFile | null>;
  deleteRecord: (fileId: string) => Promise<boolean>;
  cleanupArchived: () => Promise<number | null>;

  // Helpers
  clearError: (key: keyof ErrorState) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useIdImage(): UseIdImageReturn {
  const [state, setState] = useState<IdImageState>({
    images: [],
    record: null,
    history: [],
    stats: null,
  });

  const [loading, setLoading] = useState<LoadingState>({
    images: false,
    record: false,
    history: false,
    stats: false,
    uploadingSingle: false,
    uploadingBatch: false,
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

  const fetchMyCloudinaryImages = useCallback(async () => {
    setLoadingKey("images", true);
    setErrorKey("fetch", null);
    try {
      const res = await idImageAPI.getMyCloudinaryImages();
      setState((prev) => ({ ...prev, images: res.files ?? [] }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("images", false);
    }
  }, []);

  // ── Cloudinary Mutations ───────────────────────────────────────────────────

  const uploadSingle = useCallback(
    async (file: File): Promise<IFile | null> => {
      setLoadingKey("uploadingSingle", true);
      setErrorKey("mutation", null);
      try {
        const res = await idImageAPI.uploadSingle(file);
        if (res.file) {
          // Append to local images list so the UI reflects it immediately.
          setState((prev) => ({
            ...prev,
            images: [...prev.images, res.file],
          }));
        }
        return res.file ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("uploadingSingle", false);
      }
    },
    [],
  );

  const uploadBatch = useCallback(
    async (files: File[]): Promise<IFile[] | null> => {
      setLoadingKey("uploadingBatch", true);
      setErrorKey("mutation", null);
      try {
        const res = await idImageAPI.uploadBatch(files);
        if (res.files?.length) {
          setState((prev) => ({
            ...prev,
            images: [...prev.images, ...res.files],
          }));
        }
        return res.files ?? null;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return null;
      } finally {
        setLoadingKey("uploadingBatch", false);
      }
    },
    [],
  );

  const deleteFromCloudinary = useCallback(
    async (fileId: string): Promise<boolean> => {
      setLoadingKey("deleting", true);
      setErrorKey("mutation", null);
      try {
        await idImageAPI.deleteFromCloudinary(fileId);
        // Remove from local images list immediately.
        setState((prev) => ({
          ...prev,
          images: prev.images.filter((f) => f._id !== fileId),
        }));
        return true;
      } catch (err) {
        setErrorKey("mutation", extractError(err));
        return false;
      } finally {
        setLoadingKey("deleting", false);
      }
    },
    [],
  );

  // ── MongoDB Queries ────────────────────────────────────────────────────────

  const fetchRecord = useCallback(async () => {
    setLoadingKey("record", true);
    setErrorKey("fetch", null);
    try {
      const file = await idImageAPI.getRecord();
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
      const res = await idImageAPI.getHistory();
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
      const res = await idImageAPI.getStats();
      setState((prev) => ({ ...prev, stats: res.stats ?? null }));
    } catch (err) {
      setErrorKey("fetch", extractError(err));
    } finally {
      setLoadingKey("stats", false);
    }
  }, []);

  // ── MongoDB Mutations ──────────────────────────────────────────────────────

  const updateMetadata = useCallback(
    async (
      fileId: string,
      body: UpdateFileMetadataBody,
    ): Promise<IFile | null> => {
      setLoadingKey("updatingMetadata", true);
      setErrorKey("mutation", null);
      try {
        const updated = await idImageAPI.updateMetadata(fileId, body);
        if (updated) {
          // Merge into the images list if the file is there; otherwise update record.
          setState((prev) => ({
            ...prev,
            images: prev.images.map((f) =>
              f._id === fileId ? { ...f, ...updated } : f,
            ),
            record:
              prev.record?._id === fileId
                ? { ...prev.record, ...updated }
                : prev.record,
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

  const archive = useCallback(async (fileId: string): Promise<IFile | null> => {
    setLoadingKey("archiving", true);
    setErrorKey("mutation", null);
    try {
      const archived = await idImageAPI.archive(fileId);
      if (archived) {
        setState((prev) => ({
          ...prev,
          // Remove from active images list.
          images: prev.images.filter((f) => f._id !== fileId),
          record: prev.record?._id === fileId ? null : prev.record,
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
      const restored = await idImageAPI.restore(fileId);
      if (restored) {
        setState((prev) => ({
          ...prev,
          images: [...prev.images, restored],
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

  const deleteRecord = useCallback(async (fileId: string): Promise<boolean> => {
    setLoadingKey("deleting", true);
    setErrorKey("mutation", null);
    try {
      await idImageAPI.deleteRecord(fileId);
      setState((prev) => ({
        ...prev,
        images: prev.images.filter((f) => f._id !== fileId),
        record: prev.record?._id === fileId ? null : prev.record,
        history: prev.history.filter((f) => f._id !== fileId),
      }));
      return true;
    } catch (err) {
      setErrorKey("mutation", extractError(err));
      return false;
    } finally {
      setLoadingKey("deleting", false);
    }
  }, []);

  const cleanupArchived = useCallback(async (): Promise<number | null> => {
    setLoadingKey("cleaningUp", true);
    setErrorKey("mutation", null);
    try {
      const res = await idImageAPI.cleanupArchived();
      // Drop all archived entries from local history.
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
    images: state.images,
    record: state.record,
    history: state.history,
    stats: state.stats,
    loading,
    errors,
    fetchMyCloudinaryImages,
    uploadSingle,
    uploadBatch,
    deleteFromCloudinary,
    fetchRecord,
    fetchHistory,
    fetchStats,
    updateMetadata,
    archive,
    restore,
    deleteRecord,
    cleanupArchived,
    clearError,
  };
}
