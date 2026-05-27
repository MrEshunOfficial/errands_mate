import { useState } from "react";
import type { AuthResponse } from "@/types/user.types";
import { APIError } from "@/lib/api/base/api-client";
import {
  GoogleAuthData,
  AppleAuthData,
  LinkProviderData,
  oAuthAPI,
} from "@/lib/api/auth/oauth.api";
import { saveAuthToken } from "@/lib/auth/token";

// ─── Return Type ──────────────────────────────────────────────────────────────

interface UseOAuthReturn {
  isLoading: boolean;
  error: string | null;
  googleAuth: (data: GoogleAuthData) => Promise<AuthResponse | null>;
  appleAuth: (data: AppleAuthData) => Promise<AuthResponse | null>;
  linkProvider: (data: LinkProviderData) => Promise<AuthResponse | null>;
  clearError: () => void;
  resetState: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOAuth = (): UseOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Shared Action Wrapper ───────────────────────────────────────────────────

  const handleOAuthAction = async (
    action: () => Promise<AuthResponse>,
    fallbackMessage: string,
  ): Promise<AuthResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await action();
      if (response?.token) {
        saveAuthToken(response.token);
      }
      return response;
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError.message ?? fallbackMessage);
      console.error(fallbackMessage, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auth Methods ────────────────────────────────────────────────────────────

  const googleAuth = (data: GoogleAuthData) =>
    handleOAuthAction(
      () => oAuthAPI.googleAuth(data),
      "Google authentication failed",
    );

  const appleAuth = (data: AppleAuthData) =>
    handleOAuthAction(
      () => oAuthAPI.appleAuth(data),
      "Apple authentication failed",
    );

  const linkProvider = (data: LinkProviderData) =>
    handleOAuthAction(
      () => oAuthAPI.linkProvider(data),
      "Failed to link provider account",
    );

  // ── Utilities ───────────────────────────────────────────────────────────────

  const clearError = () => setError(null);

  const resetState = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    isLoading,
    error,
    googleAuth,
    appleAuth,
    linkProvider,
    clearError,
    resetState,
  };
};
