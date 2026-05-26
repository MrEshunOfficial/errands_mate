// app/resend-verification/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

const ResendVerificationPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { resendVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await resendVerification({ email: email.trim() });
      setStatus("success");
      setMessage(
        "Verification email sent! Please check your inbox and spam folder."
      );
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error?.message || "Failed to send verification email. Please try again."
      );
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="max-w-md w-full rounded-xl shadow-lg p-8">
      <div className="mb-6 flex justify-center">
        <div className="bg-blue-100 p-4 rounded-full">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center mb-2">
        Resend Verification Email
      </h1>
      <p className=" text-center mb-6">
        Enter your email address and we'll send you a new verification link
      </p>

      {status === "success" ? (
        <div className="space-y-6">
          <div className=" border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">
                Email sent successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">{message}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStatus("idle")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              Send Another Email
            </button>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === "error" && message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={status === "loading"}
              required
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Verification Email</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={status === "loading"}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium disabled:opacity-50"
            >
              Back to Login
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Didn't receive the email? Check your spam folder or ensure you entered
          the correct email address.
        </p>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
