import { useEffect, useState, useCallback, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useOAuth } from "@/hooks/auth/useOauth";

interface GoogleSignInProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleSignIn({ mode, onSuccess, onError }: GoogleSignInProps) {
  const { googleAuth, isLoading, error, clearError } = useOAuth();
  const router = useRouter();
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Handle Google authentication response
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        setIsProcessing(true);
        clearError();

        const result = await googleAuth({ idToken: response.credential });

        if (result) {
          console.log("Google auth successful:", {
            user: result.user,
            isNewUser: mode === "register",
          });

          if (onSuccess) {
            onSuccess();
          }

          router.push("/profile");
        } else {
          const errorMsg = "Google authentication failed. Please try again.";
          if (onError) {
            onError(errorMsg);
          }
        }
      } catch (err) {
        console.error("Google auth error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Google authentication failed";
        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [googleAuth, router, mode, onSuccess, onError, clearError],
  );

  // Initialize Google Sign-In with button rendering
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID not found in environment variables");
      return;
    }

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        try {
          // Initialize Google Sign-In
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });

          // Render the Google button (hidden, we'll trigger it programmatically)
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
  }, [GOOGLE_CLIENT_ID, handleGoogleResponse]);

  // Trigger the hidden Google button
  const handleGoogleSignIn = () => {
    if (!isGoogleReady) {
      console.error("Google Sign-In not ready");
      return;
    }

    clearError();

    // Click the hidden Google button
    const googleButton = googleButtonRef.current?.querySelector(
      "div[role='button']",
    ) as HTMLElement;
    if (googleButton) {
      googleButton.click();
    } else {
      // Fallback to prompt if button not found
      if (window.google) {
        window.google.accounts.id.prompt();
      }
    }
  };

  const isButtonLoading = isLoading || isProcessing;

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
        Google Sign-In not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID
        to your environment variables.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Hidden Google button */}
      <div ref={googleButtonRef} className="hidden" />

      {/* Custom styled button */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isButtonLoading || !isGoogleReady}
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FcGoogle className="h-5 w-5 lg:h-6 lg:w-6" />
        <span className="font-medium">
          {isButtonLoading
            ? "Connecting..."
            : !isGoogleReady
              ? "Loading Google..."
              : mode === "register"
                ? "Sign up with Google"
                : "Continue with Google"}
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
