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

export class ServiceCoverAPI extends APIClient {
  private readonly base = "/api/services-cover";

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

  /** Orphan upload — service may not exist yet. Persist `fileId` to service after upload. */
  // ── Cloudinary ──────────────────────────────────────────────────────────────

  /** Orphan upload — service may not exist yet. Persist `fileId` to service after upload. */
  uploadCover(file: File): Promise<UploadOrphanCoverResponse> {
    const fd = new FormData();
    fd.append("file", file);
    return this.postFile(`${this.base}/cover/cloudinary/new`, fd);
  }

  /** Links an already-uploaded orphan cover to an existing service. */
  linkCover(
    serviceId: string,
    fileId: string,
  ): Promise<UploadOrphanCoverResponse> {
    return this.post(`${this.base}/${serviceId}/cover/link`, { fileId });
  }

  getOptimizedCover(serviceId: string): Promise<OptimizedCoverResponse> {
    return this.get(`${this.base}/${serviceId}/cover/cloudinary/optimized`);
  }

  /** Public — no auth required. */
  getPublicCover(serviceId: string): Promise<PublicCoverResponse> {
    return this.get(`${this.base}/${serviceId}/cover/cloudinary`);
  }

  deleteCloudinaryCover(serviceId: string): Promise<MutationResponse> {
    return this.delete(`${this.base}/${serviceId}/cover/cloudinary`);
  }

  // ── MongoDB ─────────────────────────────────────────────────────────────────

  getCoverRecord(serviceId: string): Promise<IFile> {
    return this.get(`${this.base}/${serviceId}/cover/record`);
  }

  /** Public — no auth required. */
  getPublicCoverRecord(serviceId: string): Promise<IFile> {
    return this.get(`${this.base}/${serviceId}/cover/record/public`);
  }

  getCoverHistory(serviceId: string): Promise<CoverHistoryResponse> {
    return this.get(`${this.base}/${serviceId}/cover/history`);
  }

  updateCoverMetadata(
    serviceId: string,
    body: UpdateFileMetadataBody,
  ): Promise<IFile> {
    return this.patch(`${this.base}/${serviceId}/cover/metadata`, body);
  }

  archiveCover(serviceId: string): Promise<ArchiveResponse> {
    return this.post(`${this.base}/${serviceId}/cover/archive`);
  }

  restoreCover(serviceId: string, fileId: string): Promise<IFile> {
    return this.post(`${this.base}/${serviceId}/cover/restore/${fileId}`);
  }

  deleteCoverRecord(serviceId: string): Promise<MutationResponse> {
    return this.delete(`${this.base}/${serviceId}/cover`);
  }

  getCoverStats(serviceId: string): Promise<CoverStatsResponse> {
    return this.get(`${this.base}/${serviceId}/cover/stats`);
  }

  cleanupArchivedCovers(serviceId: string): Promise<CleanupResponse> {
    return this.delete(`${this.base}/${serviceId}/cover/cleanup`);
  }
}

export const serviceCoverAPI = new ServiceCoverAPI();
