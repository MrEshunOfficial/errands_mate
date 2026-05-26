"use client";

// components/homepage/provider/ProviderSetupPrompt.tsx

import React from "react";
import { Briefcase, ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const REQUIREMENTS = [
  "Business or professional information",
  "Location and service area details",
  "Services you offer",
  "Valid identification",
] as const;

export default function ProviderSetupPrompt() {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
          <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Complete Your Provider Profile
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Welcome! To start receiving task opportunities, you need to complete
          your provider profile.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-sm">
            What you&apos;ll need:
          </h3>
          <ul className="space-y-2">
            {REQUIREMENTS.map((req) => (
              <li key={req} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => router.push("/provider/setup")}
          className="w-full py-3 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Complete Profile Setup
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
