import { AuthProvider, AuthResponse } from "@/types/user.types";
import { APIClient } from "../base/api-client";

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface GoogleAuthData {
  idToken: string;
}

export interface FacebookAuthData {
  accessToken: string;
}

export interface LinkProviderData {
  provider: AuthProvider.GOOGLE | AuthProvider.FACEBOOK;
  idToken: string;
}

export type OAuthRestoreAccountData =
  | { provider: "google"; idToken: string }
  | { provider: "facebook"; accessToken: string };

// ─── OAuth API ────────────────────────────────────────────────────────────────

export class OAuthAPI extends APIClient {
  private readonly endpoint = "/api/oauth";

  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/google`, data);
  }

  async facebookAuth(data: FacebookAuthData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/facebook`, data);
  }

  async linkProvider(data: LinkProviderData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/link-provider`, data);
  }

  async restoreOAuthAccount(data: OAuthRestoreAccountData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/restore-account`, data);
  }
}

export const oAuthAPI = new OAuthAPI();
