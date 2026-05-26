import { providerGalleryAPI } from "@/lib/api/files/ProviderGallery.api";
import {
  IFile,
  ProviderGalleryStatsResponse,
  UploadProviderGalleryImageResponse,
  UploadMultipleProviderGalleryImagesResponse,
  ProviderGalleryHistoryResponse,
  OptimizedProviderGalleryImageResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
  MutationResponse,
} from "@/types/files.types";
import { useState, useEffect, useCallback } from "react";

// ─── State & Return Types ──────────────────────────────────────────────────────

interface UseProviderGalleryState {
  /** Active gallery images for the current provider (Cloudinary source). */
  galleryImages: IFile[];
  galleryHistory: IFile[];
  galleryStats: ProviderGalleryStatsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseProviderGalleryActions {
  // Cloudinary — uploads
  uploadGalleryImage: (
    file: File,
  ) => Promise<UploadProviderGalleryImageResponse | null>;
  uploadMultipleGalleryImages: (
    files: File[],
  ) => Promise<UploadMultipleProviderGalleryImagesResponse | null>;

  // Cloudinary — reads (public)
  fetchPublicGallery: (providerId: string) => Promise<IFile[]>;
  fetchOptimizedGalleryImage: (
    providerId: string,
    fileId: string,
  ) => Promise<OptimizedProviderGalleryImageResponse | null>;

  // Cloudinary — delete
  deleteGalleryImageFromCloudinary: (
    providerId: string,
    fileId: string,
  ) => Promise<boolean>;

  // MongoDB — reads
  fetchGalleryRecord: (providerId: string) => Promise<IFile[]>;
  fetchPublicGalleryRecord: (providerId: string) => Promise<IFile[]>;
  fetchGalleryHistory: (
    providerId: string,
  ) => Promise<ProviderGalleryHistoryResponse | null>;
  fetchGalleryStats: (
    providerId: string,
  ) => Promise<ProviderGalleryStatsResponse | null>;

  // MongoDB — mutations
  updateGalleryImageMetadata: (
    providerId: string,
    fileId: string,
    metadata: UpdateFileMetadataBody["metadata"],
  ) => Promise<MutationResponse | null>;
  archiveGalleryImage: (
    providerId: string,
    fileId: string,
  ) => Promise<ArchiveResponse | null>;
  restoreGalleryImage: (
    providerId: string,
    fileId: string,
  ) => Promise<MutationResponse | null>;
  deleteGalleryImage: (providerId: string, fileId: string) => Promise<boolean>;
  cleanupArchivedGallery: (
    providerId: string,
  ) => Promise<CleanupResponse | null>;

  // Utility
  clearError: () => void;
}

export type UseProviderGalleryReturn = UseProviderGalleryState &
  UseProviderGalleryActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param providerId When provided the hook auto-fetches the public gallery on
 *                   mount and keeps `galleryImages` in sync after mutations.
 */
export function useProviderGallery(
  providerId?: string,
): UseProviderGalleryReturn {
  const [galleryImages, setGalleryImages] = useState<IFile[]>([]);
  const [galleryHistory, setGalleryHistory] = useState<IFile[]>([]);
  const [galleryStats, setGalleryStats] =
    useState<ProviderGalleryStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const captureError = (err: unknown, fallback: string) =>
    setError(err instanceof Error ? err.message : fallback);

  // ── Auto-fetch ───────────────────────────────────────────────────────────────

  const fetchPublicGallery = useCallback(
    async (id: string): Promise<IFile[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.getPublicGallery(id);
        if (id === providerId) setGalleryImages(result.files);
        return result.files;
      } catch (err) {
        captureError(err, "Failed to fetch gallery");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  useEffect(() => {
    if (!providerId) return;
    fetchPublicGallery(providerId);
  }, [providerId, fetchPublicGallery]);

  // ── Cloudinary — uploads ─────────────────────────────────────────────────────

  const uploadGalleryImage = useCallback(
    async (file: File): Promise<UploadProviderGalleryImageResponse | null> => {
      if (!providerId) {
        setError("providerId is required to upload a gallery image");
        return null;
      }
      setIsUploading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.uploadGalleryImage(file);
        setGalleryImages((prev) => [...prev, result.file]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload gallery image");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [providerId],
  );

  const uploadMultipleGalleryImages = useCallback(
    async (
      files: File[],
    ): Promise<UploadMultipleProviderGalleryImagesResponse | null> => {
      if (!providerId) {
        setError("providerId is required to upload gallery images");
        return null;
      }
      setIsUploading(true);
      setError(null);
      try {
        const result =
          await providerGalleryAPI.uploadMultipleGalleryImages(files);
        setGalleryImages((prev) => [...prev, ...result.files]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload gallery images");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [providerId],
  );

  // ── Cloudinary — reads ───────────────────────────────────────────────────────

  const fetchOptimizedGalleryImage = useCallback(
    async (
      id: string,
      fileId: string,
    ): Promise<OptimizedProviderGalleryImageResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await providerGalleryAPI.getOptimizedGalleryImage(id, fileId);
      } catch (err) {
        captureError(err, "Failed to fetch optimized gallery image");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Cloudinary — delete ──────────────────────────────────────────────────────

  const deleteGalleryImageFromCloudinary = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await providerGalleryAPI.deleteGalleryImageFromCloudinary(id, fileId);
        if (id === providerId)
          setGalleryImages((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete gallery image from Cloudinary");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  // ── MongoDB — reads ──────────────────────────────────────────────────────────

  const fetchGalleryRecord = useCallback(
    async (id: string): Promise<IFile[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.getGalleryRecord(id);
        return result.files;
      } catch (err) {
        captureError(err, "Failed to fetch gallery record");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchPublicGalleryRecord = useCallback(
    async (id: string): Promise<IFile[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.getPublicGalleryRecord(id);
        return result.files;
      } catch (err) {
        captureError(err, "Failed to fetch public gallery record");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchGalleryHistory = useCallback(
    async (id: string): Promise<ProviderGalleryHistoryResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.getGalleryHistory(id);
        setGalleryHistory(result.history);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch gallery history");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchGalleryStats = useCallback(
    async (id: string): Promise<ProviderGalleryStatsResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.getGalleryStats(id);
        setGalleryStats(result);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch gallery stats");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── MongoDB — mutations ──────────────────────────────────────────────────────

  const updateGalleryImageMetadata = useCallback(
    async (
      id: string,
      fileId: string,
      metadata: UpdateFileMetadataBody["metadata"],
    ): Promise<MutationResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await providerGalleryAPI.updateGalleryImageMetadata(
          id,
          fileId,
          metadata,
        );
      } catch (err) {
        captureError(err, "Failed to update gallery image metadata");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const archiveGalleryImage = useCallback(
    async (id: string, fileId: string): Promise<ArchiveResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.archiveGalleryImage(id, fileId);
        if (id === providerId)
          setGalleryImages((prev) =>
            prev.map((f) =>
              f._id === fileId ? { ...f, status: "archived" } : f,
            ),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to archive gallery image");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  const restoreGalleryImage = useCallback(
    async (id: string, fileId: string): Promise<MutationResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.restoreGalleryImage(id, fileId);
        if (id === providerId)
          setGalleryImages((prev) =>
            prev.map((f) =>
              f._id === fileId ? { ...f, status: "active" } : f,
            ),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to restore gallery image");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  const deleteGalleryImage = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await providerGalleryAPI.deleteGalleryImage(id, fileId);
        if (id === providerId)
          setGalleryImages((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete gallery image");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  const cleanupArchivedGallery = useCallback(
    async (id: string): Promise<CleanupResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await providerGalleryAPI.cleanupArchivedGallery(id);
        if (id === providerId)
          setGalleryImages((prev) =>
            prev.filter((f) => f.status !== "archived"),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to cleanup archived gallery images");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  return {
    galleryImages,
    galleryHistory,
    galleryStats,
    isLoading,
    isUploading,
    error,
    uploadGalleryImage,
    uploadMultipleGalleryImages,
    fetchPublicGallery,
    fetchOptimizedGalleryImage,
    deleteGalleryImageFromCloudinary,
    fetchGalleryRecord,
    fetchPublicGalleryRecord,
    fetchGalleryHistory,
    fetchGalleryStats,
    updateGalleryImageMetadata,
    archiveGalleryImage,
    restoreGalleryImage,
    deleteGalleryImage,
    cleanupArchivedGallery,
    clearError,
  };
}
