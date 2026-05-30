// ─── Auth Provider ────────────────────────────────────────────────────────────

export enum AuthProvider {
  CREDENTIALS = "credentials",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

// ─── System Role ──────────────────────────────────────────────────────────────

export enum SystemRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  isEmailVerified: boolean;
  // True when the admin has soft-deleted the account. The record still exists
  // in the database and can be restored via the admin restore endpoint.
  isDeleted: boolean;
  authProvider: AuthProvider;
  profileId: string | null;
  lastLogin: string | null;
  createdAt: string;
  deletedAt: string;
}

export const isAdmin = (user: User): boolean =>
  user.systemRole === SystemRole.ADMIN ||
  user.systemRole === SystemRole.SUPER_ADMIN;

export const isSuperAdmin = (user: User): boolean =>
  user.systemRole === SystemRole.SUPER_ADMIN;

// ─── Auth Responses ───────────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: Record<string, unknown> | null;
  hasProfile?: boolean;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  isAuthenticated: boolean;
  userId?: string;
  systemRole?: SystemRole;
}

export interface VerifyAccessResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  user?: {
    id: string;
    email: string;
    systemRole: SystemRole;
    systemAdminName?: string;
  };
}

// Shape returned by GET /verify-user — confirms token validity for external
// services / micro-frontends without returning the full user document.
export interface VerifyUserResponse {
  success: boolean;
  message: string;
  userId?: string;
  systemRole?: SystemRole;
  isEmailVerified?: boolean;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// ─── Paginated Users ──────────────────────────────────────────────────────────

export interface PaginatedUsersResponse {
  success: boolean;
  message: string;
  users?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

// ─── Account Deletion ─────────────────────────────────────────────────────────

// Lifecycle states for a user-initiated deletion event (grace-period pipeline).
// This is separate from the admin hard-delete (DELETE /admin/users/:id).
export type DeletionEventStatus =
  | "pending"
  | "grace_period"
  | "processing"
  | "completed"
  | "cancelled"
  | "failed";

export interface DeletionStatusResponse {
  success: boolean;
  message: string;
  status?: DeletionEventStatus;
  scheduledAt?: string;
  completedAt?: string;
  error?: string;
}

export interface DeletionReviewItem {
  eventId: string;
  userId: string;
  status: DeletionEventStatus;
  failedAt?: string;
  failureReason?: string;
  retryCount?: number;
}

export interface DeletionReviewQueueResponse {
  success: boolean;
  message: string;
  items?: DeletionReviewItem[];
  total?: number;
  error?: string;
}

export interface RetryDeletionResponse {
  success: boolean;
  message: string;
  eventId?: string;
  status?: DeletionEventStatus;
  error?: string;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface RestoreAccountData {
  email: string;
  password?: string;
}

export interface UpdateUserRoleData {
  systemRole: SystemRole;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}
