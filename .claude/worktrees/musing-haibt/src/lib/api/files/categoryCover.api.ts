import {
  UploadOrphanCoverResponse,
  OptimizedCoverResponse,
  PublicCoverResponse,
  MutationResponse,
  IFile,
  CoverHistoryResponse,
  UpdateFileMetadataBody,
  ArchiveResponse,
  CoverStatsResponse,
  CleanupResponse,
} from "@/types/files.types";
import { APIClient } from "../base/api-client";

export class CategoryCoverAPI extends APIClient {
  private readonly base = "/api/categories-cover";

  /**
   * Multipart upload helper — intentionally omits Content-Type so the
   * browser can set the correct multipart/form-data boundary itself.
   */
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

  /** Orphan upload — category may not exist yet. Returns fileId + URL to persist later. */
  uploadCover(file: File): Promise<UploadOrphanCoverResponse> {
    const fd = new FormData();
    fd.append("file", file);
    return this.postFile(`${this.base}/cover/cloudinary/new`, fd);
  }

  /**
   * Link an already-uploaded orphan file to an existing category.
   *
   * This is the correct way to associate a cover with a category after an
   * orphan upload. It calls `linkFileToCreatedEntity` on the backend which:
   *   1. Stamps `entityId` on the IFile record (so getFilesByEntity works)
   *   2. Archives + unlinks any previous active cover for this category
   *   3. Sets `catCoverId` on the category document
   *
   * Never use a raw category PATCH for this — it bypasses the file service
   * and leaves the IFile record with entityId: undefined, breaking all
   * subsequent file-service lookups (history, stats, cover replacement).
   */
  linkCover(
    categoryId: string,
    fileId: string,
  ): Promise<UploadOrphanCoverResponse> {
    return this.post(`${this.base}/${categoryId}/cover/link`, { fileId });
  }

  getOptimizedCover(categoryId: string): Promise<OptimizedCoverResponse> {
    return this.get(`${this.base}/${categoryId}/cover/cloudinary/optimized`);
  }

  /** Public — no auth required. */
  getPublicCover(categoryId: string): Promise<PublicCoverResponse> {
    return this.get(`${this.base}/${categoryId}/cover/cloudinary`);
  }

  deleteCloudinaryCover(categoryId: string): Promise<MutationResponse> {
    return this.delete(`${this.base}/${categoryId}/cover/cloudinary`);
  }

  // ── MongoDB ─────────────────────────────────────────────────────────────────

  getCoverRecord(categoryId: string): Promise<IFile> {
    return this.get(`${this.base}/${categoryId}/cover/record`);
  }

  /** Public — no auth required. */
  getPublicCoverRecord(categoryId: string): Promise<IFile> {
    return this.get(`${this.base}/${categoryId}/cover/record/public`);
  }

  getCoverHistory(categoryId: string): Promise<CoverHistoryResponse> {
    return this.get(`${this.base}/${categoryId}/cover/history`);
  }

  updateCoverMetadata(
    categoryId: string,
    body: UpdateFileMetadataBody,
  ): Promise<IFile> {
    return this.patch(`${this.base}/${categoryId}/cover/metadata`, body);
  }

  archiveCover(categoryId: string): Promise<ArchiveResponse> {
    return this.post(`${this.base}/${categoryId}/cover/archive`);
  }

  restoreCover(categoryId: string, fileId: string): Promise<IFile> {
    return this.post(`${this.base}/${categoryId}/cover/restore/${fileId}`);
  }

  /** Deletes the DB record (not the Cloudinary asset). */
  deleteCoverRecord(categoryId: string): Promise<MutationResponse> {
    return this.delete(`${this.base}/${categoryId}/cover`);
  }

  getCoverStats(categoryId: string): Promise<CoverStatsResponse> {
    return this.get(`${this.base}/${categoryId}/cover/stats`);
  }

  cleanupArchivedCovers(categoryId: string): Promise<CleanupResponse> {
    return this.delete(`${this.base}/${categoryId}/cover/cleanup`);
  }
}

export const categoryCoverAPI = new CategoryCoverAPI();
