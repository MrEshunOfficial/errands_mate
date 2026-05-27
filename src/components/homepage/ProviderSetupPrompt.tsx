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
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 bg-teal-100 dark:bg-teal-950 rounded-xl shrink-0">
          <Briefcase className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
          Complete Your Provider Profile
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Welcome! To start receiving task opportunities, you need to complete
          your provider profile.
        </p>

        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-800">
          <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-3 text-sm">
            What you&apos;ll need:
          </h3>
          <ul className="space-y-2">
            {REQUIREMENTS.map((req) => (
              <li key={req} className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-200">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => router.push("/provider/setup")}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
          Complete Profile Setup
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
