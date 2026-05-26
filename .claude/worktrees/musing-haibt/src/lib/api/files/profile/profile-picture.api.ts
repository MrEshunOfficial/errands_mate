// api/files/profile-picture.api.ts
//
// Mount point: /api/profile-picture
//
// Multipart uploads bypass makeRequest (which JSON-stringifies the body and
// forces Content-Type: application/json). The private `postMultipart` helper
// below uses fetch directly so the browser sets the correct multipart boundary.

import {
  ProfilePictureHistoryResponse,
  IFile,
  UpdateFileMetadataBody,
  UploadProfilePictureResponse,
  OptimizedPictureResponse,
  ProfilePictureStatsResponse,
} from "@/types/files.types";
import { APIClient } from "../../base/api-client";
// ─── Profile Picture API Client ────────────────────────────────────────────────

export class ProfilePictureAPIClient extends APIClient {
  private readonly base = "/api/profile-picture";

  // ── Multipart helper ───────────────────────────────────────────────────────
  //
  // Does NOT set Content-Type — the browser auto-adds multipart/form-data with
  // the correct boundary when the body is a FormData instance.

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
    if (responseData?.data) return responseData.data as T;
    return responseData as T;
  }

  // ── Cloudinary ─────────────────────────────────────────────────────────────

  /**
   * POST /cloudinary/new
   * Archives the existing picture, uploads the new file to Cloudinary, and
   * links it to the authenticated user's profile.
   */
  async uploadProfilePicture(
    file: File,
  ): Promise<UploadProfilePictureResponse> {
    const form = new FormData();
    form.append("file", file);
    return this.postMultipart<UploadProfilePictureResponse>(
      `${this.base}/cloudinary/new`,
      form,
    );
  }

  /**
   * GET /cloudinary/optimized
   * Returns a Cloudinary-optimized CDN URL for the authenticated user's picture.
   */
  async getOptimizedUrl(): Promise<OptimizedPictureResponse> {
    return this.get<OptimizedPictureResponse>(
      `${this.base}/cloudinary/optimized`,
    );
  }

  /**
   * GET /cloudinary/me
   * Returns the raw CDN URL and metadata for the authenticated user's picture.
   */
  async getMyCloudinaryPicture(): Promise<IFile> {
    return this.get<IFile>(`${this.base}/cloudinary/me`);
  }

  /**
   * DELETE /cloudinary/me
   * Deletes the picture from Cloudinary, removes the MongoDB record, and
   * unlinks the profilePictureId from the profile document.
   */
  async deleteMyCloudinaryPicture(): Promise<IFile> {
    return this.delete<IFile>(`${this.base}/cloudinary/me`);
  }

  /**
   * GET /cloudinary/:userId
   * Returns the public Cloudinary picture for any user by their userId.
   */
  async getPublicCloudinaryPicture(userId: string): Promise<IFile> {
    return this.get<IFile>(`${this.base}/cloudinary/${userId}`);
  }

  // ── MongoDB ────────────────────────────────────────────────────────────────

  /**
   * GET /me
   * Returns the authenticated user's active profile picture MongoDB record.
   */
  async getMyRecord(): Promise<IFile> {
    return this.get<IFile>(`${this.base}/me`);
  }

  /**
   * GET /history
   * Returns all profile picture records (active + archived) for the user.
   */
  async getHistory(): Promise<ProfilePictureHistoryResponse> {
    return this.get<ProfilePictureHistoryResponse>(`${this.base}/history`);
  }

  /**
   * GET /stats
   * Returns upload counts and storage usage for the authenticated user.
   */
  async getStats(): Promise<ProfilePictureStatsResponse> {
    return this.get<ProfilePictureStatsResponse>(`${this.base}/stats`);
  }

  /**
   * PATCH /metadata
   * Updates arbitrary metadata on the active profile picture record.
   */
  async updateMetadata(body: UpdateFileMetadataBody): Promise<IFile> {
    return this.patch<IFile>(`${this.base}/metadata`, body);
  }

  /**
   * POST /archive
   * Marks the active profile picture as archived without deleting it.
   */
  async archive(): Promise<IFile> {
    return this.post<IFile>(`${this.base}/archive`);
  }

  /**
   * POST /restore/:fileId
   * Restores a previously archived profile picture by its file ID.
   */
  async restore(fileId: string): Promise<IFile> {
    return this.post<IFile>(`${this.base}/restore/${fileId}`);
  }

  /**
   * DELETE /me
   * Deletes only the MongoDB record (does not touch Cloudinary).
   */
  async deleteMyRecord(): Promise<IFile> {
    return this.delete<IFile>(`${this.base}/me`);
  }

  /**
   * DELETE /cleanup
   * Permanently removes all archived profile picture records for the user.
   */
  async cleanupArchived(): Promise<{ deletedCount: number }> {
    return this.delete<{ deletedCount: number }>(`${this.base}/cleanup`);
  }

  /**
   * GET /:userId
   * Returns the public MongoDB picture record for any user by their userId.
   */
  async getPublicRecord(userId: string): Promise<IFile> {
    return this.get<IFile>(`${this.base}/${userId}`);
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const profilePictureAPI = new ProfilePictureAPIClient();
