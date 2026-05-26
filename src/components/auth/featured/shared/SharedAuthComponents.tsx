// components/auth/shared/AuthComponents.tsx
"use client";
import { JSX, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TermsAndPrivacy } from "../TermsandConditions";
import CredentialsLogin from "../CredentialsLogin";
import CredentialsRegister from "../CredentialsRegister";
import { GoogleSignIn } from "@/components/auth/GoogleSignInButton";

// types/auth.ts
export type AuthMethod = "google" | "email";
export type AuthMode = "login" | "register";

// Auth Method Toggle Component
interface AuthMethodToggleProps {
  authMethod: AuthMethod;
  onMethodChange: (method: AuthMethod) => void;
}

export function AuthMethodToggle({
  authMethod,
  onMethodChange,
}: AuthMethodToggleProps) {
  const buttonClasses = (isActive: boolean) =>
    `flex-1 transition-colors duration-200 ${
      isActive
        ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        : "border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <div className="flex space-x-2 mb-4 lg:mb-6">
      <Button
        variant={authMethod === "google" ? "default" : "outline"}
        className={buttonClasses(authMethod === "google")}
        onClick={() => onMethodChange("google")}>
        Google
      </Button>
      <Button
        variant={authMethod === "email" ? "default" : "outline"}
        className={buttonClasses(authMethod === "email")}
        onClick={() => onMethodChange("email")}>
        Email
      </Button>
    </div>
  );
}

// Auth Link Component
interface AuthLinkProps {
  mode: AuthMode;
}

export function AuthLink({ mode }: AuthLinkProps) {
  const isLogin = mode === "login";
  const linkText = isLogin ? "Create account" : "Login instead";
  const linkHref = isLogin ? "/signup" : "/login";
  const promptText = isLogin
    ? "Don't have an account?"
    : "Already have an account?";

  return (
    <div className="text-center">
      <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base transition-colors duration-200">
        {promptText}{" "}
        <Link
          href={linkHref}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline">
          {linkText}
        </Link>
      </p>
    </div>
  );
}

// Google Auth Button Component
interface GoogleAuthButtonProps {
  mode: AuthMode;
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  return <GoogleSignIn mode={mode} />;
}

// Auth Header Components
interface AuthHeaderProps {
  mode: AuthMode;
}

function LoginHeader(): JSX.Element {
  return (
    <div className="flex flex-col justify-center items-center mb-4 lg:mb-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
        Welcome Back to{" "}
        <span className="text-teal-600 dark:text-teal-400 transition-colors duration-200">
          Errands Mate
        </span>
      </h2>
      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2 transition-colors duration-200">
        Please choose your preferred option
      </span>
    </div>
  );
}

function RegisterHeader(): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="text-center relative overflow-hidden mb-4 lg:mb-6">
      <div
        className={`space-y-2 transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        } transition-all duration-1000`}>
        <h2 className="flex item-center text-lg lg:text-xl font-extrabold text-gray-900 dark:text-white justify-start gap-2">
          <span>Connect & Access</span>
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-600">
            Essential Services
          </span>
        </h2>
      </div>
    </div>
  );
}

export function AuthHeader({ mode }: AuthHeaderProps) {
  return mode === "login" ? <LoginHeader /> : <RegisterHeader />;
}

// Auth Section Components
interface GoogleAuthSectionProps {
  mode: AuthMode;
}

export function GoogleAuthSection({ mode }: GoogleAuthSectionProps) {
  return (
    <div className="space-y-6 p-3 lg:p-4">
      <GoogleAuthButton mode={mode} />
      <AuthLink mode={mode} />
      <TermsAndPrivacy />
    </div>
  );
}

interface EmailAuthSectionProps {
  mode: AuthMode;
}

export function EmailAuthSection({ mode }: EmailAuthSectionProps) {
  const sectionTitle =
    mode === "login" ? "Login with Email" : "Sign up with Email";
  const CredentialsComponent =
    mode === "login" ? CredentialsLogin : CredentialsRegister;

  return (
    <div className="space-y-5">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700 transition-colors duration-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors duration-200">
            {sectionTitle}
          </span>
        </div>
      </div>
      <CredentialsComponent />
      <AuthLink mode={mode} />
      <TermsAndPrivacy />
    </div>
  );
}

// Base Auth Form Component
interface BaseAuthFormProps {
  mode: AuthMode;
  defaultMethod?: AuthMethod;
}

export function BaseAuthForm({
  mode,
  defaultMethod = "email",
}: BaseAuthFormProps): JSX.Element {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(defaultMethod);

  return (
    <div className="p-2 shadow">
      <AuthHeader mode={mode} />
      <AuthMethodToggle
        authMethod={authMethod}
        onMethodChange={setAuthMethod}
      />
      {authMethod === "google" ? (
        <GoogleAuthSection mode={mode} />
      ) : (
        <EmailAuthSection mode={mode} />
      )}
    </div>
  );
}
