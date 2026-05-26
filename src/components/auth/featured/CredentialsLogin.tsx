"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

// Shared Input Field Component
const InputField = ({
  id,
  label,
  type = "text",
  icon,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
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
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          className={`block w-full ${icon ? "pl-10" : "pl-3"} ${
            type === "password" ? "pr-10" : "pr-3"
          } py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          sm:text-sm transition-colors duration-200`}
          placeholder={placeholder}
        />
        {type === "password" && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none">
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Button Component
const Button = ({
  type = "button",
  disabled = false,
  loading = false,
  children,
}: {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
      rounded-md shadow-sm text-sm font-medium text-white 
      bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
      disabled:opacity-60 disabled:cursor-not-allowed
      transition-colors duration-200">
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};

// Login Container Component
const CredentialsLogin = () => {
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberedEmail") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    try {
      // Use the login method from useAuth hook
      await login({ email, password });

      // Handle "remember me" functionality
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Show success toast and redirect
      toast.success("Welcome back! You've successfully logged in.");
      router.push("/profile");
    } catch (error) {
      console.error("Login error:", error);

      // The useAuth hook handles error state, but we also show a toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.";

      toast.error(errorMessage);
    }
  };

  return (
    <div
      className="flex items-center justify-center 
    transition-colors duration-200">
      <div
        className="border rounded-lg shadow-lg dark:shadow-xl p-3
        transition-colors duration-200 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          <InputField
            id="email"
            label="Email address"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <InputField
            id="password"
            label="Password"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-offset-0
                border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700
                transition-colors duration-200"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 
                dark:text-blue-400 dark:hover:text-blue-300
                transition-colors duration-200">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!email || !password || isLoading}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CredentialsLogin;
