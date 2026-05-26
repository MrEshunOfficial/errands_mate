"use client";

// components/homepage/VisitorView.tsx

import React from "react";
import { ArrowRight, Users, Briefcase, UserPlus, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VisitorView() {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Get Started Today
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Join our platform to post tasks or offer your services
      </p>

      <div className="space-y-4">
        {/* Client option */}
        <div className="p-5 bg-linear-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg shrink-0">
              <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                I Need Help (Client)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Post tasks and connect with verified service providers
              </p>
              <button
                onClick={() => router.push("/signup?role=client")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all text-sm">
                Sign up as Client
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Provider option */}
        <div className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                I Offer Services (Provider)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Find tasks, build your reputation, and earn money
              </p>
              <button
                onClick={() => router.push("/signup?role=provider")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm">
                Sign up as Provider
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-x-0 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="relative px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
            Already have an account?
          </span>
        </div>

        {/* Sign-in */}
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" />
          Sign In
        </button>
      </div>

      {/* Trust indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          {[
            "Verified users",
            "Secure platform",
            "24/7 support",
          ].map((label) => (
            <div key={label} className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
