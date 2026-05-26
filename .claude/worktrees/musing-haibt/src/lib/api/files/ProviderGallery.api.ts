// api/files/providerGallery.api.ts
//
// API client for provider gallery file operations.
// Mount point: /api/providers
//
// Public routes  → getPublicGallery, getGalleryRecord, getPublicGalleryRecord,
//                  getOptimizedGalleryImage
// Auth routes    → everything else

import {
  UploadProviderGalleryImageResponse,
  UploadMultipleProviderGalleryImagesResponse,
  OptimizedProviderGalleryImageResponse,
  PublicProviderGalleryResponse,
  MutationResponse,
  ProviderGalleryRecordResponse,
  ProviderGalleryHistoryResponse,
  ProviderGalleryStatsResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CleanupResponse,
} from "@/types/files.types";
import { APIClient } from "../base/api-client";

class ProviderGalleryAPI extends APIClient {
  private readonly base = "/api/provider-gallery";

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
   * Upload a single gallery image.
   * Appends the resulting file to the provider's `businessGalleryImages[]`.
   */
  async uploadGalleryImage(
    file: File,
  ): Promise<UploadProviderGalleryImageResponse> {
    const fd = new FormData();
    fd.append("file", file);
    return this.postFormData<UploadProviderGalleryImageResponse>(
      `${this.base}/gallery/cloudinary/new`,
      fd,
    );
  }

  /**
   * Upload up to 10 gallery images in one request.
   * All files are appended to the provider's `businessGalleryImages[]`.
   */
  async uploadMultipleGalleryImages(
    files: File[],
  ): Promise<UploadMultipleProviderGalleryImagesResponse> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return this.postFormData<UploadMultipleProviderGalleryImagesResponse>(
      `${this.base}/gallery/cloudinary/batch`,
      fd,
    );
  }

  // ─── Cloudinary — reads (public) ───────────────────────────────────────────

  /**
   * Returns an optimised Cloudinary URL for a single gallery image.
   * Public — no auth required.
   */
  async getOptimizedGalleryImage(
    providerId: string,
    fileId: string,
  ): Promise<OptimizedProviderGalleryImageResponse> {
    return this.get<OptimizedProviderGalleryImageResponse>(
      `${this.base}/${providerId}/gallery/cloudinary/${fileId}/optimized`,
    );
  }

  /**
   * Returns all active gallery images for a provider.
   * Public — no auth required.
   */
  async getPublicGallery(
    providerId: string,
  ): Promise<PublicProviderGalleryResponse> {
    return this.get<PublicProviderGalleryResponse>(
      `${this.base}/${providerId}/gallery/cloudinary`,
    );
  }

  // ─── Cloudinary — delete (auth) ────────────────────────────────────────────

  /**
   * Deletes a gallery image from Cloudinary + MongoDB and pulls it from
   * the provider's `businessGalleryImages[]`.
   */
  async deleteGalleryImageFromCloudinary(
    providerId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.delete<MutationResponse>(
      `${this.base}/${providerId}/gallery/cloudinary/${fileId}`,
    );
  }

  // ─── MongoDB — reads ───────────────────────────────────────────────────────

  /**
   * Returns the full gallery record (all statuses).
   * Public — no auth required.
   */
  async getGalleryRecord(
    providerId: string,
  ): Promise<ProviderGalleryRecordResponse> {
    return this.get<ProviderGalleryRecordResponse>(
      `${this.base}/${providerId}/gallery/record`,
    );
  }

  /**
   * Returns the public-facing gallery record (active images only).
   * Public — no auth required.
   */
  async getPublicGalleryRecord(
    providerId: string,
  ): Promise<ProviderGalleryRecordResponse> {
    return this.get<ProviderGalleryRecordResponse>(
      `${this.base}/${providerId}/gallery/record/public`,
    );
  }

  /** Auth-gated full upload history for a provider's gallery. */
  async getGalleryHistory(
    providerId: string,
  ): Promise<ProviderGalleryHistoryResponse> {
    return this.get<ProviderGalleryHistoryResponse>(
      `${this.base}/${providerId}/gallery/history`,
    );
  }

  /** Auth-gated storage + usage stats for a provider's gallery. */
  async getGalleryStats(
    providerId: string,
  ): Promise<ProviderGalleryStatsResponse> {
    return this.get<ProviderGalleryStatsResponse>(
      `${this.base}/${providerId}/gallery/stats`,
    );
  }

  // ─── MongoDB — mutations (auth) ────────────────────────────────────────────

  /** Update arbitrary metadata on a gallery image. */
  async updateGalleryImageMetadata(
    providerId: string,
    fileId: string,
    metadata: UpdateFileMetadataBody["metadata"],
  ): Promise<MutationResponse> {
    return this.patch<MutationResponse>(
      `${this.base}/${providerId}/gallery/${fileId}/metadata`,
      { metadata } satisfies UpdateFileMetadataBody,
    );
  }

  /** Soft-archive a gallery image (marks it inactive without deleting). */
  async archiveGalleryImage(
    providerId: string,
    fileId: string,
  ): Promise<ArchiveResponse> {
    return this.post<ArchiveResponse>(
      `${this.base}/${providerId}/gallery/${fileId}/archive`,
    );
  }

  /** Restore a previously archived gallery image to active status. */
  async restoreGalleryImage(
    providerId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.post<MutationResponse>(
      `${this.base}/${providerId}/gallery/restore/${fileId}`,
    );
  }

  /**
   * Hard-delete a gallery image from the database only.
   * Use `deleteGalleryImageFromCloudinary` to also remove the asset from Cloudinary.
   */
  async deleteGalleryImage(
    providerId: string,
    fileId: string,
  ): Promise<MutationResponse> {
    return this.delete<MutationResponse>(
      `${this.base}/${providerId}/gallery/${fileId}`,
    );
  }

  /** Permanently remove all archived gallery images for a provider. */
  async cleanupArchivedGallery(providerId: string): Promise<CleanupResponse> {
    return this.delete<CleanupResponse>(
      `${this.base}/${providerId}/gallery/cleanup`,
    );
  }
}

export const providerGalleryAPI = new ProviderGalleryAPI();
