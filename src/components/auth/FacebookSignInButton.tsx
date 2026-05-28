"use client";

import { useEffect, useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useOAuth } from "@/hooks/auth/useOauth";

interface FacebookSignInProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

export function FacebookSignIn({
  mode,
  onSuccess,
  onError,
}: FacebookSignInProps) {
  const { facebookAuth, isLoading, error, clearError } = useOAuth();
  const searchParams = useSearchParams();
  const [isFBReady, setIsFBReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      // SDK loaded asynchronously — use fbAsyncInit hook
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

    clearError();
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

            const result = await facebookAuth({
              accessToken: response.authResponse.accessToken,
            });

            if (result) {
              onSuccess?.();
              const destination = searchParams.get("redirect") || "/profile";
              window.location.href = destination;
            } else {
              onError?.("Facebook authentication failed. Please try again.");
            }
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Facebook authentication failed";
            onError?.(msg);
          } finally {
            setIsProcessing(false);
          }
        })();
      },
      { scope: "public_profile,email" },
    );
  };

  if (!FACEBOOK_APP_ID) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
        Facebook Sign-In not configured. Please add NEXT_PUBLIC_FACEBOOK_APP_ID
        to your environment variables.
      </div>
    );
  }

  const isButtonLoading = isLoading || isProcessing;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFacebookSignIn}
        disabled={isButtonLoading || !isFBReady}
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaFacebook className="h-5 w-5 lg:h-6 lg:w-6 text-[#1877F2]" />
        <span className="font-medium">
          {isButtonLoading
            ? "Connecting..."
            : !isFBReady
              ? "Loading Facebook..."
              : mode === "register"
                ? "Sign up with Facebook"
                : "Continue with Facebook"}
        </span>
      </Button>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
