"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button as ShadcnButton } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { PasswordGenerator } from "./featured/PasswordGenerator";

// Shared Input Field Component
const InputField = ({
  id,
  label,
  type = "text",
  icon,
  value,
  onChange,
  placeholder,
  error,
  children,
  minLength,
}: {
  id: string;
  label: string;
  type?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  children?: React.ReactNode;
  minLength?: number;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        {children}
      </div>
      <div className="mt-1 relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
          </div>
        )}
        <input
          id={id}
          name={id}
          type={inputType}
          required
          value={value}
          onChange={onChange}
          minLength={minLength}
          className={`block w-full ${icon ? "pl-10" : "pl-3"} ${
            type === "password" ? "pr-10" : "pr-3"
          } py-2 border ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          } rounded-md shadow-sm 
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          sm:text-sm transition-colors duration-200`}
          placeholder={placeholder}
        />
        {type === "password" && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

// Button Component
const Button = ({
  type = "button",
  disabled = false,
  loading = false,
  children,
  onClick,
}: {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
      rounded-md shadow-sm text-sm font-medium text-white 
      bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      disabled:opacity-60 disabled:cursor-not-allowed
      transition-colors duration-200"
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};

// Password Generator Popover Component
const PasswordGeneratorPopover = ({
  onSelectPassword,
}: {
  onSelectPassword: (password: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePasswordSelect = (password: string) => {
    onSelectPassword(password);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ShadcnButton
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-800 
          dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto font-normal
          hover:bg-transparent"
        >
          <KeyRound className="h-3 w-3 mr-1" />
          Generate password
        </ShadcnButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Password Generator
            </h3>
          </div>
          <PasswordGenerator onSelectPassword={handlePasswordSelect} />
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) => {
  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Passwords match",
      met: password === confirmPassword && confirmPassword !== "",
    },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              req.met
                ? "bg-green-500 dark:bg-green-400"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
          <span
            className={`${
              req.met
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Success Screen Component
const SuccessScreen = ({ onBackToLogin }: { onBackToLogin: () => void }) => (
  <div className="w-full max-w-lg rounded-xl shadow-lg dark:shadow-2xl p-8 transition-all duration-200">
    <div className="max-w-md w-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl p-8 text-center transition-all duration-200">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Password Reset Successful
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your password has been successfully reset. You can now sign in with
          your new password.
        </p>

        <Button onClick={onBackToLogin}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Sign In
        </Button>
      </div>
    </div>
  </div>
);

// Main Password Reset Form Component
const PasswordResetForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading, error: authError, clearError } = useAuth();

  // Get token from URL on component mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setErrors((prev) => ({
        ...prev,
        password:
          "Invalid or missing reset token. Please request a new password reset.",
      }));
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  // Password validation
  const validatePassword = (value: string): string => {
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(value)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    const passwordError = validatePassword(value);
    setErrors((prev) => ({
      ...prev,
      password: passwordError,
      confirmPassword:
        confirmPassword && value !== confirmPassword
          ? "Passwords do not match"
          : "",
    }));
    // Clear auth errors when user starts typing
    if (authError) clearError();
  };

  // Handle confirm password change with validation
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: value !== password ? "Passwords do not match" : "",
    }));
  };

  // Apply generated password with validation
  const applyGeneratedPassword = (generatedPassword: string) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);

    const passwordError = validatePassword(generatedPassword);
    setErrors({
      password: passwordError,
      confirmPassword: "",
    });

    toast.success("Strong password generated and applied!");
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      token &&
      validatePassword(password) === "" &&
      password === confirmPassword &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    // Clear any previous errors
    clearError();

    // Final validation check
    if (!isFormValid()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    try {
      await resetPassword({
        token,
        password: password,
      });

      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    router.push("/login");
  };

  // Show success screen if password reset was successful
  if (success) {
    return <SuccessScreen onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="w-full max-w-lg rounded-xl shadow-lg dark:shadow-2xl p-8 transition-all duration-200">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auth Error Display */}
        {authError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              {authError}
            </div>
          </div>
        )}

        {/* New Password Field */}
        <InputField
          id="password"
          label="New Password"
          type="password"
          icon={<Lock className="h-5 w-5" />}
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your new password"
          error={errors.password}
          minLength={8}
        >
          <PasswordGeneratorPopover onSelectPassword={applyGeneratedPassword} />
        </InputField>

        {/* Confirm Password Field */}
        <InputField
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          icon={<Lock className="h-5 w-5" />}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Confirm your new password"
          error={errors.confirmPassword}
          minLength={8}
        />

        {/* Password Strength Indicator */}
        <PasswordStrengthIndicator
          password={password}
          confirmPassword={confirmPassword}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid() || isLoading}
          loading={isLoading}
        >
          Reset Password
        </Button>
      </form>

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
  );
};

const PasswordResetPage = () => {
  return <PasswordResetForm />;
};

export default PasswordResetPage;
