"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState("");

  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Clear any previous errors
    clearError();

    try {
      await forgotPassword({ email });
      setSuccess(true);
      setEmailSent(email);
      toast.success("Password reset instructions sent to your email!");
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send reset email. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleResendEmail = async () => {
    // Clear any previous errors
    clearError();

    try {
      await forgotPassword({ email: emailSent });
      toast.success("Reset email sent again! Please check your inbox.");
    } catch (error) {
      console.error("Resend email error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend email. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl p-8 text-center transition-all duration-200">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-2">
              We&apos;ve sent password reset instructions to:
            </p>

            <p className="text-blue-600 dark:text-blue-400 font-medium mb-6">
              {emailSent}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Didn&apos;t receive the email?</strong>
                <br />
                Check your spam folder or click the button below to resend.
              </p>
            </div>

            {/* Auth Error Display */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Resend Email
                  </>
                )}
              </button>

              <button
                onClick={handleBackToLogin}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <div className="rounded-xl shadow-lg dark:shadow-2xl p-8 transition-all duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            No worries! Enter your email and we&apos;ll send you reset
            instructions.
          </p>
        </div>

        {/* Auth Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 transition-colors duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your email address"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We&apos;ll send reset instructions to this email address
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
                What happens next?
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                You&apos;ll receive an email with a secure link to reset your
                password. The link will expire in 1 hour for security reasons.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
