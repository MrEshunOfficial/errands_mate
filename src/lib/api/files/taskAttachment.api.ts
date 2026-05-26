import {
  UploadAttachmentResponse,
  UploadMultipleAttachmentsResponse,
  AttachmentListResponse,
  MutationResponse,
  IFile,
  AttachmentHistoryResponse,
  AttachmentStatsResponse,
  CleanupResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
} from "@/types/files.types";
import { APIClient } from "../base/api-client";

export class TaskAttachmentAPI extends APIClient {
  private readonly base = "api/task-attachment";

  private async postFile<T>(endpoint: string, fd: FormData): Promise<T> {
    const url = this.buildURL(endpoint);
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { method: "POST", headers, body: fd });
    if (!res.ok) await this.handleErrorResponse(res);

    const json = await res.json();
    if (json?.data) return json.data as T;
    return json as T;
  }

  // ── Cloudinary ──────────────────────────────────────────────────────────────

  uploadAttachment(
    taskId: string,
    file: File,
  ): Promise<UploadAttachmentResponse> {
    const fd = new FormData();
    fd.append("file", file);
    return this.postFile(
      `${this.base}/${taskId}/attachments/cloudinary/new`,
      fd,
    );
  }

  /** Batch upload — appends all files to the task's attachments[]. Max 10. */
  uploadMultipleAttachments(
    taskId: string,
    files: File[],
  ): Promise<UploadMultipleAttachmentsResponse> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return this.postFile(
      `${this.base}/${taskId}/attachments/cloudinary/batch`,
      fd,
    );
  }

  getAttachments(taskId: string): Promise<AttachmentListResponse> {
    return this.get(`${this.base}/${taskId}/attachments/cloudinary`);
  }

  deleteCloudinaryAttachment(
    taskId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.delete(
      `${this.base}/${taskId}/attachments/cloudinary/${fileId}`,
    );
  }

  // ── MongoDB ─────────────────────────────────────────────────────────────────

  getAttachmentRecord(taskId: string): Promise<IFile> {
    return this.get(`${this.base}/${taskId}/attachments/record`);
  }

  getAttachmentHistory(taskId: string): Promise<AttachmentHistoryResponse> {
    return this.get(`${this.base}/${taskId}/attachments/history`);
  }

  getAttachmentStats(taskId: string): Promise<AttachmentStatsResponse> {
    return this.get(`${this.base}/${taskId}/attachments/stats`);
  }

  cleanupArchivedAttachments(taskId: string): Promise<CleanupResponse> {
    return this.delete(`${this.base}/${taskId}/attachments/cleanup`);
  }

  updateAttachmentMetadata(
    taskId: string,
    fileId: string,
    body: UpdateFileMetadataBody,
  ): Promise<IFile> {
    return this.patch(
      `${this.base}/${taskId}/attachments/${fileId}/metadata`,
      body,
    );
  }

  archiveAttachment(taskId: string, fileId: string): Promise<ArchiveResponse> {
    return this.post(`${this.base}/${taskId}/attachments/${fileId}/archive`);
  }

  restoreAttachment(taskId: string, fileId: string): Promise<IFile> {
    return this.post(`${this.base}/${taskId}/attachments/restore/${fileId}`);
  }

  deleteAttachment(taskId: string, fileId: string): Promise<MutationResponse> {
    return this.delete(`${this.base}/${taskId}/attachments/${fileId}`);
  }
}

export const taskAttachmentAPI = new TaskAttachmentAPI();
