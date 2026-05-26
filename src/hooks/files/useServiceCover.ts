import { serviceCoverAPI } from "@/lib/api/files/serviceCover.api";
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

interface UseServiceCoverState {
  coverRecord: IFile | null;
  coverHistory: IFile[];
  coverStats: CoverStatsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseServiceCoverActions {
  uploadCover: (file: File) => Promise<UploadOrphanCoverResponse | null>;
  linkCover: (
    serviceId: string,
    fileId: string,
  ) => Promise<UploadOrphanCoverResponse | null>;
  getOptimizedCover: (
    serviceId: string,
  ) => Promise<OptimizedCoverResponse | null>;
  getPublicCover: (serviceId: string) => Promise<PublicCoverResponse | null>;
  deleteCloudinaryCover: (serviceId: string) => Promise<boolean>;
  fetchCoverRecord: (serviceId: string) => Promise<IFile | null>;
  fetchPublicCoverRecord: (serviceId: string) => Promise<IFile | null>;
  fetchCoverHistory: (
    serviceId: string,
  ) => Promise<CoverHistoryResponse | null>;
  fetchCoverStats: (serviceId: string) => Promise<CoverStatsResponse | null>;
  updateCoverMetadata: (
    serviceId: string,
    body: UpdateFileMetadataBody,
  ) => Promise<IFile | null>;
  archiveCover: (serviceId: string) => Promise<ArchiveResponse | null>;
  restoreCover: (serviceId: string, fileId: string) => Promise<IFile | null>;
  deleteCoverRecord: (serviceId: string) => Promise<boolean>;
  cleanupArchivedCovers: (serviceId: string) => Promise<CleanupResponse | null>;
  clearError: () => void;
}

export type UseServiceCoverReturn = UseServiceCoverState &
  UseServiceCoverActions;

/**
 * @param serviceId When provided the hook auto-fetches the cover record on
 *                  mount and keeps `coverRecord` in sync with mutations.
 */
export function useServiceCover(serviceId?: string): UseServiceCoverReturn {
  const [coverRecord, setCoverRecord] = useState<IFile | null>(null);
  const [coverHistory, setCoverHistory] = useState<IFile[]>([]);
  const [coverStats, setCoverStats] = useState<CoverStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const captureError = (err: unknown, fallback: string) =>
    setError(err instanceof Error ? err.message : fallback);

  const fetchCoverRecord = useCallback(
    async (id: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const record = await serviceCoverAPI.getCoverRecord(id);
        if (id === serviceId) setCoverRecord(record);
        return record;
      } catch (err) {
        if ((err as { status?: number }).status === 404) {
          if (id === serviceId) setCoverRecord(null);
          return null;
        }
        captureError(err, "Failed to fetch cover record");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId],
  );

  useEffect(() => {
    if (!serviceId) return;
    fetchCoverRecord(serviceId);
  }, [serviceId, fetchCoverRecord]);

  const uploadCover = useCallback(
    async (file: File): Promise<UploadOrphanCoverResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        return await serviceCoverAPI.uploadCover(file);
      } catch (err) {
        captureError(err, "Failed to upload cover");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const linkCover = useCallback(
    async (
      id: string,
      fileId: string,
    ): Promise<UploadOrphanCoverResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await serviceCoverAPI.linkCover(id, fileId);
        // Re-fetch the full record so coverRecord reflects the newly linked file
        if (id === serviceId) await fetchCoverRecord(id);
        return result;
      } catch (err) {
        captureError(err, "Failed to link cover");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId, fetchCoverRecord],
  );

  const getOptimizedCover = useCallback(
    async (id: string): Promise<OptimizedCoverResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await serviceCoverAPI.getOptimizedCover(id);
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
        return await serviceCoverAPI.getPublicCover(id);
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
        await serviceCoverAPI.deleteCloudinaryCover(id);
        if (id === serviceId) setCoverRecord(null);
        return true;
      } catch (err) {
        captureError(err, "Failed to delete cover from Cloudinary");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId],
  );

  const fetchPublicCoverRecord = useCallback(
    async (id: string): Promise<IFile | null> => {
      setError(null);
      try {
        const record = await serviceCoverAPI.getPublicCoverRecord(id);
        if (id === serviceId) setCoverRecord(record);
        return record;
      } catch (err) {
        if ((err as { status?: number }).status === 404) {
          if (id === serviceId) setCoverRecord(null);
          return null;
        }
        captureError(err, "Failed to fetch public cover record");
        return null;
      }
    },
    [serviceId],
  );

  const fetchCoverHistory = useCallback(
    async (id: string): Promise<CoverHistoryResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await serviceCoverAPI.getCoverHistory(id);
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
        const stats = await serviceCoverAPI.getCoverStats(id);
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

  const updateCoverMetadata = useCallback(
    async (id: string, body: UpdateFileMetadataBody): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await serviceCoverAPI.updateCoverMetadata(id, body);
        if (id === serviceId) setCoverRecord(updated);
        return updated;
      } catch (err) {
        captureError(err, "Failed to update cover metadata");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId],
  );

  const archiveCover = useCallback(
    async (id: string): Promise<ArchiveResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await serviceCoverAPI.archiveCover(id);
        if (id === serviceId)
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
    [serviceId],
  );

  const restoreCover = useCallback(
    async (id: string, fileId: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const restored = await serviceCoverAPI.restoreCover(id, fileId);
        if (id === serviceId) setCoverRecord(restored);
        return restored;
      } catch (err) {
        captureError(err, "Failed to restore cover");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId],
  );

  const deleteCoverRecord = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await serviceCoverAPI.deleteCoverRecord(id);
        if (id === serviceId) setCoverRecord(null);
        return true;
      } catch (err) {
        captureError(err, "Failed to delete cover record");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceId],
  );

  const cleanupArchivedCovers = useCallback(
    async (id: string): Promise<CleanupResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await serviceCoverAPI.cleanupArchivedCovers(id);
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
    coverRecord,
    coverHistory,
    coverStats,
    isLoading,
    isUploading,
    error,
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
