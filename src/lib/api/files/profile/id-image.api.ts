// api/files/id-image.api.ts
//
// Mount point: /api/id-image
//
// All routes are private — there is no public read endpoint for ID documents.
// Batch upload supports a maximum of 2 files (enforced by the backend middleware).

import {
  IdImageHistoryResponse,
  IFile,
  UpdateFileMetadataBody,
  UploadIdImageResponse,
  UploadMultipleIdImagesResponse,
  IdImageListResponse,
  IdImageStatsResponse,
} from "@/types/files.types";
import { APIClient } from "../../base/api-client";

// ─── ID Image API Client ───────────────────────────────────────────────────────

export class IdImageAPIClient extends APIClient {
  private readonly base = "/api/id-image";

  // ── Multipart helper ───────────────────────────────────────────────────────
  //
  // Mirrors the same pattern used in ProfilePictureAPIClient. Does NOT set
  // Content-Type so the browser can write the multipart boundary automatically.
  //
  // Response unwrapping handles three shapes the backend may return:
  //   1. { data: { files: [...] } }  →  returns { files: [...] }
  //   2. { data: [...] }             →  returns [...]
  //   3. { files: [...] }            →  returns { files: [...] } as-is
  //   4. Raw value                   →  returned as-is

  private async postMultipart<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    const token = this.getAuthToken();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const responseData = await response.json();

    // Unwrap { data: ... } envelope if present — covers both
    // { data: { files: [...] } } and { data: [...] }
    if (responseData?.data) return responseData.data as T;

    // Already the right shape: { files: [...] }, { file: {...} }, etc.
    return responseData as T;
  }

  // ── Cloudinary ─────────────────────────────────────────────────────────────

  /**
   * POST /cloudinary/new
   * Uploads a single ID image to Cloudinary and appends its record to the
   * user's idImages[] array.
   */
  async uploadSingle(file: File): Promise<UploadIdImageResponse> {
    const form = new FormData();
    form.append("file", file);
    return this.postMultipart<UploadIdImageResponse>(
      `${this.base}/cloudinary/new`,
      form,
    );
  }

  /**
   * POST /cloudinary/batch
   * Uploads up to 2 ID images in a single request. The backend middleware
   * rejects requests with more than 2 files.
   */
  async uploadBatch(files: File[]): Promise<UploadMultipleIdImagesResponse> {
    if (files.length > 2) {
      throw new Error("ID image batch upload is limited to 2 files.");
    }
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return this.postMultipart<UploadMultipleIdImagesResponse>(
      `${this.base}/cloudinary/batch`,
      form,
    );
  }

  /**
   * GET /cloudinary/me
   * Returns all active ID image CDN URLs for the authenticated user.
   */
  async getMyCloudinaryImages(): Promise<IdImageListResponse> {
    return this.get<IdImageListResponse>(`${this.base}/cloudinary/me`);
  }

  /**
   * DELETE /cloudinary/:fileId
   * Deletes a specific ID image from Cloudinary, removes its MongoDB record,
   * and pulls it from the user's idImages[] array.
   */
  async deleteFromCloudinary(fileId: string): Promise<IFile> {
    return this.delete<IFile>(`${this.base}/cloudinary/${fileId}`);
  }

  // ── MongoDB ────────────────────────────────────────────────────────────────

  /**
   * GET /record
   * Returns the active ID image MongoDB record for the authenticated user.
   */
  async getRecord(): Promise<IFile> {
    return this.get<IFile>(`${this.base}/record`);
  }

  /**
   * GET /history
   * Returns all ID image records (active + archived) for the authenticated user.
   */
  async getHistory(): Promise<IdImageHistoryResponse> {
    return this.get<IdImageHistoryResponse>(`${this.base}/history`);
  }

  /**
   * GET /stats
   * Returns upload counts and storage usage for ID images.
   */
  async getStats(): Promise<IdImageStatsResponse> {
    return this.get<IdImageStatsResponse>(`${this.base}/stats`);
  }

  /**
   * PATCH /:fileId/metadata
   * Updates arbitrary metadata on a specific ID image record.
   */
  async updateMetadata(
    fileId: string,
    body: UpdateFileMetadataBody,
  ): Promise<IFile> {
    return this.patch<IFile>(`${this.base}/${fileId}/metadata`, body);
  }

  /**
   * POST /:fileId/archive
   * Marks a specific ID image as archived without deleting it.
   */
  async archive(fileId: string): Promise<IFile> {
    return this.post<IFile>(`${this.base}/${fileId}/archive`);
  }

  /**
   * POST /restore/:fileId
   * Restores a previously archived ID image.
   */
  async restore(fileId: string): Promise<IFile> {
    return this.post<IFile>(`${this.base}/restore/${fileId}`);
  }

  /**
   * DELETE /:fileId
   * Deletes a specific ID image MongoDB record (does not touch Cloudinary).
   */
  async deleteRecord(fileId: string): Promise<IFile> {
    return this.delete<IFile>(`${this.base}/${fileId}`);
  }

  /**
   * DELETE /cleanup
   * Permanently removes all archived ID image records for the authenticated user.
   */
  async cleanupArchived(): Promise<{ deletedCount: number }> {
    return this.delete<{ deletedCount: number }>(`${this.base}/cleanup`);
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const idImageAPI = new IdImageAPIClient();
