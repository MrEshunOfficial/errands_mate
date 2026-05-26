"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Navigation,
  Clock,
  Shield,
  X,
  SlidersHorizontal,
  Loader2,
  Users,
  WifiOff,
  ArrowUpRight,
  Building2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// ─── Exact imports from the provided documents ─────────────────────
import type {
  BrowseProvidersParams,
  BrowseSortBy,
} from "@/lib/api/profile/business.profile.api";
import type { ProviderProfile } from "@/types/provider.profile.types";
import type { UserLocation } from "@/types/location.types";
import { useActiveCategories } from "@/hooks/services/categories/useServiceCategory";
import type { Category } from "@/types/services/categories/service.category.types";
import { useBrowseProviders } from "@/hooks/profiles/useProviderProfile";
import { CurrentUserCard } from "./CurrentUserCard";
import Image from "next/image";
import type { PopulatedUserProfile } from "@/types/provider.profile.types";
// ProvidersPage.tsx — add near the top, after imports
import type { PopulatedProfilePicture } from "@/types/core.user.profile.types";

function isPopulatedPic(v: unknown): v is PopulatedProfilePicture {
  return typeof v === "object" && v !== null && "url" in v;
}
// ─── Local types ──────────────────────────────────────────────────────────────

type GpsStatus =
  | "idle"
  | "locating"
  | "success"
  | "denied"
  | "unavailable"
  | "error";

interface GpsState {
  status: GpsStatus;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

interface Filters {
  q: string;
  region: string;
  serviceId: string;
  isAlwaysAvailable: boolean;
  isAddressVerified: boolean;
  radiusKm: number;
  sortBy: BrowseSortBy;
}

/** The browse endpoint populates the `profile` ref at query time. */
type BrowseProviderProfile = Omit<ProviderProfile, "profile"> & {
  profile?: PopulatedUserProfile | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Oti",
  "Savannah",
  "North East",
  "Bono East",
  "Western North",
  "Ahafo",
] as const;

const DEFAULT_FILTERS: Filters = {
  q: "",
  region: "",
  serviceId: "",
  isAlwaysAvailable: false,
  isAddressVerified: false,
  radiusKm: 10,
  sortBy: "distance",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name?: string | null): string {
  if (!name?.trim()) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Reads locality / city / region off UserLocation (doc 3 / location.types).
 */
function buildLocationLine(loc: UserLocation | undefined): string {
  if (!loc) return "";
  return [loc.locality, loc.city, loc.region].filter(Boolean).join(", ");
}

function activeFilterCount(f: Filters): number {
  return [
    f.region,
    f.serviceId,
    f.isAlwaysAvailable,
    f.isAddressVerified,
  ].filter(Boolean).length;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 animate-pulse">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-200 dark:bg-stone-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 bg-stone-200 dark:bg-stone-800 rounded-full" />
          <div className="h-3 w-24 bg-stone-100 dark:bg-stone-700 rounded-full" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-14 bg-stone-100 dark:bg-stone-700 rounded-full" />
            <div className="h-5 w-16 bg-stone-100 dark:bg-stone-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
// Props
interface ProviderCardProps {
  provider: BrowseProviderProfile; // ← was ProviderProfile
  isNearby?: boolean;
}

function ProviderCard({ provider, isNearby }: ProviderCardProps) {
  const name = provider.businessName ?? "Unknown Provider";
  const locationLine = buildLocationLine(provider.locationData);
  const dist = provider.distanceKm;
  const showDist = dist != null && isFinite(dist);
  const picture = provider.profile?.profilePictureId;
  const avatarUrl = isPopulatedPic(picture) ? picture.url : null;
  const avatarThumb = isPopulatedPic(picture) ? picture.thumbnailUrl : null;

  return (
    <Link
      href={`/providers/${String(provider._id)}`}
      className="group relative flex flex-col rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600/60 hover:shadow-lg hover:shadow-stone-100/80 dark:hover:shadow-stone-950/80 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99]">
      {isNearby && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-300" />
      )}

      <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm sm:text-base font-black shadow-sm select-none overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarThumb ?? avatarUrl}
                alt={name}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{initials(name)}</span>
            )}
            {provider.isAlwaysAvailable && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                {name}
              </p>
              {showDist && (
                <span className="shrink-0 flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-full px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
                  <Navigation size={8} />
                  {dist!.toFixed(1)} km
                </span>
              )}
            </div>
            {locationLine && (
              <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
                {locationLine}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        {provider.isAlwaysAvailable && (
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-full px-2 py-0.5">
              <Clock size={8} /> Always available
            </span>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-5 pb-3 sm:pb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-400 dark:text-stone-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
          <span>View profile</span>
          <ArrowUpRight
            size={12}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

interface SectionDividerProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  subtitle?: string;
}

function SectionDivider({ icon, title, count, subtitle }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
            {title}
          </p>
          {count != null && (
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2.5">
      {children}
    </p>
  );
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  categories: { id: string; label: string }[];
  gpsAvailable: boolean;
}

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  categories,
  gpsAvailable,
}: FilterSheetProps) {
  const count = activeFilterCount(filters);

  const sortOptions: {
    value: BrowseSortBy;
    label: string;
    disabled?: boolean;
  }[] = [
    {
      value: "distance",
      label: "Distance (nearest first)",
      disabled: !gpsAvailable,
    },
    { value: "createdAt", label: "Newest first" },
    { value: "businessName", label: "Name A–Z" },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-sm p-0 flex flex-col bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
        <SheetHeader className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-stone-900 dark:text-stone-50">
              Filters
            </SheetTitle>
            {count > 0 && (
              <button
                onClick={onReset}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 py-1 px-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                Reset all ({count})
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-stone-400 dark:text-stone-500">
            Narrow down providers by location, service, and availability.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Region */}
          <div>
            <FilterLabel>Region</FilterLabel>
            <select
              value={filters.region}
              onChange={(e) => onChange({ region: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400">
              <option value="">All regions</option>
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Service type */}
          {categories.length > 0 && (
            <div>
              <FilterLabel>Service type</FilterLabel>
              <select
                value={filters.serviceId}
                onChange={(e) => onChange({ serviceId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400">
                <option value="">All services</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search radius */}
          {gpsAvailable && (
            <div>
              <FilterLabel>Search radius</FilterLabel>
              <div className="grid grid-cols-4 gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onChange({ radiusKm: r })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      filters.radiusKm === r
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-amber-300"
                    }`}>
                    {r}km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Provider attributes — keys map to real ProviderProfile / UserLocation fields */}
          <div>
            <FilterLabel>Provider attributes</FilterLabel>
            <div className="space-y-2">
              {(
                [
                  {
                    key: "isAlwaysAvailable" as const,
                    label: "Always available",
                    icon: <Clock size={13} />,
                  },
                  {
                    key: "isAddressVerified" as const,
                    label: "Verified address",
                    icon: <Shield size={13} />,
                  },
                ] satisfies {
                  key: keyof Pick<
                    Filters,
                    "isAlwaysAvailable" | "isAddressVerified"
                  >;
                  label: string;
                  icon: React.ReactNode;
                }[]
              ).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => onChange({ [key]: !filters[key] })}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm transition-all ${
                    filters[key]
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                  }`}>
                  <span
                    className={
                      filters[key]
                        ? "text-amber-500"
                        : "text-stone-400 dark:text-stone-500"
                    }>
                    {icon}
                  </span>
                  {label}
                  {filters[key] && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <X size={9} className="text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by — BrowseSortBy from @/lib/api/profile/business.profile.api */}
          <div>
            <FilterLabel>Sort by</FilterLabel>
            <div className="flex flex-col gap-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  disabled={opt.disabled}
                  onClick={() => onChange({ sortBy: opt.value })}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    filters.sortBy === opt.value
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                  }`}>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                      filters.sortBy === opt.value
                        ? "border-amber-500 bg-amber-500"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-bold hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all">
            Apply Filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── GPS components ───────────────────────────────────────────────────────────

interface GpsBannerProps {
  status: GpsStatus;
  accuracy: number | null;
  onRetry: () => void;
}

function GpsBanner({ status, accuracy, onRetry }: GpsBannerProps) {
  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Nearby providers sorted first
        {accuracy != null && (
          <span className="font-normal text-emerald-400">
            ±{Math.round(accuracy)}m
          </span>
        )}
      </div>
    );
  }
  if (status === "locating") {
    return (
      <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
        <Loader2 size={11} className="animate-spin" />
        Detecting your location…
      </div>
    );
  }
  if (status === "denied" || status === "unavailable" || status === "error") {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
        <WifiOff size={10} />
        Location unavailable
        <RefreshCw size={10} />
      </button>
    );
  }
  return null;
}

function GpsPill({ status }: { status: GpsStatus }) {
  if (status === "success") {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-2.5 py-1.5 shrink-0">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        Nearby first
      </div>
    );
  }
  if (status === "locating") {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
        <Loader2 size={11} className="animate-spin" /> Locating…
      </div>
    );
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const stickySearchRef = useRef<HTMLInputElement>(null);

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── GPS ───────────────────────────────────────────────────────────────────
  const [gps, setGps] = useState<GpsState>(() => ({
    status:
      typeof navigator !== "undefined" && !navigator.geolocation
        ? "unavailable"
        : "locating",
    lat: null,
    lng: null,
    accuracy: null,
  }));

  const onGpsSuccess = useCallback((pos: GeolocationPosition) => {
    setGps({
      status: "success",
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
  }, []);

  const onGpsError = useCallback((err: GeolocationPositionError) => {
    const status: GpsStatus =
      err.code === err.PERMISSION_DENIED
        ? "denied"
        : err.code === err.POSITION_UNAVAILABLE
          ? "unavailable"
          : "error";
    setGps((prev) => ({ ...prev, status }));
  }, []);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGps((prev) => ({ ...prev, status: "unavailable" }));
      return;
    }
    setGps((prev) => ({ ...prev, status: "locating" }));
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });
  }, [onGpsSuccess, onGpsError]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const id = setTimeout(requestGps, 0);
      return () => clearTimeout(id);
    }
  }, [requestGps]);

  // ── Categories ────────────────────────────────────────────────────────────
  const { data: categoryData } = useActiveCategories();
  const categories = useMemo(
    () =>
      (categoryData ?? []).map((c: Category) => ({
        id: c._id as unknown as string,
        label: c.catName as string,
      })),
    [categoryData],
  );

  // ── BrowseProvidersParams (doc 2) ─────────────────────────────────────────
  const browseParams: BrowseProvidersParams = useMemo(
    () => ({
      ...(filters.q && { q: filters.q }),
      ...(filters.region && { region: filters.region }),
      ...(filters.isAlwaysAvailable && { isAlwaysAvailable: true }),
      ...(gps.status === "success" &&
        gps.lat != null &&
        gps.lng != null && { lat: gps.lat, lng: gps.lng }),
      radiusKm: filters.radiusKm,
      // Fall back from "distance" when GPS hasn't resolved yet
      sortBy:
        gps.status !== "success" && filters.sortBy === "distance"
          ? "createdAt"
          : filters.sortBy,
      page: 1,
      limit: 60,
    }),
    [filters, gps.status, gps.lat, gps.lng],
  );

  const { data, loading, error } = useBrowseProviders(browseParams);

  const nearbyProviders = useMemo(
    () => (data?.nearbyProviders ?? []) as unknown as BrowseProviderProfile[],
    [data?.nearbyProviders],
  );

  const nearbyIds = useMemo(
    () => new Set(nearbyProviders.map((p) => String(p._id))),
    [nearbyProviders],
  );
  const otherProviders = useMemo(
    () =>
      ((data?.providers ?? []) as unknown as BrowseProviderProfile[]).filter(
        (p) => !nearbyIds.has(String(p._id)),
      ),
    [data?.providers, nearbyIds],
  );

  const totalCount: number = data?.total ?? 0;
  const gpsAvailable = gps.status === "success";
  const filterCount = activeFilterCount(filters);
  const hasFilters = filterCount > 0 || !!filters.q;

  const updateFilters = useCallback(
    (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch })),
    [],
  );
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return (
    <main className="h-full overflow-y-auto hide-scrollbar bg-stone-50 dark:bg-stone-950">
      {/* ── Compact Sticky Bar ───────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}>
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-b border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                ref={stickySearchRef}
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search providers…"
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              />
              {filters.q && (
                <button
                  onClick={() => updateFilters({ q: "" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5">
                  <X size={12} />
                </button>
              )}
            </div>

            <GpsPill status={gps.status} />

            {/* Filter toggle */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                filterCount > 0
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
              }`}>
              <SlidersHorizontal size={13} />
              <span className="hidden xs:inline">Filters</span>
              {filterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>

            <span className="hidden md:inline text-xs text-stone-400 dark:text-stone-500 shrink-0">
              {loading
                ? "…"
                : `${totalCount} provider${totalCount !== 1 ? "s" : ""}`}
            </span>

            <Link
              href="/client/tasks/new"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm shrink-0">
              Post a Task <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #92400e 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-150 h-100 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-100 h-75 bg-orange-300/10 dark:bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-end py-3.5 sm:py-4 border-b border-stone-100/70 dark:border-stone-800/70">
            <Link
              href="/client/tasks/new"
              className="flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all shadow-sm">
              <Zap size={12} />
              <span>Post a Task</span>
            </Link>
          </div>

          {/* Hero body */}
          <div className="py-7 sm:py-10 grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-7 lg:gap-12 items-start lg:items-center">
            {/* Left: copy + search */}
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-amber-400" />
                  Browse Providers
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-50 leading-[1.15] tracking-tight">
                  Find Service{" "}
                  <span className="relative inline-block">
                    <span className="text-amber-500">Providers</span>
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/50 rounded-full" />
                  </span>
                  <br />
                  near you
                </h1>
              </div>

              {/* Stats */}
              {!loading && totalCount > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Users size={13} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                        {totalCount}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        providers
                      </p>
                    </div>
                  </div>
                  {gpsAvailable && nearbyProviders.length >= 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <Navigation size={13} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                            {nearbyProviders.length}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            near you
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Search + filters */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                    />
                    <input
                      value={filters.q}
                      onChange={(e) => updateFilters({ q: e.target.value })}
                      placeholder="Search by name, service, or area…"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 shadow-sm transition-all"
                    />
                    {filters.q && (
                      <button
                        onClick={() => updateFilters({ q: "" })}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setFilterSheetOpen(true)}
                    className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-3 rounded-2xl border text-sm font-semibold transition-all shadow-sm shrink-0 ${
                      filterCount > 0
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                    }`}>
                    <SlidersHorizontal size={15} />
                    <span className="hidden sm:inline">Filters</span>
                    {filterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center min-h-6">
                  <GpsBanner
                    status={gps.status}
                    accuracy={gps.accuracy}
                    onRetry={requestGps}
                  />
                </div>
              </div>
            </div>

            {/* Right: user card (desktop only) */}
            <div className="hidden lg:block w-full">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2.5 flex items-center gap-1.5">
                <span className="w-3 h-px bg-stone-300 dark:bg-stone-600" />
                My Location
              </p>
              <CurrentUserCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── Provider Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-8">
            <div>
              <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse mb-4" />
              <SkeletonGrid count={3} />
            </div>
            <div>
              <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse mb-4" />
              <SkeletonGrid count={6} />
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {/* Nearby — BrowseProvidersResponse.nearbyProviders (ProviderProfile[]) */}
            {gpsAvailable && nearbyProviders.length > 0 && (
              <section>
                <SectionDivider
                  icon={<Navigation size={14} />}
                  title="Near You"
                  count={nearbyProviders.length}
                  subtitle={`Within ${filters.radiusKm}km of your location`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {nearbyProviders.map((provider, i) => (
                    <ProviderCard
                      key={String(provider._id)}
                      provider={provider}
                      isNearby={i < 3}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Other / All — BrowseProvidersResponse.providers minus nearbyIds */}
            {otherProviders.length > 0 && (
              <section>
                <SectionDivider
                  icon={<Building2 size={14} />}
                  title={
                    gpsAvailable && nearbyProviders.length > 0
                      ? "Other Providers"
                      : "All Providers"
                  }
                  count={otherProviders.length}
                  subtitle={
                    gpsAvailable && nearbyProviders.length > 0
                      ? `Beyond ${filters.radiusKm}km`
                      : undefined
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {otherProviders.map((provider) => (
                    <ProviderCard
                      key={String(provider._id)}
                      provider={provider}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {nearbyProviders.length === 0 && otherProviders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Users
                    size={22}
                    className="text-stone-300 dark:text-stone-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                    {hasFilters
                      ? "No providers match your filters"
                      : "No providers yet"}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 max-w-50">
                    {hasFilters
                      ? "Try adjusting your search or removing some filters."
                      : "Providers will appear here once they join."}
                  </p>
                </div>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                    <X size={11} /> Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Filter notice */}
            {hasFilters && totalCount > 0 && (
              <div className="flex items-center justify-center gap-2">
                <AlertCircle
                  size={12}
                  className="text-stone-400 dark:text-stone-500"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Showing filtered results.{" "}
                  <button
                    onClick={resetFilters}
                    className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                    Clear all filters
                  </button>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        categories={categories}
        gpsAvailable={gpsAvailable}
      />
    </main>
  );
}
