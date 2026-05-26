import {
  SignupData,
  AuthResponse,
  LoginData,
  VerifyEmailData,
  ResendVerificationData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  StatusResponse,
  RestoreAccountData,
  VerifyAccessResponse,
  VerifyUserResponse,
  GetUsersParams,
  PaginatedUsersResponse,
  UpdateUserRoleData,
  HealthCheckResponse,
} from "@/types/user.types";
import { APIClient } from "../base/api-client";

export class AuthAPI extends APIClient {
  private readonly endpoint = "/api/auth";

  // ── Authentication ──────────────────────────────────────────────────────────

  async signup(userData: SignupData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/signup`, userData);
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/login`, credentials);
  }

  async logout(): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/logout`);
  }

  // ── Email Verification ──────────────────────────────────────────────────────

  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/verify-email`, data);
  }

  async resendVerification(
    data: ResendVerificationData,
  ): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      `${this.endpoint}/resend-verification`,
      data,
    );
  }

  // ── Password Management ─────────────────────────────────────────────────────

  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/forgot-password`, data);
  }

  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/reset-password`, data);
  }

  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/change-password`, data);
  }

  // ── Token Management ────────────────────────────────────────────────────────

  async refreshToken(): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/refresh-token`);
  }

  // ── Current User ────────────────────────────────────────────────────────────

  async getCurrentUser(): Promise<AuthResponse> {
    return this.get<AuthResponse>(`${this.endpoint}/me`);
  }

  async getAuthStatus(): Promise<StatusResponse> {
    return this.get<StatusResponse>(`${this.endpoint}/status`);
  }

  /** Validates the current token for external services / micro-frontends. */
  async verifyUser(): Promise<VerifyUserResponse> {
    return this.get<VerifyUserResponse>(`${this.endpoint}/verify-user`);
  }

  // ── Account Management ──────────────────────────────────────────────────────

  /** Soft-delete — enters the grace-period deletion pipeline. */
  async deleteAccount(): Promise<AuthResponse> {
    return this.delete<AuthResponse>(`${this.endpoint}/account`);
  }

  /** Hard-delete — bypasses the grace period entirely (irreversible). */
  async permanentlyDeleteAccount(): Promise<AuthResponse> {
    return this.delete<AuthResponse>(`${this.endpoint}/account/permanent`);
  }

  async restoreAccount(data: RestoreAccountData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/restore-account`, data);
  }

  // ── Access Verification ─────────────────────────────────────────────────────

  async verifyEmailAccess(): Promise<VerifyAccessResponse> {
    return this.get<VerifyAccessResponse>(
      `${this.endpoint}/verify-access/verified`,
    );
  }

  async verifyAdminAccess(): Promise<VerifyAccessResponse> {
    return this.get<VerifyAccessResponse>(
      `${this.endpoint}/verify-access/admin`,
    );
  }

  async verifySuperAdminAccess(): Promise<VerifyAccessResponse> {
    return this.get<VerifyAccessResponse>(
      `${this.endpoint}/verify-access/super-admin`,
    );
  }

  // ── Admin — User Management ─────────────────────────────────────────────────

  async getAllUsers(params?: GetUsersParams): Promise<PaginatedUsersResponse> {
    return this.get<PaginatedUsersResponse>(
      `${this.endpoint}/admin/users`,
      params,
    );
  }

  /**
   * Fetch a single user by ID.
   * The backend includes soft-deleted accounts so admins can inspect
   * deleted users before deciding to restore or permanently remove.
   */
  async getUserById(userId: string): Promise<AuthResponse> {
    return this.get<AuthResponse>(`${this.endpoint}/admin/users/${userId}`);
  }

  // ── Super Admin — Privileged Operations ────────────────────────────────────

  async updateUserRole(
    userId: string,
    data: UpdateUserRoleData,
  ): Promise<AuthResponse> {
    return this.patch<AuthResponse>(
      `${this.endpoint}/admin/users/${userId}/role`,
      data,
    );
  }

  /** Soft-delete a user — they can be restored later. */
  async deleteUser(userId: string): Promise<AuthResponse> {
    return this.delete<AuthResponse>(`${this.endpoint}/admin/users/${userId}`);
  }

  async restoreUser(userId: string): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      `${this.endpoint}/admin/users/${userId}/restore`,
    );
  }

  /**
   * Permanently and irreversibly removes a user from the database.
   * Bypasses the soft-delete grace period — super-admin only.
   */
  async permanentlyDeleteUser(userId: string): Promise<AuthResponse> {
    return this.delete<AuthResponse>(
      `${this.endpoint}/admin/users/${userId}/permanent`,
    );
  }

  // ── Health Check ────────────────────────────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.get<HealthCheckResponse>(`${this.endpoint}/health`);
  }
}

export const authAPI = new AuthAPI();
