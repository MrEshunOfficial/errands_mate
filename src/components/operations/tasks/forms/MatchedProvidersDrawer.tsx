"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  RotateCcw,
  Star,
  User,
  X,
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

// Match strength — only meaningful for genuine content matches, never shown in
// proximity-only mode where the score is purely distance-derived.
function matchStrength(score: number): { label: string; dot: string } {
  if (score >= 85) return { label: "Strong match", dot: "bg-emerald-500" };
  if (score >= 65) return { label: "Good match", dot: "bg-sky-500" };
  return { label: "Fair match", dot: "bg-stone-400" };
}

// ─── Status helpers (ProviderStatus → UI) ─────────────────────────────────────
//
// Only surfaced when it changes the client's decision (booked / closed). An
// "Available" provider is the default expectation, so we don't add noise for it.

interface StatusVisual {
  label: string;
  dot: string;
}

function statusToVisual(status?: ProviderStatus): StatusVisual | null {
  switch (status) {
    case ProviderStatus.Booked:
      return { label: "Currently booked", dot: "bg-amber-500" };
    case ProviderStatus.Closed:
      return { label: "Closed", dot: "bg-stone-400" };
    default:
      return null;
  }
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
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

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  match,
  onRequest,
  requesting,
  rank,
  proximityOnly,
}: {
  match: EnrichedMatch;
  onRequest: (providerId: string) => void;
  requesting: boolean;
  rank: number;
  proximityOnly: boolean;
}) {
  const profile = match.profile;

  if (match.profileLoading) return <SkeletonCard />;

  const businessName = profile?.businessName ?? "Unknown Provider";
  const initials = getInitials(profile?.businessName);

  const locationParts = [
    profile?.locationData?.locality,
    profile?.locationData?.city,
    profile?.locationData?.region,
  ].filter((v): v is string => Boolean(v));
  const locationLabel = locationParts.slice(0, 2).join(", ");
  const distanceLabel =
    match.distance != null ? `${match.distance.toFixed(1)} km away` : null;

  const phone = profile?.contactInfo?.mainContact;
  const email = profile?.contactInfo?.businessEmail;
  const addressVerified =
    profile?.isAddressVerified ?? profile?.locationData?.isAddressVerified;
  const rating = profile?.ratingStats;

  const namedServices = (profile?.serviceOfferings ?? [])
    .filter((s): s is Service => typeof s === "object" && Boolean(s.title))
    .slice(0, 3);
  const extraCount =
    (profile?.serviceOfferings?.length ?? 0) - namedServices.length;

  const statusVisual = statusToVisual(profile?.status);
  const isClosed = profile?.status === ProviderStatus.Closed;

  // Honest lead signal: a content match shows match strength; a proximity-only
  // provider shows only how close it is — never a "match" claim.
  const strength = !proximityOnly ? matchStrength(match.matchScore) : null;
  const leadTag =
    proximityOnly && rank === 1 ? "Closest" : !proximityOnly && rank === 1 ? "Best match" : null;

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
                <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />
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
          onClick={() => onRequest(match.providerId)}
          disabled={requesting || isClosed}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-colors">
          {requesting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ArrowUpRight size={12} />
          )}
          {requesting ? "…" : "Request"}
        </button>
      </div>

      {/* Signal row: match strength / lead tag / availability */}
      {(strength || leadTag || statusVisual || profile?.isAlwaysAvailable) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] font-medium">
          {leadTag && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {leadTag}
            </span>
          )}
          {strength && (
            <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <span className={`w-1.5 h-1.5 rounded-full ${strength.dot}`} />
              {strength.label}
            </span>
          )}
          {statusVisual && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className={`w-1.5 h-1.5 rounded-full ${statusVisual.dot}`} />
              {statusVisual.label}
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

      {/* Contact + profile */}
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
        href={`/providers/${match.providerId}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mt-3">
        <Building2 size={11} />
        View full profile
        <ChevronRight size={11} />
      </Link>
    </div>
  );
}

// ─── Proximity-only notice ────────────────────────────────────────────────────
//
// Shown when matchOutcome === "proximity_only": no provider was content-relevant,
// but nearby providers were attached so the task is FLOATING and discoverable.

function ProximityOnlyNotice({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-900/15 px-4 py-3">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
        No exact match — your task is floating
      </p>
      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed mt-0.5">
        It&apos;s now visible to{" "}
        <span className="font-semibold">
          {count} nearby provider{count !== 1 ? "s" : ""}
        </span>{" "}
        who can express interest. We&apos;ll notify you when one responds.
      </p>
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
  const count = summary?.totalMatches ?? providers.length;

  // One honest summary line — no internal strategy jargon, no "matched" claim
  // when providers are merely nearby.
  const summaryLine =
    summary && !matchLoading
      ? proximityOnly
        ? `${count} nearby · within ${summary.radiusUsedKm} km`
        : `${count} match${count !== 1 ? "es" : ""} · ${summary.radiusUsedKm} km radius`
      : null;

  const showList = !editMode && !matchLoading && hasProviders;

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col bg-stone-50 dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800">
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-0 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 transition-colors">
            <X size={15} />
          </button>

          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Task Posted
            </p>
          </div>

          <SheetTitle className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight pr-8">
            {proximityOnly ? "Nearby Providers" : "Matched Providers"}
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate max-w-[calc(100%-2rem)]">
            &quot;{taskTitle}&quot;
          </SheetDescription>

          {summaryLine && (
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-2">
              {summaryLine}
            </p>
          )}

          {!editMode && (onRefresh || onEditTask) && (
            <div className="flex items-center gap-2 mt-3">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={matchLoading}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <RotateCcw size={11} className={matchLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              )}
              {onEditTask && (
                <button
                  onClick={enterEditMode}
                  disabled={matchLoading}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Pencil size={11} />
                  Edit task
                </button>
              )}
            </div>
          )}
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {editMode && (
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
          )}

          {!editMode && !matchLoading && proximityOnly && hasProviders && (
            <ProximityOnlyNotice count={count} />
          )}

          {!editMode && matchLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 px-1 py-2">
                <Loader2 size={15} className="text-amber-500 animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                    Finding providers near you…
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500">
                    This usually takes a moment.
                  </p>
                </div>
              </div>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {showList && (
            <>
              {someLoading && (
                <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 px-1">
                  Loading provider details…
                </p>
              )}
              {providers.map((p, i) => (
                <ProviderCard
                  key={p.providerId}
                  match={p}
                  onRequest={onRequest}
                  requesting={requestingId === p.providerId}
                  rank={i + 1}
                  proximityOnly={proximityOnly}
                />
              ))}
            </>
          )}

          {!editMode && !matchLoading && !hasProviders && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
              <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <User size={20} className="text-stone-400 dark:text-stone-500" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                  Your task is floating
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-60">
                  No providers nearby just yet. Your task is live — providers will
                  see it and can express interest, and we&apos;ll notify you when
                  one responds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 space-y-2.5">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  onEditTask?.({ title: editTitle, description: editDescription, category: editCategory || undefined });
                  setHasSubmittedEdit(true);
                }}
                disabled={editSaving || editTitle.trim().length < 3}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {editSaving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving…</>
                ) : (
                  <><RotateCcw size={14} /> Save &amp; refresh</>
                )}
              </button>
              <button
                onClick={() => setEditMode(false)}
                disabled={editSaving}
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-colors">
                View my tasks <ArrowRight size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                Post another task
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
