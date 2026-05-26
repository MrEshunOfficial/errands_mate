import { AuthProvider, AuthResponse } from "@/types/user.types";
import { APIClient } from "../base/api-client";

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface GoogleAuthData {
  idToken: string;
}

export interface AppleAuthData {
  idToken: string;
  user?: {
    name?: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface LinkProviderData {
  provider: AuthProvider.GOOGLE | AuthProvider.APPLE;
  idToken: string;
}

// ─── OAuth API ────────────────────────────────────────────────────────────────

export class OAuthAPI extends APIClient {
  private readonly endpoint = "/api/oauth";

  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/google`, data);
  }

  async appleAuth(data: AppleAuthData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/apple`, data);
  }

  async linkProvider(data: LinkProviderData): Promise<AuthResponse> {
    return this.post<AuthResponse>(`${this.endpoint}/link-provider`, data);
  }
}

export const oAuthAPI = new OAuthAPI();
