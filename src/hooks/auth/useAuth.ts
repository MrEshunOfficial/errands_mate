// hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import {
  User,
  LoginData,
  SignupData,
  VerifyEmailData,
  ResendVerificationData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  RestoreAccountData,
  AuthResponse,
  VerifyUserResponse,
} from "@/types/user.types";
import { authAPI } from "@/lib/api/auth/auth.api";
import { APIError } from "@/lib/api/base/api-client";

// ─── State & Actions ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // isLoading is ONLY true during the initial bootstrap getCurrentUser() call.
  // Subsequent action calls (login, logout, etc.) manage their own loading state
  // internally via the shared handleAuthAction wrapper and do NOT set this flag,
  // so the header never re-enters a loading spinner after initial mount.
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginData) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  resendVerification: (data: ResendVerificationData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  // Soft-delete — enters the grace-period deletion pipeline.
  deleteAccount: () => Promise<void>;
  // Hard-delete — bypasses the grace period entirely (irreversible).
  permanentlyDeleteAccount: () => Promise<void>;
  restoreAccount: (data: RestoreAccountData) => Promise<void>;
  refreshToken: () => Promise<void>;
  // Token validation for external services — returns lightweight payload.
  verifyUser: () => Promise<VerifyUserResponse | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // true until bootstrap completes
    error: null,
  });

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Shared Action Wrapper ───────────────────────────────────────────────────
  // NOTE: This wrapper intentionally does NOT touch isLoading. Actions that
  // need their own loading indicator should manage it at the call site.
  // Keeping isLoading as a bootstrap-only flag prevents the header from
  // flashing the spinner every time the user logs in/out.

  const handleAuthAction = useCallback(
    async (
      action: () => Promise<AuthResponse>,
      onSuccess?: (response: AuthResponse) => void,
    ) => {
      try {
        updateState({ error: null });
        const response = await action();

        if (response.token) {
          localStorage.setItem("authToken", response.token);
          const secure = location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `authToken=${response.token}; path=/; SameSite=Lax${secure}`;
        }

        if (response.user) {
          updateState({
            user: response.user,
            isAuthenticated: true,
          });
        }

        onSuccess?.(response);
      } catch (error) {
        const apiError = error as APIError;
        const errorMessage = apiError.message ?? "An unexpected error occurred";

        updateState({
          error: errorMessage,
          ...(apiError.status === 401
            ? { user: null, isAuthenticated: false }
            : {}),
        });

        throw error;
      }
    },
    [updateState],
  );

  // ── Authentication ──────────────────────────────────────────────────────────

  const login = useCallback(
    (credentials: LoginData) =>
      handleAuthAction(() => authAPI.login(credentials)),
    [handleAuthAction],
  );

  const signup = useCallback(
    (userData: SignupData) => handleAuthAction(() => authAPI.signup(userData)),
    [handleAuthAction],
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("authToken");
      document.cookie = "authToken=; path=/; max-age=0; SameSite=Lax";
      updateState({ user: null, isAuthenticated: false, error: null });
    }
  }, [updateState]);

  const refreshUser = useCallback(
    () => handleAuthAction(() => authAPI.getCurrentUser()),
    [handleAuthAction],
  );

  // ── Email Verification ──────────────────────────────────────────────────────

  const verifyEmail = useCallback(
    (data: VerifyEmailData) =>
      handleAuthAction(() => authAPI.verifyEmail(data)),
    [handleAuthAction],
  );

  const resendVerification = useCallback(
    (data: ResendVerificationData) =>
      handleAuthAction(() => authAPI.resendVerification(data)),
    [handleAuthAction],
  );

  // ── Password Management ─────────────────────────────────────────────────────

  const forgotPassword = useCallback(
    (data: ForgotPasswordData) =>
      handleAuthAction(() => authAPI.forgotPassword(data)),
    [handleAuthAction],
  );

  const resetPassword = useCallback(
    (data: ResetPasswordData) =>
      handleAuthAction(() => authAPI.resetPassword(data)),
    [handleAuthAction],
  );

  const changePassword = useCallback(
    (data: ChangePasswordData) =>
      handleAuthAction(() => authAPI.changePassword(data)),
    [handleAuthAction],
  );

  // ── Token Management ────────────────────────────────────────────────────────

  const refreshToken = useCallback(
    () => handleAuthAction(() => authAPI.refreshToken()),
    [handleAuthAction],
  );

  // ── Token Validation ────────────────────────────────────────────────────────

  const verifyUser =
    useCallback(async (): Promise<VerifyUserResponse | null> => {
      try {
        updateState({ error: null });
        const response = await authAPI.verifyUser();
        return response;
      } catch (error) {
        const apiError = error as APIError;
        updateState({
          error: apiError.message ?? "Token verification failed",
          ...(apiError.status === 401
            ? { user: null, isAuthenticated: false }
            : {}),
        });
        return null;
      }
    }, [updateState]);

  // ── Account Management ──────────────────────────────────────────────────────

  const deleteAccount = useCallback(
    () =>
      handleAuthAction(
        () => authAPI.deleteAccount(),
        () => updateState({ user: null, isAuthenticated: false }),
      ),
    [handleAuthAction, updateState],
  );

  const permanentlyDeleteAccount = useCallback(
    () =>
      handleAuthAction(
        () => authAPI.permanentlyDeleteAccount(),
        () => updateState({ user: null, isAuthenticated: false }),
      ),
    [handleAuthAction, updateState],
  );

  const restoreAccount = useCallback(
    (data: RestoreAccountData) =>
      handleAuthAction(
        () => authAPI.restoreAccount(data),
        () => updateState({ user: null, isAuthenticated: false }),
      ),
    [handleAuthAction, updateState],
  );

  const clearError = useCallback(
    () => updateState({ error: null }),
    [updateState],
  );

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  // Runs once on mount. Sets isLoading=true (initial state) → resolves auth
  // from the server → sets isLoading=false. This is the ONLY place isLoading
  // is toggled; all other actions leave it alone.

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const response = await authAPI.getCurrentUser();

        if (!mounted) return;

        if (response.user) {
          updateState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          updateState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        if (!mounted) return;

        const apiError = error as APIError;
        console.warn("Auth initialization failed:", error);

        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: apiError.status !== 401 ? (apiError.message ?? null) : null,
        });
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, [updateState]);

  return {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    deleteAccount,
    permanentlyDeleteAccount,
    restoreAccount,
    refreshToken,
    verifyUser,
  };
};
