"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PasswordGenerator } from "./PasswordGenerator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button as ShadcnButton } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";

// Super admin email constant
const SUPER_ADMIN_EMAIL = "christophereshun91@gmail.com";

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
  error,
  children,
}: {
  id: string;
  label: string;
  type?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  children?: React.ReactNode;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
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
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
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
          hover:bg-transparent">
          <KeyRound className="h-3 w-3 mr-1" />
          Generate password
        </ShadcnButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={5}>
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

// Utility function to check if email is super admin
const isSuperAdmin = (email: string): boolean => {
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();
};

// Main Registration Form Component
const CredentialsRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();
  const { signup, isLoading, error: authError, clearError } = useAuth();

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

  // Email validation
  const validateEmail = (value: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Handle field changes with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({
      ...prev,
      name: value.length < 2 ? "Name must be at least 2 characters" : "",
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value),
    }));
  };

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
  };

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
    setErrors((prev) => ({
      ...prev,
      password: passwordError,
      confirmPassword: "",
    }));

    toast.success("Strong password generated and applied!");
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      name.length >= 2 &&
      validateEmail(email) === "" &&
      validatePassword(password) === "" &&
      password === confirmPassword &&
      agreeToTerms &&
      !errors.name &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    // Final validation check
    if (!isFormValid()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    try {
      // Use the signup method from useAuth hook
      await signup({
        name,
        email,
        password,
      });

      // Check if this is the super admin email
      if (isSuperAdmin(email)) {
        // Super admin account created - redirect to login instead of verification
        toast.success(
          "Super Admin account created successfully! Please log in to access the admin dashboard."
        );
        router.push("/login");
      } else {
        // Regular user - show success toast and redirect to verify email page
        toast.success(
          "Account created successfully! Please check your email for verification instructions."
        );
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error("Registration error:", error);

      // The useAuth hook handles error state, but we also show a toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during registration.";

      toast.error(errorMessage);
    }
  };

  return (
    <div
      className="flex items-center justify-center p-2
    transition-colors duration-200 rounded-lg">
      <div
        className="border rounded-lg shadow-xl p-2
        transition-colors duration-200 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Super Admin Notice */}
          {isSuperAdmin(email) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Super Admin Registration:</strong> You will be
                redirected to login after account creation and have immediate
                access to admin features.
              </div>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-2" />
                {authError}
              </div>
            </div>
          )}

          <InputField
            id="name"
            label="Full Name"
            type="text"
            icon={<User className="h-5 w-5" />}
            value={name}
            onChange={handleNameChange}
            placeholder="John Doe"
            autoComplete="name"
            error={errors.name}
          />

          <InputField
            id="email"
            label="Email Address"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
          />

          <InputField
            id="password"
            label="Password"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password}>
            <PasswordGeneratorPopover
              onSelectPassword={applyGeneratedPassword}
            />
          </InputField>

          <InputField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 
              border-gray-300 dark:border-gray-600 rounded"
              required
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the{" "}
              <Link
                href="/terms-of-service"
                className="font-medium text-blue-600 hover:text-blue-500 
                dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-blue-600 hover:text-blue-500 
                dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              disabled={!isFormValid() || isLoading}
              loading={isLoading}>
              {isSuperAdmin(email)
                ? "Create Super Admin Account"
                : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CredentialsRegister;
