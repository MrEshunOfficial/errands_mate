"use client";

// components/homepage/provider/ProviderCard.tsx

import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Star,
  Building2,
} from "lucide-react";
import { Service } from "@/types/services/service.types";
import { ProviderProfile } from "@/types/provider.profile.types";
import { getInitials } from "./providerCard.utils";

interface ProviderCardProps {
  profile: ProviderProfile;
  services: Service[];
  servicesLoading: boolean;
  avatarUrl?: string;
}

export default function ProviderCard({
  profile,
  services,
  servicesLoading,
  avatarUrl,
}: ProviderCardProps) {
  const locationLabel = [
    profile.locationData?.locality,
    profile.locationData?.city,
    profile.locationData?.region,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const primaryContact = profile.contactInfo?.mainContact;
  const businessEmail = profile.contactInfo?.businessEmail;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* ── Top row: avatar · name · live badge ── */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow select-none overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profile.businessName ?? "Provider"}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              getInitials(profile.businessName)
            )}
          </div>
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {profile.businessName ?? "Your Business"}
            </p>

            {profile.isAlwaysAvailable && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5">
                <Star size={10} />
                Always available
              </span>
            )}
          </div>

          {/* Rating */}
          {(profile.ratingStats?.count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />
              <span className="font-semibold">{profile.ratingStats!.average.toFixed(1)}</span>
              <span className="text-gray-400 dark:text-gray-500">({profile.ratingStats!.count})</span>
            </div>
          )}

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
                key={s._id.toString()}
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
