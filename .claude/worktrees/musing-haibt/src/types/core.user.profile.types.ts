import { Types } from "mongoose";
import {
  BaseEntity,
  SoftDeletable,
  UserRole,
  ContactDetails,
  IdDetails,
} from "./base.types";

// ─── Populated Profile Picture ────────────────────────────────────────────────
// The API populates profilePictureId from an ObjectId reference into this
// full object. Use isPopulatedPicture() to narrow the union at runtime.

export interface PopulatedProfilePicture {
  _id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
}

/** Type guard — true when profilePictureId has been populated by the API. */
export function isPopulatedPicture(
  v: Types.ObjectId | PopulatedProfilePicture | undefined | null,
): v is PopulatedProfilePicture {
  return !!v && typeof (v as PopulatedProfilePicture).url === "string";
}

export interface DomainProfile extends BaseEntity, SoftDeletable {
  userId: Types.ObjectId;
  profileId: Types.ObjectId;
  role: UserRole;
  isActive: boolean;
  activatedAt?: Date;
  deactivatedAt?: Date;
}

// ─── Base Profile ─────────────────────────────────────────────────────────────
export interface IUserProfile extends BaseEntity, SoftDeletable {
  userId: Types.ObjectId;
  role: UserRole;
  contactInfo?: ContactDetails;
  /**
   * Stored as an ObjectId reference, but the API always populates this field
   * into a {@link PopulatedProfilePicture} object on read. Use
   * {@link isPopulatedPicture} to narrow the type before accessing `.url`.
   */
  profilePictureId?: Types.ObjectId | PopulatedProfilePicture;
  idDetails?: IdDetails;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────
export type CreateProfileRequestBody = Omit<
  IUserProfile,
  | "_id"
  | "userId"
  | "createdAt"
  | "updatedAt"
  | "isDeleted"
  | "deletedAt"
  | "deletedBy"
>;

export type UpdateProfileRequestBody = Partial<
  Omit<
    IUserProfile,
    | "_id"
    | "userId"
    | "role"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
    | "deletedAt"
    | "deletedBy"
  >
>;

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ProfileResponse {
  success: boolean;
  message: string;
  profile?: Partial<IUserProfile>;
  error?: string;
}

export interface CompleteProfileResponse {
  profile: Partial<IUserProfile> | null;
  profilePicture?: {
    url: string;
    thumbnailUrl?: string;
    uploadedAt: string;
  };
}
