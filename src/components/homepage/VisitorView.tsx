"use client";

import React from "react";
import {
  ArrowRight,
  LayoutGrid,
  UserPlus,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VisitorView() {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Find skilled providers
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Browse freely — sign up only when you&apos;re ready
      </p>

      {/* Gate nudge */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Lock className="w-4 h-4 shrink-0" />
        Sign up to contact providers, post tasks, or book
      </div>

      {/* CTAs */}
      <button
        onClick={() => router.push("/services")}
        className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 text-sm font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        <LayoutGrid className="w-4 h-4" />
        Explore Available Services
        <ArrowRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => router.push("/signup")}
        className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity">
        <UserPlus className="w-4 h-4" />
        Create free account
      </button>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-gray-900 dark:text-white underline underline-offset-2">
          Sign in
        </button>
      </p>

      {/* Trust */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-5">
        {["Verified", "Secure", "24/7 support"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
