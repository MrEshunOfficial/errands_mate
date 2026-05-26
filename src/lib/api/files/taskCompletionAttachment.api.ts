// api/files/taskCompletionAttachment.api.ts
//
// API client for task-completion proof file operations.
// Mount point: /api/task-completions
//
// entityId is always the completion document's own _id (completionId),
// keeping proof files cleanly scoped to a single completion attempt.
//
// All routes are auth-gated.

import {
  UploadTaskCompletionProofResponse,
  UploadMultipleTaskCompletionProofsResponse,
  TaskCompletionProofListResponse,
  MutationResponse,
  TaskCompletionProofHistoryResponse,
  TaskCompletionProofStatsResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
} from "@/types/files.types";
import { APIClient } from "../base/api-client";

class TaskCompletionAttachmentAPI extends APIClient {
  private readonly base = "/api/task-completion-proof";

  // ─── Upload helpers (FormData — no JSON Content-Type) ──────────────────────

  /**
   * Build auth-only headers for multipart uploads.
   * Intentionally omits Content-Type so the browser sets the multipart boundary.
   */
  private buildUploadHeaders(): HeadersInit {
    const headers: Record<string, string> = {};
    const token = this.getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  private async postFormData<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: this.buildUploadHeaders(),
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const json = await response.json();
    return (json?.data ?? json) as T;
  }

  // ─── Cloudinary — uploads ──────────────────────────────────────────────────

  /**
   * Upload a single proof file for a completion attempt.
   * Appends to the completion's `completionProofAttachments[]`.
   */
  async uploadProof(
    completionId: string,
    file: File,
  ): Promise<UploadTaskCompletionProofResponse> {
    const fd = new FormData();
    fd.append("file", file);
    return this.postFormData<UploadTaskCompletionProofResponse>(
      `${this.base}/${completionId}/proof/cloudinary/new`,
      fd,
    );
  }

  /**
   * Upload up to 10 proof files for a completion attempt in one request.
   * All files are appended to the completion's `completionProofAttachments[]`.
   */
  async uploadMultipleProofs(
    completionId: string,
    files: File[],
  ): Promise<UploadMultipleTaskCompletionProofsResponse> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return this.postFormData<UploadMultipleTaskCompletionProofsResponse>(
      `${this.base}/${completionId}/proof/cloudinary/batch`,
      fd,
    );
  }

  // ─── Cloudinary — reads ────────────────────────────────────────────────────

  /** Returns all active proof files for a completion attempt (Cloudinary source). */
  async getProofs(
    completionId: string,
  ): Promise<TaskCompletionProofListResponse> {
    return this.get<TaskCompletionProofListResponse>(
      `${this.base}/${completionId}/proof/cloudinary`,
    );
  }

  // ─── Cloudinary — delete ───────────────────────────────────────────────────

  /**
   * Deletes a proof file from Cloudinary + MongoDB and pulls it from
   * the completion's `completionProofAttachments[]`.
   */
  async deleteProofFromCloudinary(
    completionId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.delete<MutationResponse>(
      `${this.base}/${completionId}/proof/cloudinary/${fileId}`,
    );
  }

  // ─── MongoDB — reads ───────────────────────────────────────────────────────

  /** Returns the MongoDB file record for the completion's proof files. */
  async getProofRecord(
    completionId: string,
  ): Promise<TaskCompletionProofListResponse> {
    return this.get<TaskCompletionProofListResponse>(
      `${this.base}/${completionId}/proof/record`,
    );
  }

  /** Full upload history (all statuses) for a completion's proof files. */
  async getProofHistory(
    completionId: string,
  ): Promise<TaskCompletionProofHistoryResponse> {
    return this.get<TaskCompletionProofHistoryResponse>(
      `${this.base}/${completionId}/proof/history`,
    );
  }

  /** Storage + usage stats for a completion's proof files. */
  async getProofStats(
    completionId: string,
  ): Promise<TaskCompletionProofStatsResponse> {
    return this.get<TaskCompletionProofStatsResponse>(
      `${this.base}/${completionId}/proof/stats`,
    );
  }

  // ─── MongoDB — mutations ───────────────────────────────────────────────────

  /** Update arbitrary metadata on a proof file. */
  async updateProofMetadata(
    completionId: string,
    fileId: string,
    metadata: UpdateFileMetadataBody["metadata"],
  ): Promise<MutationResponse> {
    return this.patch<MutationResponse>(
      `${this.base}/${completionId}/proof/${fileId}/metadata`,
      { metadata } satisfies UpdateFileMetadataBody,
    );
  }

  /** Soft-archive a proof file (marks it inactive without deleting). */
  async archiveProof(
    completionId: string,
    fileId: string,
  ): Promise<ArchiveResponse> {
    return this.post<ArchiveResponse>(
      `${this.base}/${completionId}/proof/${fileId}/archive`,
    );
  }

  /** Restore a previously archived proof file to active status. */
  async restoreProof(
    completionId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.post<MutationResponse>(
      `${this.base}/${completionId}/proof/restore/${fileId}`,
    );
  }

  /**
   * Hard-delete a proof file from the database only.
   * Use `deleteProofFromCloudinary` to also remove the asset from Cloudinary.
   */
  async deleteProof(
    completionId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.delete<MutationResponse>(
      `${this.base}/${completionId}/proof/${fileId}`,
    );
  }

  /** Permanently remove all archived proof files for a completion attempt. */
  async cleanupArchivedProofs(completionId: string): Promise<CleanupResponse> {
    return this.delete<CleanupResponse>(
      `${this.base}/${completionId}/proof/cleanup`,
    );
  }
}

export const taskCompletionAttachmentAPI = new TaskCompletionAttachmentAPI();
