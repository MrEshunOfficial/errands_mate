// api/profiles/profile.api.ts

import { UserRole } from "@/types/base.types";

import { APIClient } from "../base/api-client";
import {
  IUserProfile,
  CreateProfileRequestBody,
  UpdateProfileRequestBody,
  CompleteProfileResponse,
} from "@/types/core.user.profile.types";

// ─── Supplementary Response Types ─────────────────────────────────────────────

export interface ProfileStatsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalProfiles: number;
    activeProfiles: number;
    deletedProfiles: number;
    roleBreakdown: Record<UserRole, number>;
  };
}

export interface ProfileExistsResponse {
  success: boolean;
  exists: boolean;
  message?: string;
}

export interface ProfileListResponse {
  success: boolean;
  message: string;
  profiles: Partial<IUserProfile>[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface BatchProfilesBody {
  userIds: string[];
}

// ─── Id-Details ────────────────────────────────────────────────────────────────
// Only providers can call PATCH /me/id-details, so we keep the body narrow.
// IdDetails is imported from base.types; ObjectId fields are serialised as strings
// over the wire.

export type UpdateIdDetailsRequestBody = {
  ghana_card_number?: string;
  ghana_card_image?: string[]; // serialised ObjectId strings
};

// ─── Profile API Client ────────────────────────────────────────────────────────
//
// NOTE: APIClient.makeRequest() automatically unwraps { success, message, data }
// envelope responses — it returns `responseData.data` directly. Therefore all
// methods that previously returned `ProfileResponse` (a wrapper type) now return
// the unwrapped `Partial<IUserProfile>` that actually comes back at runtime.

export class ProfileAPIClient extends APIClient {
  private readonly base = "/api/user-profiles";

  // ── Existence Check ────────────────────────────────────────────────────────

  async checkProfileExists(): Promise<ProfileExistsResponse> {
    return this.get<ProfileExistsResponse>(`${this.base}/exists`);
  }

  // ── Current User ───────────────────────────────────────────────────────────

  async getMyProfile(): Promise<Partial<IUserProfile>> {
    return this.get<Partial<IUserProfile>>(`${this.base}/me`);
  }

  async getCompleteProfile(): Promise<CompleteProfileResponse> {
    return this.get<CompleteProfileResponse>(`${this.base}/me/complete`);
  }

  async getMyProfileStats(): Promise<ProfileStatsResponse> {
    return this.get<ProfileStatsResponse>(`${this.base}/me/stats`);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async createProfile(
    body: CreateProfileRequestBody,
  ): Promise<Partial<IUserProfile>> {
    return this.post<Partial<IUserProfile>>(`${this.base}/`, body);
  }

  async updateMyProfile(
    body: UpdateProfileRequestBody,
  ): Promise<Partial<IUserProfile>> {
    return this.patch<Partial<IUserProfile>>(`${this.base}/me`, body);
  }

  /** Provider-only. Updates Ghana card number and/or uploaded card images. */
  async updateMyIdDetails(
    body: UpdateIdDetailsRequestBody,
  ): Promise<Partial<IUserProfile>> {
    return this.patch<Partial<IUserProfile>>(
      `${this.base}/me/id-details`,
      body,
    );
  }

  async deleteMyProfile(): Promise<Partial<IUserProfile>> {
    return this.delete<Partial<IUserProfile>>(`${this.base}/me`);
  }

  async restoreMyProfile(): Promise<Partial<IUserProfile>> {
    return this.post<Partial<IUserProfile>>(`${this.base}/me/restore`);
  }

  // ── Discovery ──────────────────────────────────────────────────────────────

  async searchProfiles(query: string): Promise<ProfileListResponse> {
    return this.get<ProfileListResponse>(`${this.base}/search`, { q: query });
  }

  async getProfilesByUserIds(userIds: string[]): Promise<ProfileListResponse> {
    return this.post<ProfileListResponse>(`${this.base}/batch`, {
      userIds,
    } satisfies BatchProfilesBody);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getAllProfiles(
    page?: number,
    limit?: number,
  ): Promise<ProfileListResponse> {
    return this.get<ProfileListResponse>(this.base, { page, limit });
  }

  async getProfileByUserId(userId: string): Promise<Partial<IUserProfile>> {
    return this.get<Partial<IUserProfile>>(`${this.base}/user/${userId}`);
  }

  async getProfileById(profileId: string): Promise<Partial<IUserProfile>> {
    return this.get<Partial<IUserProfile>>(`${this.base}/${profileId}`);
  }

  async updateProfileById(
    profileId: string,
    body: UpdateProfileRequestBody,
  ): Promise<Partial<IUserProfile>> {
    return this.patch<Partial<IUserProfile>>(`${this.base}/${profileId}`, body);
  }

  async permanentlyDeleteProfile(
    userId: string,
  ): Promise<Partial<IUserProfile>> {
    return this.delete<Partial<IUserProfile>>(
      `${this.base}/${userId}/permanent`,
    );
  }

  async bulkUpdateProfiles(
    updates: Array<{ profileId: string } & UpdateProfileRequestBody>,
  ): Promise<ProfileListResponse> {
    return this.patch<ProfileListResponse>(`${this.base}/bulk`, { updates });
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const profileAPI = new ProfileAPIClient();
