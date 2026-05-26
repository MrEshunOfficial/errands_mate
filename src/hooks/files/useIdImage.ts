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
  /**
   * Upload multiple files in one request.
   *
   * Returns `IFile[]` (possibly empty) when the API call **succeeds** — even
   * if the response body cannot be fully parsed into file records.
   * Returns `null` **only** when the API call throws (network error, 4xx/5xx).
   *
   * Callers should check `results !== null` (not `results?.length`) to decide
   * whether the upload succeeded.
   */
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

  /**
   * Aggressively normalise any response shape into a flat `IFile[]`.
   * The API may return:
   *   • `{ files: IFile[], count: number }` — UploadMultipleIdImagesResponse
   *   • `IFile[]`                            — raw array (already unwrapped)
   *   • `{ file: IFile }`                    — single-file wrapper
   *   • `{ data: { files: IFile[] } }`       — nested data envelope
   *   • `{}`                                 — empty / unexpected
   */
  const normaliseFilesResponse = (res: unknown): IFile[] => {
    if (Array.isArray(res)) return res as IFile[];

    if (res != null && typeof res === "object") {
      const obj = res as Record<string, unknown>;

      // { files: IFile[] }
      if (Array.isArray(obj.files)) return obj.files as IFile[];

      // { data: { files: IFile[] } } or { data: IFile[] }
      if (obj.data != null) {
        if (Array.isArray(obj.data)) return obj.data as IFile[];
        if (typeof obj.data === "object") {
          const inner = obj.data as Record<string, unknown>;
          if (Array.isArray(inner.files)) return inner.files as IFile[];
        }
      }

      // { file: IFile }
      if (obj.file != null && typeof obj.file === "object") {
        return [obj.file as IFile];
      }
    }

    return [];
  };

  // ── Cloudinary Queries ─────────────────────────────────────────────────────

  const fetchMyCloudinaryImages = useCallback(async () => {
    setLoadingKey("images", true);
    setErrorKey("fetch", null);
    try {
      const res = await idImageAPI.getMyCloudinaryImages();
      setState((prev) => ({ ...prev, images: res.files ?? [] }));
    } catch (err) {
      if ((err as { status?: number }).status === 404) return;
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
        const [uploadedFile] = normaliseFilesResponse(res);

        if (uploadedFile) {
          setState((prev) => ({
            ...prev,
            images: [...prev.images, uploadedFile],
          }));
        }
        return uploadedFile ?? null;
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

        // Normalise whatever shape the API returned into a flat array.
        const uploadedFiles = normaliseFilesResponse(res);

        if (uploadedFiles.length > 0) {
          setState((prev) => ({
            ...prev,
            images: [...prev.images, ...uploadedFiles],
          }));
        }

        // KEY FIX: return the array (even if empty) to signal SUCCESS.
        // null is reserved exclusively for the catch path (actual API error).
        // Callers should check `results !== null`, not `results?.length`.
        return uploadedFiles;
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
      if ((err as { status?: number }).status === 404) return;
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
