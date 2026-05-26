// types/files/files.types.ts
//
// Frontend-adapted counterparts of the backend file types.
// All mongoose ObjectId fields are serialised to plain strings over HTTP.

// ─── Enums ─────────────────────────────────────────────────────────────────────

export enum FileEntityType {
  PROFILE_PICTURE = "profile_picture",
  CATEGORY_COVER = "category_cover",
  SERVICE_COVER = "service_cover",
  ID_IMAGE = "id_image",
  PROVIDER_GALLERY_IMAGE = "provider_gallery_image",
  TASK_ATTACHMENT = "task_attachment",
  TASK_COMPLETION_PROOF_ATTACHMENT = "task_completion_proof_attachment",
}

export type FileStatus = "active" | "archived";

// ─── Core File Record ──────────────────────────────────────────────────────────

export interface IFile {
  _id: string;
  uploaderId?: string;
  isPrivate: boolean;
  url: string;
  fileName: string;
  thumbnailUrl?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
  entityType?: FileEntityType;
  entityId?: string;
  status: FileStatus;
  lastAccessedAt?: string; // ISO date string
  uploadedAt: string; // ISO date string
  deletedAt?: string; // ISO date string
}

// ─── Profile Picture Response Shapes ──────────────────────────────────────────

export interface UploadProfilePictureResponse {
  file: IFile;
  /** Updated profilePictureId field from the linked profile document */
  profilePictureId: string;
}

export interface OptimizedPictureResponse {
  url: string;
  /** Cloudinary transformation parameters applied */
  transformations?: Record<string, unknown>;
}

export interface ProfilePictureStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}

export interface ProfilePictureHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

// ─── ID Image Response Shapes ──────────────────────────────────────────────────

export interface UploadIdImageResponse {
  file: IFile;
}

export interface UploadMultipleIdImagesResponse {
  files: IFile[];
  count: number;
}

export interface IdImageListResponse {
  files: IFile[];
  count: number;
}

export interface IdImageStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}

export interface IdImageHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

// ─── Shared Request Bodies ─────────────────────────────────────────────────────

export interface UpdateFileMetadataBody {
  metadata: Record<string, unknown>;
}

// ─── Shared Cover Response Shapes ─────────────────────────────────────────────

/**
 * Returned by orphan-upload routes (/cover/cloudinary/new).
 * The caller must persist `fileId` to the entity document separately.
 */
export interface UploadOrphanCoverResponse {
  file: IFile;
  fileId: string;
}

export interface OptimizedCoverResponse {
  url: string;
  transformations?: Record<string, unknown>;
}

export interface PublicCoverResponse {
  url: string;
  file?: IFile;
}

export interface CoverHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

export interface CoverStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}

// ─── Shared Action Response Shapes ────────────────────────────────────────────

export interface ArchiveResponse {
  success: boolean;
  message: string;
  file?: IFile;
}

export interface CleanupResponse {
  success: boolean;
  message: string;
  deletedCount?: number;
}

export interface MutationResponse {
  success: boolean;
  message: string;
}

// ─── Task Attachment Response Shapes ──────────────────────────────────────────

export interface UploadAttachmentResponse {
  file: IFile;
}

export interface UploadMultipleAttachmentsResponse {
  files: IFile[];
  count: number;
}

export interface AttachmentListResponse {
  files: IFile[];
  count: number;
}

export interface AttachmentHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

export interface AttachmentStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}

// ─── Provider Gallery Response Shapes ─────────────────────────────────────────

export interface UploadProviderGalleryImageResponse {
  file: IFile;
}

export interface UploadMultipleProviderGalleryImagesResponse {
  files: IFile[];
  count: number;
}

/** Public-facing gallery list — only active images */
export interface PublicProviderGalleryResponse {
  files: IFile[];
  count: number;
}

/**
 * Full gallery record including all statuses.
 * Used by both the public record route and the auth-gated one.
 */
export interface ProviderGalleryRecordResponse {
  files: IFile[];
  count: number;
}

export interface ProviderGalleryHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

export interface ProviderGalleryStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}

export interface OptimizedProviderGalleryImageResponse {
  url: string;
  transformations?: Record<string, unknown>;
}

// ─── Task Completion Proof Response Shapes ────────────────────────────────────

export interface UploadTaskCompletionProofResponse {
  file: IFile;
}

export interface UploadMultipleTaskCompletionProofsResponse {
  files: IFile[];
  count: number;
}

/** All active proof files for a single completion attempt */
export interface TaskCompletionProofListResponse {
  files: IFile[];
  count: number;
}

export interface TaskCompletionProofHistoryResponse {
  success: boolean;
  message: string;
  history: IFile[];
}

export interface TaskCompletionProofStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalUploads: number;
    activeCount: number;
    archivedCount: number;
    totalSizeBytes: number;
  };
}
