// app/verify-email/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

const VerificationContent = () => {
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        // Call your verification API
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");

          // Start countdown and redirect
          let count = 5;
          const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
              clearInterval(timer);
              router.push("/login");
            }
          }, 1000);

          // Cleanup timer on component unmount
          return () => clearInterval(timer);
        } else {
          setStatus(data.message?.includes("expired") ? "expired" : "error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = () => {
    router.push("/resend-verification");
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "error":
      case "expired":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Mail className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="max-w-md w-full rounded-xl shadow-lg p-8 text-center">
      <div className="mb-6 flex justify-center">{getStatusIcon()}</div>

      <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
        {status === "loading" && "Verifying Your Email..."}
        {status === "success" && "Email Verified!"}
        {status === "error" && "Verification Failed"}
        {status === "expired" && "Link Expired"}
      </h1>

      <p className="text-gray-600 mb-6">{message}</p>

      {status === "success" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Redirecting to login in {countdown} seconds...
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Go to Login Now
          </button>
        </div>
      )}

      {(status === "error" || status === "expired") && (
        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Resend Verification Email
          </button>
          <button
            onClick={handleBackToLogin}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            Back to Login
          </button>
        </div>
      )}

      {status === "loading" && (
        <p className="text-sm text-gray-500">
          Please wait while we verify your email address...
        </p>
      )}
    </div>
  );
};

const EmailVerificationPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
};

export default EmailVerificationPage;
