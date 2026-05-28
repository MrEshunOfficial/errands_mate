// ─── Core Entity Shapes ────────────────────────────────────────────────────────

export interface BaseEntity {
  _id: string;
  id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeletable {
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// ─── Actor ────────────────────────────────────────────────────────────────────

export enum ActorRole {
  CUSTOMER = "customer",
  PROVIDER = "provider",
  ADMIN = "admin",
  SYSTEM = "system",
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export interface SocialMediaHandle {
  nameOfSocial: string;
  userName: string;
  profileUrl?: string;
}

export interface ContactDetails {
  mainContact: string;
  additionalContact?: string;
  businessEmail?: string;
  socialMediaHandles?: SocialMediaHandle[];
}

export interface IdDetails {
  ghana_card_number: string;
  ghana_card_image: string[];
}

// ─── Auth & Roles ─────────────────────────────────────────────────────────────

export enum UserRole {
  CUSTOMER = "customer",
  PROVIDER = "service_provider",
}

export enum SystemRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum AuthProvider {
  CREDENTIALS = "credentials",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

// ─── Service Lifecycle ────────────────────────────────────────────────────────

export enum ServiceStatus {
  PENDING_APPROVAL = "pending-approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum PopulationLevel {
  NONE = "none",
  MINIMAL = "minimal",
  STANDARD = "standard",
  DETAILED = "detailed",
}
