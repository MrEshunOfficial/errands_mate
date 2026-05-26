"use client";

// components/homepage/provider/ProviderDashboard.tsx

import React from "react";
import { Briefcase, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import ProviderSetupPrompt from "./ProviderSetupPrompt";
import TaskOpportunities from "./TaskOpportunities";
import {
  useMyProviderProfile,
  useOnboardingStatus,
  useServiceOfferings,
} from "@/hooks/profiles/useBusinessProfile";
import ProviderCard from "./ProviderCard";

export default function ProviderDashboard() {
  const router = useRouter();

  // ── Own provider profile ───────────────────────────────────────────────────
  const { data: providerProfile, loading: profileLoading } =
    useMyProviderProfile();

  const profileId = providerProfile?._id ?? null;

  // ── Onboarding / live status ───────────────────────────────────────────────
  // useOnboardingStatus(profileId | null) → { isLive, missingFields, loading }
  const {
    isLive,
    missingFields,
    loading: statusLoading,
  } = useOnboardingStatus(profileId);

  // ── Service offerings ──────────────────────────────────────────────────────
  // useServiceOfferings(profileId | null) → AsyncState<ServiceOffering[]>
  const { data: services, loading: servicesLoading } =
    useServiceOfferings(profileId);

  // ── Loading — profile not yet resolved ────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── No provider profile — prompt onboarding ────────────────────────────────
  if (!providerProfile) {
    return <ProviderSetupPrompt />;
  }

  // ── Profile incomplete — nudge to finish setup ─────────────────────────────
  const showSetupNudge = !statusLoading && !isLive && missingFields.length > 0;

  return (
    <div className="space-y-6">
      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Dashboard
            </h2>
            {providerProfile.businessName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {providerProfile.businessName}
              </p>
            )}
          </div>
        </div>

        {/* Incomplete profile nudge */}
        {showSetupNudge && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-1 font-medium">
              Your profile isn&apos;t live yet
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              Missing: {missingFields.join(", ")}
            </p>
            <button
              onClick={() => router.push("/provider/setup")}
              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-sm">
              Complete Profile Setup
            </button>
          </div>
        )}

        {/* Profile summary card */}
        <ProviderCard
          profile={providerProfile}
          isLive={isLive}
          statusLoading={statusLoading}
          services={services ?? []}
          servicesLoading={servicesLoading}
        />

        {/* Primary CTA */}
        <div className="w-full flex items-center gap-2 mt-6">
          <button
            onClick={() => router.push("/provider/tasks/available")}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
            Browse Available Tasks
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/provider")}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
            View Business Profile
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Services / task opportunity summary */}
      {!servicesLoading && services && services.length > 0 && (
        <TaskOpportunities services={services} />
      )}
    </div>
  );
}
