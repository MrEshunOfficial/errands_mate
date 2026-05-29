"use client";

import {
  CheckCircle,
  Loader2,
  ArrowRight,
  User,
  Zap,
  ArrowUpRight,
  Navigation,
  Phone,
  Mail,
  BadgeCheck,
  Star,
  MapPin,
  X,
  ChevronRight,
  Layers,
  Clock,
  AlertCircle,
  Building2,
  Circle,
  RotateCcw,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useActiveCategories } from "@/hooks/services/categories/useServiceCategory";
import { Category } from "@/types/services/categories/service.category.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Service } from "@/types/services/service.types";
import { ProviderStatus } from "@/types/provider.profile.types";
import { ProviderMatchResult, MatchingSummary } from "@/types/task.types";
import { providerProfileAPI } from "@/lib/api/profile/business.profile.api";

// ─── Lean Provider Summary ────────────────────────────────────────────────────
//
// Subset of ProviderProfile carried inside an EnrichedMatch. The old
// ProviderProfileSummary type was removed from the canonical types, so this
// is defined locally for the drawer's needs.

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

// ─── Enriched Match Type ──────────────────────────────────────────────────────

export interface EnrichedMatch extends ProviderMatchResult {
  profile?: ProviderSummary;
  profileLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function fetchProviderProfile(
  providerId: string,
): Promise<ProviderSummary | null> {
  try {
    const p = await providerProfileAPI.getProviderProfileById(providerId, {
      populate: true,
    });

    if (!p?._id) return null;

    return {
      _id: String(p._id),
      businessName: p.businessName,
      contactInfo: p.contactInfo
        ? {
            mainContact: p.contactInfo.mainContact,
            businessEmail: p.contactInfo.businessEmail,
          }
        : null,
      locationData: p.locationData
        ? {
            region: p.locationData.region,
            city: p.locationData.city,
            locality: p.locationData.locality,
            isAddressVerified: p.locationData.isAddressVerified,
          }
        : undefined,
      status: p.status,
      isAlwaysAvailable: p.isAlwaysAvailable,
      isAddressVerified: p.isAddressVerified,
      workingHours: p.workingHours,
      ratingStats: p.ratingStats,
      serviceOfferings: Array.isArray(p.serviceOfferings)
        ? (p.serviceOfferings.filter(
            (s): s is Service => typeof s === "object" && s !== null,
          ) as Service[])
        : undefined,
    };
  } catch {
    return null;
  }
}


export function getInitials(businessName?: string): string {
  if (!businessName?.trim()) return "??";
  const words = businessName.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return businessName.slice(0, 2).toUpperCase();
}

function scoreToTier(score: number): "top" | "good" | "fair" {
  if (score >= 90) return "top";
  if (score >= 70) return "good";
  return "fair";
}

const TIER_STYLES = {
  top: { badge: "bg-amber-500 text-white", ring: "ring-2 ring-amber-400/50" },
  good: {
    badge: "bg-emerald-500 text-white",
    ring: "ring-2 ring-emerald-400/40",
  },
  fair: { badge: "bg-stone-400 text-white", ring: "ring-1 ring-stone-200/60" },
};

// ─── Status helpers (ProviderStatus → UI) ─────────────────────────────────────

interface StatusVisual {
  label: string;
  className: string;
  dot: string;
}

function statusToVisual(status?: ProviderStatus): StatusVisual | null {
  if (!status) return null;
  switch (status) {
    case ProviderStatus.Available:
      return {
        label: "Available",
        dot: "text-emerald-500 fill-emerald-500",
        className:
          "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
      };
    case ProviderStatus.Booked:
      return {
        label: "Currently booked",
        dot: "text-amber-500 fill-amber-500",
        className:
          "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
      };
    case ProviderStatus.Requested:
      return {
        label: "Requested",
        dot: "text-sky-500 fill-sky-500",
        className:
          "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
      };
    case ProviderStatus.Closed:
      return {
        label: "Closed",
        dot: "text-stone-400 fill-stone-400",
        className:
          "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
      };
    default:
      return null;
  }
}

// ─── Shared Primitives ────────────────────────────────────────────────────────

function Chip({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1 border ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-700/60 bg-white dark:bg-stone-800/60 p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-36 bg-stone-200 dark:bg-stone-700 rounded-full" />
          <div className="h-2.5 w-24 bg-stone-100 dark:bg-stone-700/60 rounded-full" />
        </div>
        <div className="w-16 h-7 bg-stone-100 dark:bg-stone-700/60 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-stone-100 dark:bg-stone-700/60 rounded-full" />
        <div className="h-5 w-16 bg-stone-100 dark:bg-stone-700/60 rounded-full" />
      </div>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  match,
  onRequest,
  requesting,
  rank,
}: {
  match: EnrichedMatch;
  onRequest: (providerId: string) => void;
  requesting: boolean;
  rank: number;
}) {
  const profile = match.profile;
  const isLoading = match.profileLoading;
  const tier = scoreToTier(match.matchScore);
  const styles = TIER_STYLES[tier];
  const statusVisual = statusToVisual(profile?.status);

  const businessName = profile?.businessName ?? "Unknown Provider";
  const initials = getInitials(profile?.businessName);

  const locationParts: string[] = [
    profile?.locationData?.locality,
    profile?.locationData?.city,
    profile?.locationData?.region,
  ].filter((v): v is string => Boolean(v));
  const locationLabel = locationParts.slice(0, 2).join(", ");
  const distanceLabel =
    match.distance != null ? `${match.distance.toFixed(1)} km` : null;

  const phone = profile?.contactInfo?.mainContact;
  const email = profile?.contactInfo?.businessEmail;

  const addressVerified =
    profile?.isAddressVerified ?? profile?.locationData?.isAddressVerified;

  const namedServices = (profile?.serviceOfferings ?? [])
    .filter((s): s is Service => typeof s === "object" && Boolean(s.title))
    .slice(0, 3);

  const extraCount =
    (profile?.serviceOfferings?.length ?? 0) - namedServices.length;

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="group relative rounded-2xl border border-stone-100 dark:border-stone-700/60 bg-white dark:bg-stone-800/60 overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-stone-200/80 dark:hover:shadow-stone-900/80 hover:-translate-y-0.5">
      {rank === 1 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-300" />
      )}

      <div className="p-4 space-y-3.5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className={`relative shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm select-none ${styles.ring}`}>
            {profile?.profilePictureUrl ? (
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <Image
                  src={profile.profilePictureThumbnailUrl ?? profile.profilePictureUrl}
                  alt={businessName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              initials
            )}
            <span
              className={`absolute -top-2 -right-2 text-[10px] leading-none font-extrabold px-1.5 py-0.5 rounded-full shadow-sm ${styles.badge}`}>
              {match.matchScore}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate leading-tight">
              {businessName}
            </p>
            {(locationLabel || distanceLabel) && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {locationLabel && (
                  <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                    <MapPin size={9} className="shrink-0" />
                    {locationLabel}
                  </span>
                )}
                {distanceLabel && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                    <Navigation size={9} className="shrink-0" />
                    {distanceLabel}
                  </span>
                )}
                {addressVerified && (
                  <BadgeCheck size={10} className="text-emerald-500 shrink-0" />
                )}
              </div>
            )}
            {(profile?.ratingStats?.count ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                  {profile!.ratingStats!.average.toFixed(1)}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">
                  ({profile!.ratingStats!.count})
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => onRequest(match.providerId)}
            disabled={requesting || profile?.status === ProviderStatus.Closed}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-700 hover:bg-amber-500 dark:hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-3 py-2 transition-all duration-200 mt-0.5 shadow-sm">
            {requesting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <ArrowUpRight size={11} />
            )}
            {requesting ? "Requesting…" : "Request"}
          </button>
        </div>

        {/* Badges */}
        {(tier === "top" || statusVisual || profile?.isAlwaysAvailable) && (
          <div className="flex flex-wrap gap-1.5">
            {tier === "top" && (
              <Chip
                icon={<Zap size={9} />}
                label="Top match"
                className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50"
              />
            )}
            {statusVisual && (
              <Chip
                icon={<Circle size={7} className={statusVisual.dot} />}
                label={statusVisual.label}
                className={statusVisual.className}
              />
            )}
            {profile?.isAlwaysAvailable && (
              <Chip
                icon={<Clock size={9} />}
                label="Always available"
                className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50"
              />
            )}
          </div>
        )}

        {/* Services */}
        {namedServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Layers
              size={10}
              className="text-stone-300 dark:text-stone-600 shrink-0"
            />
            {namedServices.map((s, i) => (
              <span
                key={i}
                className="text-[11px] font-medium bg-stone-100/80 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 rounded-lg px-2 py-0.5">
                {s.title}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Contact row */}
        {(phone || email) && (
          <div className="flex flex-wrap gap-3 pt-1 border-t border-stone-50 dark:border-stone-700/50">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
                <Phone size={11} className="shrink-0" />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate max-w-48">
                <Mail size={11} className="shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            )}
          </div>
        )}

        {/* View profile */}
        <Link
          href={`/providers/${match.providerId}`}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors pt-1 border-t border-stone-50 dark:border-stone-700/50 w-full">
          <Building2 size={10} />
          View full profile
          <ChevronRight size={10} className="ml-auto" />
        </Link>
      </div>
    </div>
  );
}

// ─── Summary Pills ────────────────────────────────────────────────────────────

function SummaryPills({ summary }: { summary: MatchingSummary }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {[
        {
          icon: <CheckCircle size={10} />,
          label: `${summary.totalMatches} matched`,
        },
        {
          icon: <Navigation size={10} />,
          label: `${summary.radiusUsedKm}km radius`,
        },
        { icon: <Zap size={10} />, label: summary.strategy },
      ].map((p, i) => (
        <span
          key={i}
          className="flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-full px-2.5 py-1">
          {p.icon}
          {p.label}
        </span>
      ))}
    </div>
  );
}

// ─── Proximity-only Banner ────────────────────────────────────────────────────
//
// Shown when the backend reports matchOutcome === "proximity_only": no provider
// was content-relevant to the task, but nearby providers were attached so the
// task is FLOATING and discoverable. Sets honest expectations for the client.

function ProximityOnlyBanner({ count }: { count: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3.5 py-3">
      <AlertCircle
        size={15}
        className="text-amber-500 shrink-0 mt-0.5"
      />
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
          No exact match found
        </p>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
          No provider matched your task directly, but it&apos;s now visible to{" "}
          <span className="font-semibold">
            {count} nearby provider{count !== 1 ? "s" : ""}
          </span>{" "}
          who may pick it up. We&apos;ll notify you when one responds.
        </p>
      </div>
    </div>
  );
}

// ─── Matched Providers Drawer ─────────────────────────────────────────────────

export interface MatchedProvidersDrawerProps {
  visible: boolean;
  providers: EnrichedMatch[];
  summary?: MatchingSummary;
  matchLoading: boolean;
  taskTitle: string;
  taskDescription?: string;
  taskCategory?: string;
  onClose: () => void;
  onRequest: (providerId: string) => void;
  requestingId: string | null;
  onRefresh?: () => void;
  onEditTask?: (data: { title: string; description: string; category?: string }) => void;
  editSaving?: boolean;
}

export function MatchedProvidersDrawer({
  visible,
  providers,
  summary,
  matchLoading,
  taskTitle,
  taskDescription,
  taskCategory,
  onClose,
  onRequest,
  requestingId,
  onRefresh,
  onEditTask,
  editSaving,
}: MatchedProvidersDrawerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [hasSubmittedEdit, setHasSubmittedEdit] = useState(false);

  const { data: categoryData, isLoading: catsLoading } = useActiveCategories();
  const categories = (categoryData ?? []).map((c: Category) => ({
    id: c._id,
    label: c.catName,
    icon: (c as Category & { icon?: string }).icon ?? "📋",
  }));
  const selectedCat = categories.find((c) => c.id === editCategory);

  useEffect(() => {
    if (hasSubmittedEdit && !editSaving) {
      setEditMode(false);
      setHasSubmittedEdit(false);
    }
  }, [editSaving, hasSubmittedEdit]);

  useEffect(() => {
    if (!visible) setEditMode(false);
  }, [visible]);

  function enterEditMode() {
    setEditTitle(taskTitle);
    setEditDescription(taskDescription ?? "");
    setEditCategory(taskCategory ?? "");
    setEditMode(true);
  }

  const hasProviders = providers.length > 0;
  const someLoading = providers.some((p) => p.profileLoading);
  const proximityOnly = summary?.matchOutcome === "proximity_only";

  return (
    <>
      <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full max-w-md p-0 flex flex-col bg-stone-50 dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
          {/* ── Header ── */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/80 backdrop-blur space-y-0 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 transition-colors">
              <X size={15} />
            </button>

            <div className="flex items-center gap-1.5 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Task Posted
              </p>
            </div>

            <SheetTitle className="text-xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight pr-8">
              Matched Providers
            </SheetTitle>
            <SheetDescription className="text-xs text-stone-400 dark:text-stone-500 mt-1 truncate max-w-[calc(100%-2rem)]">
              &quot;{taskTitle}&quot;
            </SheetDescription>

            {summary && !matchLoading && <SummaryPills summary={summary} />}

            {!editMode && (onRefresh || onEditTask) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={matchLoading}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <RotateCcw size={11} className={matchLoading ? "animate-spin" : ""} />
                    Refresh providers
                  </button>
                )}
                {onEditTask && (
                  <button
                    onClick={enterEditMode}
                    disabled={matchLoading}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Pencil size={11} />
                    Edit task
                  </button>
                )}
              </div>
            )}
          </SheetHeader>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {editMode ? (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Update your task details. Providers will be re-matched when you save.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                    Task title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Fix leaking bathroom pipe"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-500 transition-all"
                  />
                  {editTitle.trim().length > 0 && editTitle.trim().length < 3 && (
                    <p className="text-[11px] text-red-500 mt-1">Title must be at least 3 characters.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Details that help providers understand the job…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  {catsLoading ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-stone-400 dark:text-stone-500">
                      <Loader2 size={12} className="animate-spin" />
                      Loading…
                    </div>
                  ) : (
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                            editCategory
                              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                              : "border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-300 dark:hover:border-stone-600"
                          }`}>
                          <span className="flex items-center gap-2">
                            {selectedCat ? (
                              <>
                                <span className="text-base leading-none">{selectedCat.icon}</span>
                                <span className="font-medium text-stone-800 dark:text-stone-100">
                                  {selectedCat.label}
                                </span>
                              </>
                            ) : (
                              "Choose a category…"
                            )}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-stone-400 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 w-[--radix-popover-trigger-width]"
                        align="start"
                        sideOffset={6}>
                        <Command>
                          <CommandInput placeholder="Search categories…" className="h-9 text-sm" />
                          <CommandList className="max-h-44">
                            <CommandEmpty className="py-4 text-xs text-center text-stone-400">
                              No categories found.
                            </CommandEmpty>
                            <CommandGroup>
                              {categories.map((cat) => (
                                <CommandItem
                                  key={cat.id}
                                  value={cat.label}
                                  onSelect={() => {
                                    setEditCategory(cat.id);
                                    setCategoryOpen(false);
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                                  <span className="text-base leading-none w-5 text-center">
                                    {cat.icon}
                                  </span>
                                  <span className="text-sm">{cat.label}</span>
                                  {editCategory === cat.id && (
                                    <CheckCircle
                                      size={13}
                                      className="ml-auto text-amber-500 shrink-0"
                                    />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            ) : null}

            {!editMode && !matchLoading && proximityOnly && hasProviders && (
              <ProximityOnlyBanner count={summary?.totalMatches ?? providers.length} />
            )}

            {!editMode && matchLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-100 dark:border-stone-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
                  <Navigation
                    size={18}
                    className="absolute inset-0 m-auto text-amber-500"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                    Finding the best providers…
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Scanning your area for matches
                  </p>
                </div>
                <div className="w-full space-y-3 mt-2">
                  {[0, 1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            )}

            {!editMode && !matchLoading && someLoading && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-1">
                  Loading provider details…
                </p>
                {providers.map((p, i) =>
                  p.profileLoading ? (
                    <SkeletonCard key={i} />
                  ) : (
                    <ProviderCard
                      key={p.providerId}
                      match={p}
                      onRequest={onRequest}
                      requesting={requestingId === p.providerId}
                      rank={i + 1}
                    />
                  ),
                )}
              </div>
            )}

            {!editMode && !matchLoading && !someLoading && hasProviders && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1">
                  {providers.length} provider{providers.length !== 1 ? "s" : ""}{" "}
                  · {proximityOnly ? "nearby, sorted by distance" : "sorted by score"}
                </p>
                {providers.map((p, i) => (
                  <ProviderCard
                    key={p.providerId}
                    match={p}
                    onRequest={onRequest}
                    requesting={requestingId === p.providerId}
                    rank={i + 1}
                  />
                ))}
              </div>
            )}

            {!editMode && !matchLoading && !someLoading && !hasProviders && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shadow-inner">
                  <User
                    size={22}
                    className="text-stone-400 dark:text-stone-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                    No matches yet
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-56">
                    Your task is live and floating — nearby providers will see
                    it and can express interest.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-3 py-2">
                  <AlertCircle size={11} className="shrink-0" />
                  You&apos;ll be notified when a provider responds
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-4 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/80 backdrop-blur shrink-0 space-y-2.5">
            {editMode ? (
              <>
                <button
                  onClick={() => {
                    onEditTask?.({ title: editTitle, description: editDescription, category: editCategory || undefined });
                    setHasSubmittedEdit(true);
                  }}
                  disabled={editSaving || editTitle.trim().length < 3}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-amber-200">
                  {editSaving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <><RotateCcw size={14} /> Save &amp; Refresh</>
                  )}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  disabled={editSaving}
                  className="w-full flex items-center justify-center py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-bold hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all duration-200 shadow-sm">
                  View My Tasks <ArrowRight size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <ChevronRight size={13} />
                  Post Another Task
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
