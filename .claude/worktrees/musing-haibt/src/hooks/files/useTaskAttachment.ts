import { taskAttachmentAPI } from "@/lib/api/files/taskAttachment.api";
import {
  IFile,
  AttachmentStatsResponse,
  UploadAttachmentResponse,
  UploadMultipleAttachmentsResponse,
  AttachmentHistoryResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
} from "@/types/files.types";
import { useState, useEffect, useCallback } from "react";

// ─── State & Return Types ──────────────────────────────────────────────────────

interface UseTaskAttachmentState {
  /** Live Cloudinary attachments for the current task. */
  attachments: IFile[];
  attachmentHistory: IFile[];
  attachmentStats: AttachmentStatsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseTaskAttachmentActions {
  // Cloudinary
  uploadAttachment: (
    taskId: string,
    file: File,
  ) => Promise<UploadAttachmentResponse | null>;
  uploadMultipleAttachments: (
    taskId: string,
    files: File[],
  ) => Promise<UploadMultipleAttachmentsResponse | null>;
  fetchAttachments: (taskId: string) => Promise<IFile[]>;
  deleteCloudinaryAttachment: (
    taskId: string,
    fileId: string,
  ) => Promise<boolean>;
  // MongoDB reads
  fetchAttachmentRecord: (taskId: string) => Promise<IFile | null>;
  fetchAttachmentHistory: (
    taskId: string,
  ) => Promise<AttachmentHistoryResponse | null>;
  fetchAttachmentStats: (
    taskId: string,
  ) => Promise<AttachmentStatsResponse | null>;
  // MongoDB writes
  updateAttachmentMetadata: (
    taskId: string,
    fileId: string,
    body: UpdateFileMetadataBody,
  ) => Promise<IFile | null>;
  archiveAttachment: (
    taskId: string,
    fileId: string,
  ) => Promise<ArchiveResponse | null>;
  restoreAttachment: (taskId: string, fileId: string) => Promise<IFile | null>;
  deleteAttachment: (taskId: string, fileId: string) => Promise<boolean>;
  cleanupArchivedAttachments: (
    taskId: string,
  ) => Promise<CleanupResponse | null>;
  // Utility
  clearError: () => void;
}

export type UseTaskAttachmentReturn = UseTaskAttachmentState &
  UseTaskAttachmentActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param taskId When provided the hook auto-fetches attachments on mount and
 *               keeps `attachments` in sync after uploads / deletes.
 */
export function useTaskAttachment(taskId?: string): UseTaskAttachmentReturn {
  const [attachments, setAttachments] = useState<IFile[]>([]);
  const [attachmentHistory, setAttachmentHistory] = useState<IFile[]>([]);
  const [attachmentStats, setAttachmentStats] =
    useState<AttachmentStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const captureError = (err: unknown, fallback: string) =>
    setError(err instanceof Error ? err.message : fallback);

  // ── Auto-fetch ───────────────────────────────────────────────────────────────

  const fetchAttachments = useCallback(
    async (id: string): Promise<IFile[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.getAttachments(id);
        if (id === taskId) setAttachments(result.files);
        return result.files;
      } catch (err) {
        captureError(err, "Failed to fetch attachments");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  useEffect(() => {
    if (!taskId) return;
    fetchAttachments(taskId);
  }, [taskId, fetchAttachments]);

  // ── Cloudinary ───────────────────────────────────────────────────────────────

  const uploadAttachment = useCallback(
    async (
      id: string,
      file: File,
    ): Promise<UploadAttachmentResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.uploadAttachment(id, file);
        // Optimistically append to list if this is the active task
        if (id === taskId) setAttachments((prev) => [...prev, result.file]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload attachment");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [taskId],
  );

  const uploadMultipleAttachments = useCallback(
    async (
      id: string,
      files: File[],
    ): Promise<UploadMultipleAttachmentsResponse | null> => {
      setIsUploading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.uploadMultipleAttachments(
          id,
          files,
        );
        if (id === taskId) setAttachments((prev) => [...prev, ...result.files]);
        return result;
      } catch (err) {
        captureError(err, "Failed to upload attachments");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [taskId],
  );

  const deleteCloudinaryAttachment = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await taskAttachmentAPI.deleteCloudinaryAttachment(id, fileId);
        if (id === taskId)
          setAttachments((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete attachment from Cloudinary");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  // ── MongoDB reads ────────────────────────────────────────────────────────────

  const fetchAttachmentRecord = useCallback(
    async (id: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await taskAttachmentAPI.getAttachmentRecord(id);
      } catch (err) {
        captureError(err, "Failed to fetch attachment record");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchAttachmentHistory = useCallback(
    async (id: string): Promise<AttachmentHistoryResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.getAttachmentHistory(id);
        setAttachmentHistory(result.history);
        return result;
      } catch (err) {
        captureError(err, "Failed to fetch attachment history");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchAttachmentStats = useCallback(
    async (id: string): Promise<AttachmentStatsResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const stats = await taskAttachmentAPI.getAttachmentStats(id);
        setAttachmentStats(stats);
        return stats;
      } catch (err) {
        captureError(err, "Failed to fetch attachment stats");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── MongoDB writes ───────────────────────────────────────────────────────────

  const updateAttachmentMetadata = useCallback(
    async (
      id: string,
      fileId: string,
      body: UpdateFileMetadataBody,
    ): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await taskAttachmentAPI.updateAttachmentMetadata(
          id,
          fileId,
          body,
        );
        if (id === taskId)
          setAttachments((prev) =>
            prev.map((f) => (f._id === fileId ? updated : f)),
          );
        return updated;
      } catch (err) {
        captureError(err, "Failed to update attachment metadata");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  const archiveAttachment = useCallback(
    async (id: string, fileId: string): Promise<ArchiveResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.archiveAttachment(id, fileId);
        if (id === taskId)
          setAttachments((prev) =>
            prev.map((f) =>
              f._id === fileId ? { ...f, status: "archived" } : f,
            ),
          );
        return result;
      } catch (err) {
        captureError(err, "Failed to archive attachment");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  const restoreAttachment = useCallback(
    async (id: string, fileId: string): Promise<IFile | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const restored = await taskAttachmentAPI.restoreAttachment(id, fileId);
        if (id === taskId)
          setAttachments((prev) =>
            prev.map((f) => (f._id === fileId ? restored : f)),
          );
        return restored;
      } catch (err) {
        captureError(err, "Failed to restore attachment");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  const deleteAttachment = useCallback(
    async (id: string, fileId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await taskAttachmentAPI.deleteAttachment(id, fileId);
        if (id === taskId)
          setAttachments((prev) => prev.filter((f) => f._id !== fileId));
        return true;
      } catch (err) {
        captureError(err, "Failed to delete attachment");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  const cleanupArchivedAttachments = useCallback(
    async (id: string): Promise<CleanupResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskAttachmentAPI.cleanupArchivedAttachments(id);
        // Remove archived items from local list as a best-effort sync
        if (id === taskId)
          setAttachments((prev) => prev.filter((f) => f.status !== "archived"));
        return result;
      } catch (err) {
        captureError(err, "Failed to cleanup archived attachments");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  return {
    attachments,
    attachmentHistory,
    attachmentStats,
    isLoading,
    isUploading,
    error,
    uploadAttachment,
    uploadMultipleAttachments,
    fetchAttachments,
    deleteCloudinaryAttachment,
    fetchAttachmentRecord,
    fetchAttachmentHistory,
    fetchAttachmentStats,
    updateAttachmentMetadata,
    archiveAttachment,
    restoreAttachment,
    deleteAttachment,
    cleanupArchivedAttachments,
    clearError,
  };
}
