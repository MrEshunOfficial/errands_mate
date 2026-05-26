"use client";

// components/homepage/provider/ProviderDashboard.tsx

import { Briefcase, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import ProviderSetupPrompt from "./ProviderSetupPrompt";
import TaskOpportunities from "./TaskOpportunities";
import {
  useMyProviderProfile,
  useServiceOfferings,
} from "@/hooks/profiles/useProviderProfile";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { isPopulatedPicture } from "@/types/core.user.profile.types";
import ProviderCard from "./ProviderCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface StatusVisual {
  label: string;
  dot: string;
  badge: string;
  pulse: boolean;
}

const STATUS_CONFIG: Record<string, StatusVisual> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    badge: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700",
    pulse: true,
  },
  booked: {
    label: "Booked",
    dot: "bg-amber-500",
    badge: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
    pulse: false,
  },
  requested: {
    label: "Requested",
    dot: "bg-sky-500",
    badge: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700",
    pulse: false,
  },
  closed: {
    label: "Closed",
    dot: "bg-gray-400",
    badge: "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    pulse: false,
  },
};

function resolveStatus(
  profile: { status?: string; ProviderStatus?: string },
): string | null {
  return profile.status ?? profile.ProviderStatus ?? null;
}

function getStatusConfig(status?: string | null): StatusVisual | null {
  if (!status) return null;
  return STATUS_CONFIG[status.toLowerCase()] ?? null;
}

export default function ProviderDashboard() {
  const router = useRouter();

  // ── Own provider profile ───────────────────────────────────────────────────
  const { data: providerProfile, loading: profileLoading } =
    useMyProviderProfile();

  const profileId = providerProfile?._id ? String(providerProfile._id) : null;

  // ── Service offerings ──────────────────────────────────────────────────────
  const { data: services, loading: servicesLoading } =
    useServiceOfferings(profileId);

  // ── User profile picture ───────────────────────────────────────────────────
  const { profile: userProfile } = useProfile();
  const avatarUrl = isPopulatedPicture(userProfile?.profilePictureId)
    ? (userProfile.profilePictureId.thumbnailUrl || userProfile.profilePictureId.url)
    : undefined;

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

  return (
    <div className="space-y-6">
      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}
            </h2>
          </div>

          {/* Availability status pill */}
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cfg = getStatusConfig(resolveStatus(providerProfile as any));
            if (!cfg) return null;
            return (
              <span className={`flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1 shrink-0 ${cfg.badge}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                  {cfg.pulse && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
                </span>
                {cfg.label}
              </span>
            );
          })()}
        </div>

        {/* Profile summary card */}
        <ProviderCard
          profile={providerProfile}
          services={services ?? []}
          servicesLoading={servicesLoading}
          avatarUrl={avatarUrl}
        />

        {/* Primary CTA */}
        <div className="w-full mt-6">
          <button
            onClick={() => router.push("/profile")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
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
