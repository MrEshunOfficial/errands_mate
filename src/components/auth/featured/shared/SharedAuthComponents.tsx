// components/auth/shared/AuthComponents.tsx
"use client";
import { JSX, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TermsAndPrivacy } from "../TermsandConditions";
import CredentialsLogin from "../CredentialsLogin";
import CredentialsRegister from "../CredentialsRegister";
import { GoogleSignIn } from "@/components/auth/GoogleSignInButton";
import { FacebookSignIn } from "@/components/auth/FacebookSignInButton";
import { saveAuthToken } from "@/lib/auth/token";

export type AuthMode = "login" | "register";

// ─── Auth Link ────────────────────────────────────────────────────────────────

interface AuthLinkProps {
  mode: AuthMode;
}

export function AuthLink({ mode }: AuthLinkProps) {
  const isLogin = mode === "login";
  return (
    <div className="text-center">
      <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-200">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline">
          {isLogin ? "Create account" : "Login instead"}
        </Link>
      </p>
    </div>
  );
}

// ─── Auth Header ──────────────────────────────────────────────────────────────

function LoginHeader(): JSX.Element {
  return (
    <div className="flex flex-col justify-center items-center mb-4 lg:mb-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
        Welcome Back to{" "}
        <span className="text-teal-600 dark:text-teal-400 transition-colors duration-200">
          Errands Mate
        </span>
      </h2>
      <span className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors duration-200">
        Choose how you'd like to sign in
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
        <h2 className="flex items-center justify-start text-lg lg:text-xl font-extrabold text-gray-900 dark:text-white gap-2">
          <span>Connect & Access</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-600">
            Essential Services
          </span>
        </h2>
      </div>
    </div>
  );
}

export function AuthHeader({ mode }: { mode: AuthMode }) {
  return mode === "login" ? <LoginHeader /> : <RegisterHeader />;
}

// ─── Base Auth Form ───────────────────────────────────────────────────────────

interface BaseAuthFormProps {
  mode: AuthMode;
}

export function BaseAuthForm({ mode }: BaseAuthFormProps): JSX.Element {
  const searchParams = useSearchParams();
  const CredentialsComponent =
    mode === "login" ? CredentialsLogin : CredentialsRegister;

  // If the user has a valid token in localStorage but no cookie (common after
  // mobile browsers clear session cookies), restore the cookie and skip login.
  useEffect(() => {
    if (mode !== "login") return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp && Math.floor(Date.now() / 1000) > payload.exp;
      if (expired) return;
      saveAuthToken(token);
      const destination = searchParams.get("redirect") || "/profile";
      window.location.href = destination;
    } catch {
      // Malformed token — let user log in normally
    }
  }, [mode, searchParams]);

  return (
    <div className="w-full p-2 shadow space-y-5">
      <AuthHeader mode={mode} />

      {/* Social logins */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
          Continue with
        </p>
        <div className="space-y-3">
          <GoogleSignIn mode={mode} />
          <FacebookSignIn mode={mode} />
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="mx-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          or continue with email
        </span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* Email / password form */}
      <CredentialsComponent />

      <AuthLink mode={mode} />
      <TermsAndPrivacy />
    </div>
  );
}
