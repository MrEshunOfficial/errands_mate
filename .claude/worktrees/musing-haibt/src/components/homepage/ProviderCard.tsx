"use client";

// components/homepage/provider/ProviderCard.tsx

import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Star,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { ProviderProfile } from "@/types/profiles/business.profile.types";
import { Service } from "@/types/services/service.types";

interface ProviderCardProps {
  profile: ProviderProfile;
  isLive: boolean;
  statusLoading: boolean;
  services: Service[];
  servicesLoading: boolean;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProviderCard({
  profile,
  isLive,
  statusLoading,
  services,
  servicesLoading,
}: ProviderCardProps) {
  const initials = getInitials(profile.businessName);

  const locationLabel = [
    profile.locationData?.locality,
    profile.locationData?.city,
    profile.locationData?.region,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const primaryContact = profile.providerContactInfo?.primaryContact;
  const businessEmail = profile.providerContactInfo?.businessEmail;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* ── Top row: avatar · name · live badge ── */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow select-none">
            {initials}
          </div>
          {/* Live status dot */}
          {!statusLoading && (
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                isLive ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {profile.businessName ?? "Your Business"}
            </p>

            {/* Live / Not live badge */}
            {statusLoading ? (
              <Loader2 size={12} className="animate-spin text-gray-400" />
            ) : isLive ? (
              <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full px-2 py-0.5">
                <CheckCircle2 size={10} />
                Live
              </span>
            ) : (
              <span className="shrink-0 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                <Clock size={10} />
                Not live
              </span>
            )}

            {profile.isCompanyTrained && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 rounded-full px-2 py-0.5">
                <BadgeCheck size={10} />
                Trained
              </span>
            )}

            {profile.isAlwaysAvailable && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5">
                <Star size={10} />
                Always available
              </span>
            )}
          </div>

          {/* Location */}
          {locationLabel && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin size={11} className="shrink-0" />
              <span>{locationLabel}</span>
              {profile.locationData?.isAddressVerified && (
                <BadgeCheck size={11} className="text-emerald-500 shrink-0" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Services ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Building2
          size={12}
          className="text-gray-400 dark:text-gray-500 shrink-0"
        />
        {servicesLoading ? (
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ) : services.length > 0 ? (
          <>
            {services.slice(0, 2).map((s) => (
              <span
                key={s._id}
                className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-2 py-0.5">
                {s.title}
              </span>
            ))}
            {services.length > 2 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{services.length - 2} more
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            No services added yet
          </span>
        )}
      </div>

      {/* ── Contact ── */}
      {(primaryContact || businessEmail) && (
        <div className="flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          {primaryContact && (
            <a
              href={`tel:${primaryContact}`}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Phone size={12} />
              {primaryContact}
            </a>
          )}
          {businessEmail && (
            <a
              href={`mailto:${businessEmail}`}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-50">
              <Mail size={12} />
              {businessEmail}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
