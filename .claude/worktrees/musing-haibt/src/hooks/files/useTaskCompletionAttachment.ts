import { taskCompletionAttachmentAPI } from "@/lib/api/files/taskCompletionAttachment.api";
import {
  IFile,
  TaskCompletionProofStatsResponse,
  UploadTaskCompletionProofResponse,
  UploadMultipleTaskCompletionProofsResponse,
  TaskCompletionProofHistoryResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
  MutationResponse,
} from "@/types/files.types";
import { useState, useEffect, useCallback } from "react";

// ─── State & Return Types ──────────────────────────────────────────────────────

interface UseTaskCompletionAttachmentState {
  /** Active proof files for the current completion attempt. */
  proofs: IFile[];
  proofHistory: IFile[];
  proofStats: TaskCompletionProofStatsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseTaskCompletionAttachmentActions {
  // Cloudinary — uploads
  uploadProof: (
    completionId: string,
    file: File,
  ) => Promise<UploadTaskCompletionProofResponse | null>;
  uploadMultipleProofs: (
    completionId: string,
    files: File[],
  ) => Promise<UploadMultipleTaskCompletionProofsResponse | null>;

  // Cloudinary — reads
  fetchProofs: (completionId: string) => Promise<IFile[]>;

  // Cloudinary — delete
  deleteProofFromCloudinary: (
    completionId: string,
    fileId: string,
  ) => Promise<boolean>;

  // MongoDB — reads
  fetchProofRecord: (completionId: string) => Promise<IFile[]>;
  fetchProofHistory: (
    completionId: string,
  ) => Promise<TaskCompletionProofHistoryResponse | null>;
  fetchProofStats: (
    completionId: string,
  ) => Promise<TaskCompletionProofStatsResponse | null>;

  // MongoDB — mutations
  updateProofMetadata: (
    completionId: string,
    fileId: string,
    metadata: UpdateFileMetadataBody["metadata"],
  ) => Promise<MutationResponse | null>;
  archiveProof: (
    completionId: string,
    fileId: string,
  ) => Promise<ArchiveResponse | null>;
  restoreProof: (
    completionId: string,
    fileId: string,
  ) => Promise<MutationResponse | null>;
  deleteProof: (completionId: string, fileId: string) => Promise<boolean>;
  cleanupArchivedProofs: (
    completionId: string,
  ) => Promise<CleanupResponse | null>;

  // Utility
  clearError: () => void;
}

export type UseTaskCompletionAttachmentReturn =
  UseTaskCompletionAttachmentState & UseTaskCompletionAttachmentActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param completionId When provided the hook auto-fetches proof files on mount
 *                     and keeps `proofs` in sync after mutations.
 */
export function useTaskCompletionAttachment(
  completionId?: string,
): UseTaskCompletionAttachmentReturn {
  const [proofs, setProofs] = useState<IFile[]>([]);
  const [proofHistory, setProofHistory] = useState<IFile[]>([]);
  const [proofStats, setProofStats] =
    useState<TaskCompletionProofStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const captureError = (err: unknown, fallback: string) =>
    setError(err instanceof Error ? err.message : fallback);

  // ── Auto-fetch ───────────────────────────────────────────────────────────────

  const fetchProofs = useCallback(
    async (id: string): Promise<IFile[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.getProofs(id);
        if (id === completionId) setProofs(result.files);
        return result.files;
      } catch (err) {
        captureError(err, "Failed to fetch proof files");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  useEffect(() => {
    if (!completionId) return;
    fetchProofs(completionId);
  }, [completionId, fetchProofs]);

  // ── Cloudinary — uploads ─────────────────────────────────────────────────────

  const uploadProof = useCallback(
    async (
      id: string,
      file: File,
    ): Promise<UploadTaskCompletionProofResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.uploadProof(id, file);
        if (id === completionId) setProofs((prev) => [...prev, result.file]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload proof file");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [completionId],
  );

  const uploadMultipleProofs = useCallback(
    async (
      id: string,
      files: File[],
    ): Promise<UploadMultipleTaskCompletionProofsResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.uploadMultipleProofs(
          id,
          files,
        );
        if (id === completionId)
          setProofs((prev) => [...prev, ...result.files]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload proof files");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [completionId],
  );

  // ── Cloudinary — delete ──────────────────────────────────────────────────────

  const deleteProofFromCloudinary = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await taskCompletionAttachmentAPI.deleteProofFromCloudinary(id, fileId);
        if (id === completionId)
          setProofs((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete proof file from Cloudinary");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  // ── MongoDB — reads ──────────────────────────────────────────────────────────

  const fetchProofRecord = useCallback(async (id: string): Promise<IFile[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskCompletionAttachmentAPI.getProofRecord(id);
      return result.files;
    } catch (err) {
      captureError(err, "Failed to fetch proof record");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProofHistory = useCallback(
    async (id: string): Promise<TaskCompletionProofHistoryResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.getProofHistory(id);
        setProofHistory(result.history);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch proof history");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchProofStats = useCallback(
    async (id: string): Promise<TaskCompletionProofStatsResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.getProofStats(id);
        setProofStats(result);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch proof stats");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── MongoDB — mutations ──────────────────────────────────────────────────────

  const updateProofMetadata = useCallback(
    async (
      id: string,
      fileId: string,
      metadata: UpdateFileMetadataBody["metadata"],
    ): Promise<MutationResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await taskCompletionAttachmentAPI.updateProofMetadata(
          id,
          fileId,
          metadata,
        );
      } catch (err) {
        captureError(err, "Failed to update proof metadata");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const archiveProof = useCallback(
    async (id: string, fileId: string): Promise<ArchiveResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.archiveProof(
          id,
          fileId,
        );
        if (id === completionId)
          setProofs((prev) =>
            prev.map((f) =>
              f._id === fileId ? { ...f, status: "archived" } : f,
            ),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to archive proof file");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  const restoreProof = useCallback(
    async (id: string, fileId: string): Promise<MutationResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskCompletionAttachmentAPI.restoreProof(
          id,
          fileId,
        );
        if (id === completionId)
          setProofs((prev) =>
            prev.map((f) =>
              f._id === fileId ? { ...f, status: "active" } : f,
            ),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to restore proof file");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  const deleteProof = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await taskCompletionAttachmentAPI.deleteProof(id, fileId);
        if (id === completionId)
          setProofs((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete proof file");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  const cleanupArchivedProofs = useCallback(
    async (id: string): Promise<CleanupResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result =
          await taskCompletionAttachmentAPI.cleanupArchivedProofs(id);
        if (id === completionId)
          setProofs((prev) => prev.filter((f) => f.status !== "archived"));
        return result;
      } catch (err) {
        captureError(err, "Failed to cleanup archived proof files");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [completionId],
  );

  return {
    proofs,
    proofHistory,
    proofStats,
    isLoading,
    isUploading,
    error,
    uploadProof,
    uploadMultipleProofs,
    fetchProofs,
    deleteProofFromCloudinary,
    fetchProofRecord,
    fetchProofHistory,
    fetchProofStats,
    updateProofMetadata,
    archiveProof,
    restoreProof,
    deleteProof,
    cleanupArchivedProofs,
    clearError,
  };
}
