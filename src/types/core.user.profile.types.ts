import {
  BaseEntity,
  SoftDeletable,
  UserRole,
  ContactDetails,
  IdDetails,
} from "./base.types";

// ─── Populated Profile Picture ────────────────────────────────────────────────

export interface PopulatedProfilePicture {
  _id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
}

/** Type guard — true when profilePictureId has been populated by the API. */
export function isPopulatedPicture(
  v: string | PopulatedProfilePicture | undefined | null,
): v is PopulatedProfilePicture {
  return !!v && typeof (v as PopulatedProfilePicture).url === "string";
}

export interface DomainProfile extends BaseEntity, SoftDeletable {
  userId: string;
  profileId: string;
  role: UserRole;
  isActive: boolean;
  activatedAt?: string;
  deactivatedAt?: string;
}

// ─── Base Profile ─────────────────────────────────────────────────────────────

export interface IUserProfile extends BaseEntity, SoftDeletable {
  userId: string;
  role: UserRole;
  contactInfo?: ContactDetails;
  /**
   * Stored as an ID reference, but the API always populates this field
   * into a {@link PopulatedProfilePicture} object on read. Use
   * {@link isPopulatedPicture} to narrow the type before accessing `.url`.
   */
  profilePictureId?: string | PopulatedProfilePicture;
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
