"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { ProviderStatus } from "@/types/provider.profile.types";
import type { Service } from "@/types/services/service.types";

// ─── Provider Summary ─────────────────────────────────────────────────────────

export interface ProviderSummary {
  _id: string;
  businessName?: string;
  profilePictureUrl?: string | null;
  profilePictureThumbnailUrl?: string | null;
  contactInfo?: {
    mainContact?: string | null;
    businessEmail?: string | null;
  } | null;
  locationData?: {
    region?: string;
    city?: string;
    locality?: string;
    isAddressVerified?: boolean;
  };
  status?: ProviderStatus;
  isAlwaysAvailable?: boolean;
  isAddressVerified?: boolean;
  serviceOfferings?: Service[];
  workingHours?: Record<string, { start: string; end: string }>;
  ratingStats?: { average: number; count: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInitials(businessName?: string): string {
  if (!businessName?.trim()) return "??";
  const words = businessName.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return businessName.slice(0, 2).toUpperCase();
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-stone-100 dark:bg-stone-800 rounded-full" />
          <div className="h-2.5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
        </div>
        <div className="w-16 h-8 bg-stone-100 dark:bg-stone-800 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Provider Drawer Card ─────────────────────────────────────────────────────

export interface ProviderDrawerCardProps {
  profile: ProviderSummary | null;
  loading?: boolean;
  providerId: string;
  onAction: (providerId: string) => void;
  actionLoading?: boolean;
  // matched-drawer extras
  distance?: number | null;
  leadTag?: string | null;
  matchStrength?: { label: string; dot: string } | null;
  // interested-drawer extras
  message?: string;
}

export function ProviderDrawerCard({
  profile,
  loading,
  providerId,
  onAction,
  actionLoading,
  distance,
  leadTag,
  matchStrength,
  message,
}: ProviderDrawerCardProps) {
  if (loading) return <SkeletonCard />;

  const businessName = profile?.businessName ?? "Unknown Provider";
  const initials = getInitials(profile?.businessName);

  const locationParts = [
    profile?.locationData?.locality,
    profile?.locationData?.city,
    profile?.locationData?.region,
  ].filter((v): v is string => Boolean(v));
  const locationLabel = locationParts.slice(0, 2).join(", ");
  const distanceLabel = distance != null ? `${distance.toFixed(1)} km away` : null;

  const phone = profile?.contactInfo?.mainContact;
  const email = profile?.contactInfo?.businessEmail;
  const addressVerified =
    profile?.isAddressVerified ?? profile?.locationData?.isAddressVerified;
  const rating = profile?.ratingStats;

  const namedServices = (profile?.serviceOfferings ?? [])
    .filter((s): s is Service => typeof s === "object" && Boolean(s.title))
    .slice(0, 3);
  const extraCount = (profile?.serviceOfferings?.length ?? 0) - namedServices.length;

  const isClosed = profile?.status === ProviderStatus.Closed;
  const isBooked = profile?.status === ProviderStatus.Booked;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors hover:border-stone-300 dark:hover:border-stone-700">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="relative w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-200/60 dark:ring-stone-700 flex items-center justify-center text-sm font-semibold text-stone-500 dark:text-stone-300 overflow-hidden shrink-0">
          {profile?.profilePictureUrl ? (
            <Image
              src={profile.profilePictureThumbnailUrl ?? profile.profilePictureUrl}
              alt={businessName}
              fill
              className="object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-tight">
              {businessName}
            </p>
            {addressVerified && (
              <BadgeCheck size={13} className="text-emerald-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-x-2.5 gap-y-1 mt-1 flex-wrap text-xs text-stone-500 dark:text-stone-400">
            {distanceLabel && (
              <span className="inline-flex items-center gap-1 font-medium text-stone-600 dark:text-stone-300">
                <Navigation size={11} className="shrink-0" />
                {distanceLabel}
              </span>
            )}
            {locationLabel && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </span>
            )}
            {(rating?.count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star
                  size={11}
                  className="text-amber-400 shrink-0"
                  fill="currentColor"
                />
                <span className="font-medium text-stone-700 dark:text-stone-200">
                  {rating!.average.toFixed(1)}
                </span>
                <span className="text-stone-400 dark:text-stone-500">
                  ({rating!.count})
                </span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onAction(providerId)}
          disabled={actionLoading || isClosed}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-colors">
          {actionLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ArrowUpRight size={12} />
          )}
          {actionLoading ? "…" : isClosed ? "Unavailable" : "Request"}
        </button>
      </div>

      {/* Signal row: match tag / strength / availability / status */}
      {(leadTag || matchStrength || isBooked || isClosed || profile?.isAlwaysAvailable) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] font-medium">
          {leadTag && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {leadTag}
            </span>
          )}
          {matchStrength && (
            <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <span className={`w-1.5 h-1.5 rounded-full ${matchStrength.dot}`} />
              {matchStrength.label}
            </span>
          )}
          {isBooked && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Currently booked
            </span>
          )}
          {isClosed && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              Closed
            </span>
          )}
          {profile?.isAlwaysAvailable && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Clock size={11} />
              Always available
            </span>
          )}
        </div>
      )}

      {/* Services */}
      {namedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {namedServices.map((s, i) => (
            <span
              key={i}
              className="text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-md px-2 py-0.5">
              {s.title}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500 px-1 py-0.5">
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      {/* Interested provider pitch message */}
      {message && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic leading-relaxed">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      )}

      {/* Contact */}
      {(phone || email) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              <Phone size={12} className="shrink-0" />
              {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors min-w-0">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      )}

      <Link
        href={`/providers/${providerId}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mt-3">
        <Building2 size={11} />
        View full profile
        <ChevronRight size={11} />
      </Link>
    </div>
  );
}
