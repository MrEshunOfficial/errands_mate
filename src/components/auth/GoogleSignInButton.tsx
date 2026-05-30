import { useEffect, useState, useCallback, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { oAuthAPI } from "@/lib/api/auth/oauth.api";
import { APIError } from "@/lib/api/base/api-client";
import { saveAuthToken } from "@/lib/auth/token";
import { RestoreAccountModal } from "@/components/auth/RestoreAccountModal";

interface GoogleSignInProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const searchParams = useSearchParams();
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [restoreModal, setRestoreModal] = useState<{
    visible: boolean;
    deletedAt: string | null;
    idToken: string;
  }>({ visible: false, deletedAt: null, idToken: "" });
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setIsProcessing(true);
      setAuthError(null);

      try {
        const result = await oAuthAPI.googleAuth({ idToken: response.credential });
        if (result.token) {
          saveAuthToken(result.token);
          sessionStorage.removeItem("logged_out_at");
        }
        onSuccess?.();
        const destination = searchParams.get("redirect") || "/profile";
        window.location.href = destination;
      } catch (err) {
        const apiError = err as APIError;

        if (apiError.status === 423 && apiError.code === "ACCOUNT_PENDING_DELETION") {
          setRestoreModal({
            visible: true,
            deletedAt: apiError.deletedAt ?? null,
            idToken: response.credential,
          });
          return;
        }

        const errorMsg = apiError.message || "Google authentication failed. Please try again.";
        setAuthError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [onSuccess, onError, searchParams],
  );

  const handleGoogleResponseRef = useRef(handleGoogleResponse);
  handleGoogleResponseRef.current = handleGoogleResponse;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID not found in environment variables");
      return;
    }

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (r) => handleGoogleResponseRef.current(r),
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            width: 250,
          });

          setIsGoogleReady(true);
        } catch (error) {
          console.error("Failed to initialize Google Sign-In:", error);
        }
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google) {
          console.error("Google Sign-In SDK failed to load");
        }
      }, 10000);

      return () => {
        clearInterval(checkGoogle);
        clearTimeout(timeout);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleSignIn = () => {
    if (!isGoogleReady) return;
    setAuthError(null);
    const googleButton = googleButtonRef.current?.querySelector(
      "div[role='button']",
    ) as HTMLElement;
    if (googleButton) {
      googleButton.click();
    } else if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const handleGoogleRestore = async () => {
    setIsRestoring(true);
    setRestoreError(null);
    try {
      const result = await oAuthAPI.restoreOAuthAccount({
        provider: "google",
        idToken: restoreModal.idToken,
      });
      if (result.token) saveAuthToken(result.token);
      sessionStorage.removeItem("logged_out_at");
      toast.success("Account restored! Welcome back.");
      const destination = searchParams.get("redirect") || "/profile";
      window.location.href = destination;
    } catch (err) {
      const apiError = err as APIError;
      if (apiError.status === 400) {
        // Token likely expired — close modal and re-trigger Google sign-in
        setRestoreModal({ visible: false, deletedAt: null, idToken: "" });
        setAuthError("Session expired. Please sign in with Google again to restore your account.");
        if (window.google) window.google.accounts.id.prompt();
      } else if (apiError.status === 404) {
        setRestoreError("This account no longer exists.");
      } else {
        setRestoreError(apiError.message || "Failed to restore account. Please try again.");
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const closeRestoreModal = () => {
    if (isRestoring) return;
    setRestoreModal({ visible: false, deletedAt: null, idToken: "" });
    setRestoreError(null);
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
        Google Sign-In not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID
        to your environment variables.
      </div>
    );
  }

  return (
    <>
      <RestoreAccountModal
        open={restoreModal.visible}
        deletedAt={restoreModal.deletedAt}
        onRestore={handleGoogleRestore}
        onCancel={closeRestoreModal}
        isLoading={isRestoring}
        error={restoreError}
      />

      <div className="space-y-2">
        {/* Hidden Google button */}
        <div ref={googleButtonRef} className="hidden" />

        {/* Custom styled button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isProcessing || !isGoogleReady}
          variant="secondary"
          className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="h-5 w-5 lg:h-6 lg:w-6" />
          <span className="font-medium">
            {isProcessing
              ? "Connecting..."
              : !isGoogleReady
                ? "Loading..."
                : "Google"}
          </span>
        </Button>

        {authError && (
          <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            {authError}
          </div>
        )}
      </div>
    </>
  );
}
