import { categoryCoverAPI } from "@/lib/api/files/categoryCover.api";
import {
  IFile,
  CoverStatsResponse,
  UploadOrphanCoverResponse,
  OptimizedCoverResponse,
  PublicCoverResponse,
  CoverHistoryResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
} from "@/types/files.types";
import { useState, useEffect, useCallback } from "react";

// ─── State & Return Types ──────────────────────────────────────────────────────
interface UseCategoryCoverState {
  coverRecord: IFile | null;
  coverHistory: IFile[];
  coverStats: CoverStatsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseCategoryCoverActions {
  // Cloudinary
  uploadCover: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  linkCover: (
    categoryId: string,
    fileId: string,
  ) => Promise<UploadOrphanCoverResponse | null>;
  getOptimizedCover: (
    categoryId: string,
  ) => Promise<OptimizedCoverResponse | null>;
  getPublicCover: (categoryId: string) => Promise<PublicCoverResponse | null>;
  deleteCloudinaryCover: (categoryId: string) => Promise<boolean>;
  // MongoDB reads
  fetchCoverRecord: (categoryId: string) => Promise<IFile | null>;
  fetchPublicCoverRecord: (categoryId: string) => Promise<IFile | null>;
  fetchCoverHistory: (
    categoryId: string,
  ) => Promise<CoverHistoryResponse | null>;
  fetchCoverStats: (categoryId: string) => Promise<CoverStatsResponse | null>;
  // MongoDB writes
  updateCoverMetadata: (
    categoryId: string,
    body: UpdateFileMetadataBody,
  ) => Promise<IFile | null>;
  archiveCover: (categoryId: string) => Promise<ArchiveResponse | null>;
  restoreCover: (categoryId: string, fileId: string) => Promise<IFile | null>;
  deleteCoverRecord: (categoryId: string) => Promise<boolean>;
  cleanupArchivedCovers: (
    categoryId: string,
  ) => Promise<CleanupResponse | null>;
  // Utility
  clearError: () => void;
}

export type UseCategoryCoverReturn = UseCategoryCoverState &
  UseCategoryCoverActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param categoryId When provided the hook auto-fetches the cover record on
 *                   mount and keeps `coverRecord` in sync with mutations.
 */
export function useCategoryCover(categoryId?: string): UseCategoryCoverReturn {
  const [coverRecord, setCoverRecord] = useState<IFile | null>(null);
  const [coverHistory, setCoverHistory] = useState<IFile[]>([]);
  const [coverStats, setCoverStats] = useState<CoverStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /** Normalises any thrown value into a string and writes to `error` state. */
  const captureError = (err: unknown, fallback: string) =>
    setError(err instanceof Error ? err.message : fallback);

  // ── Auto-fetch ───────────────────────────────────────────────────────────────

  const fetchCoverRecord = useCallback(
    async (id: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const record = await categoryCoverAPI.getCoverRecord(id);
        if (id === categoryId) setCoverRecord(record);
        return record;
      } catch (err) {
        captureError(err, "Failed to fetch cover record");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  useEffect(() => {
    if (!categoryId) return;
    fetchCoverRecord(categoryId);
  }, [categoryId, fetchCoverRecord]);

  // ── Cloudinary ───────────────────────────────────────────────────────────────

  const uploadCover = useCallback(
    async (file: File): Promise<UploadOrphanCoverResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        return await categoryCoverAPI.uploadCover(file);
      } catch (err) {
        captureError(err, "Failed to upload cover");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  /**
   * Links an already-uploaded orphan file to a category.
   * Always call this after `uploadCover` — never patch the category directly.
   *
   * Flow: uploadCover(file) → get fileId → linkCover(categoryId, fileId)
   */
  const linkCover = useCallback(
    async (
      id: string,
      fileId: string,
    ): Promise<UploadOrphanCoverResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await categoryCoverAPI.linkCover(id, fileId);
        // Re-fetch the full record so coverRecord reflects the newly linked file,
        // including any fields the backend stamps (entityId, catCoverId, etc.).
        if (id === categoryId) await fetchCoverRecord(id);
        return result;
      } catch (err) {
        captureError(err, "Failed to link cover to category");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId, fetchCoverRecord],
  );

  const getOptimizedCover = useCallback(
    async (id: string): Promise<OptimizedCoverResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await categoryCoverAPI.getOptimizedCover(id);
      } catch (err) {
        captureError(err, "Failed to get optimized cover");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getPublicCover = useCallback(
    async (id: string): Promise<PublicCoverResponse | null> => {
      setError(null);
      try {
        return await categoryCoverAPI.getPublicCover(id);
      } catch (err) {
        captureError(err, "Failed to get public cover");
        return null;
      }
    },
    [],
  );

  const deleteCloudinaryCover = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await categoryCoverAPI.deleteCloudinaryCover(id);
        if (id === categoryId) setCoverRecord(null);
        return true;
      } catch (err) {
        captureError(err, "Failed to delete cover from Cloudinary");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  // ── MongoDB reads ────────────────────────────────────────────────────────────

  const fetchPublicCoverRecord = useCallback(
    async (id: string): Promise<IFile | null> => {
      setError(null);
      try {
        const record = await categoryCoverAPI.getPublicCoverRecord(id);
        if (id === categoryId) setCoverRecord(record);
        return record;
      } catch (err) {
        captureError(err, "Failed to fetch public cover record");
        return null;
      }
    },
    [categoryId],
  );

  const fetchCoverHistory = useCallback(
    async (id: string): Promise<CoverHistoryResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await categoryCoverAPI.getCoverHistory(id);
        setCoverHistory(result.history);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch cover history");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchCoverStats = useCallback(
    async (id: string): Promise<CoverStatsResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const stats = await categoryCoverAPI.getCoverStats(id);
        setCoverStats(stats);
        return stats;
      } catch (err) {
        captureError(err, "Failed to fetch cover stats");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── MongoDB writes ───────────────────────────────────────────────────────────

  const updateCoverMetadata = useCallback(
    async (id: string, body: UpdateFileMetadataBody): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await categoryCoverAPI.updateCoverMetadata(id, body);
        if (id === categoryId) setCoverRecord(updated);
        return updated;
      } catch (err) {
        captureError(err, "Failed to update cover metadata");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  const archiveCover = useCallback(
    async (id: string): Promise<ArchiveResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await categoryCoverAPI.archiveCover(id);
        if (id === categoryId)
          setCoverRecord((prev) =>
            prev ? { ...prev, status: "archived" } : prev,
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to archive cover");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  const restoreCover = useCallback(
    async (id: string, fileId: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const restored = await categoryCoverAPI.restoreCover(id, fileId);
        if (id === categoryId) setCoverRecord(restored);
        return restored;
      } catch (err) {
        captureError(err, "Failed to restore cover");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  const deleteCoverRecord = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await categoryCoverAPI.deleteCoverRecord(id);
        if (id === categoryId) setCoverRecord(null);
        return true;
      } catch (err) {
        captureError(err, "Failed to delete cover record");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId],
  );

  const cleanupArchivedCovers = useCallback(
    async (id: string): Promise<CleanupResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await categoryCoverAPI.cleanupArchivedCovers(id);
      } catch (err) {
        captureError(err, "Failed to cleanup archived covers");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    // state
    coverRecord,
    coverHistory,
    coverStats,
    isLoading,
    isUploading,
    error,
    // actions
    uploadCover,
    linkCover,
    getOptimizedCover,
    getPublicCover,
    deleteCloudinaryCover,
    fetchCoverRecord,
    fetchPublicCoverRecord,
    fetchCoverHistory,
    fetchCoverStats,
    updateCoverMetadata,
    archiveCover,
    restoreCover,
    deleteCoverRecord,
    cleanupArchivedCovers,
    clearError,
  };
}
