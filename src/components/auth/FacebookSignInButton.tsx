"use client";

import { useEffect, useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { oAuthAPI } from "@/lib/api/auth/oauth.api";
import { APIError } from "@/lib/api/base/api-client";
import { saveAuthToken } from "@/lib/auth/token";
import { RestoreAccountModal } from "@/components/auth/RestoreAccountModal";

interface FacebookSignInProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

export function FacebookSignIn({
  onSuccess,
  onError,
}: FacebookSignInProps) {
  const searchParams = useSearchParams();
  const [isFBReady, setIsFBReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [restoreModal, setRestoreModal] = useState<{
    visible: boolean;
    deletedAt: string | null;
    accessToken: string;
  }>({ visible: false, deletedAt: null, accessToken: "" });
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (!FACEBOOK_APP_ID) {
      console.error("NEXT_PUBLIC_FACEBOOK_APP_ID not set");
      return;
    }

    const initFB = () => {
      if (!window.FB) return;
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      setIsFBReady(true);
    };

    if (window.FB) {
      initFB();
    } else {
      window.fbAsyncInit = initFB;

      const checkFB = setInterval(() => {
        if (window.FB) {
          clearInterval(checkFB);
          initFB();
        }
      }, 100);

      const timeout = setTimeout(() => clearInterval(checkFB), 10000);

      return () => {
        clearInterval(checkFB);
        clearTimeout(timeout);
      };
    }
  }, []);

  const handleFacebookSignIn = async () => {
    if (!window.FB || !isFBReady) return;

    setAuthError(null);
    setIsProcessing(true);

    window.FB.login(
      (response) => {
        void (async () => {
          try {
            if (
              response.status !== "connected" ||
              !response.authResponse?.accessToken
            ) {
              const msg = "Facebook login was cancelled or failed.";
              onError?.(msg);
              return;
            }

            const { accessToken } = response.authResponse;

            try {
              const result = await oAuthAPI.facebookAuth({ accessToken });
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
                  accessToken,
                });
                return;
              }

              const msg = apiError.message || "Facebook authentication failed. Please try again.";
              setAuthError(msg);
              onError?.(msg);
            }
          } finally {
            setIsProcessing(false);
          }
        })();
      },
      { scope: "public_profile email" },
    );
  };

  const handleFacebookRestore = async () => {
    setIsRestoring(true);
    setRestoreError(null);
    try {
      const result = await oAuthAPI.restoreOAuthAccount({
        provider: "facebook",
        accessToken: restoreModal.accessToken,
      });
      if (result.token) saveAuthToken(result.token);
      sessionStorage.removeItem("logged_out_at");
      toast.success("Account restored! Welcome back.");
      const destination = searchParams.get("redirect") || "/profile";
      window.location.href = destination;
    } catch (err) {
      const apiError = err as APIError;
      if (apiError.status === 400) {
        // Token likely expired — close modal and prompt user to sign in again
        setRestoreModal({ visible: false, deletedAt: null, accessToken: "" });
        setAuthError("Session expired. Please sign in with Facebook again to restore your account.");
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
    setRestoreModal({ visible: false, deletedAt: null, accessToken: "" });
    setRestoreError(null);
  };

  if (!FACEBOOK_APP_ID) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
        Facebook Sign-In not configured. Please add NEXT_PUBLIC_FACEBOOK_APP_ID
        to your environment variables.
      </div>
    );
  }

  return (
    <>
      <RestoreAccountModal
        open={restoreModal.visible}
        deletedAt={restoreModal.deletedAt}
        onRestore={handleFacebookRestore}
        onCancel={closeRestoreModal}
        isLoading={isRestoring}
        error={restoreError}
      />

      <div className="space-y-2">
        <Button
          onClick={handleFacebookSignIn}
          disabled={isProcessing || !isFBReady}
          variant="secondary"
          className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaFacebook className="h-5 w-5 lg:h-6 lg:w-6 text-[#1877F2]" />
          <span className="font-medium">
            {isProcessing
              ? "Connecting..."
              : !isFBReady
                ? "Loading..."
                : "Facebook"}
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
