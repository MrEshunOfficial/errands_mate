"use client";

import { useEffect, useRef } from "react";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  Navigation,
  Building,
  LocateFixed,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { UserRole } from "@/types/base.types";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import type { UserLocation, Location } from "@/types/location.types";
import { useMyProviderProfile } from "@/hooks/profiles/useProviderProfile";
import { useGeolocation } from "@/hooks/profiles/useGeolocation";
import { useClientPreference } from "@/hooks/profiles/useClientPreference";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden animate-pulse">
      <div className="h-0.5 bg-stone-200 dark:bg-stone-700" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-stone-200 dark:bg-stone-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 bg-stone-200 dark:bg-stone-800 rounded-full" />
            <div className="h-5 w-16 bg-stone-100 dark:bg-stone-700 rounded-full" />
          </div>
          <div className="w-4 h-4 bg-stone-100 dark:bg-stone-700 rounded-full" />
        </div>
        <div className="mt-3">
          <div className="h-20 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Location Block ───────────────────────────────────────────────────────────

type AccentColor = "amber" | "emerald" | "sky" | "stone";

const ACCENT = {
  amber: {
    border: "border-l-amber-400 dark:border-l-amber-500/60",
    bg: "bg-amber-50/60 dark:bg-amber-900/10",
    icon: "text-amber-400 dark:text-amber-500",
    gps: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
  },
  emerald: {
    border: "border-l-emerald-400 dark:border-l-emerald-500/60",
    bg: "bg-emerald-50/60 dark:bg-emerald-900/10",
    icon: "text-emerald-400 dark:text-emerald-500",
    gps: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  },
  sky: {
    border: "border-l-sky-400 dark:border-l-sky-500/60",
    bg: "bg-sky-50/60 dark:bg-sky-900/10",
    icon: "text-sky-400 dark:text-sky-500",
    gps: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50",
  },
  stone: {
    border: "border-l-stone-300 dark:border-l-stone-600",
    bg: "bg-stone-50 dark:bg-stone-800/40",
    icon: "text-stone-400 dark:text-stone-500",
    gps: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700",
  },
} satisfies Record<AccentColor, Record<string, string>>;

/**
 * Structured address display.
 *
 * Visual hierarchy (top → bottom):
 *   Region          — uppercase micro badge  (highest level)
 *   Locality · City — the "where exactly"    (mid specificity)
 *   Street / detail — most granular line     (if available)
 *   Nearby landmark — contextual hint
 *   GPS code        — monospace pill          (Ghana Post code)
 */
function LocationBlock({
  loc,
  accentColor = "stone",
  label,
}: {
  loc?: Pick<
    UserLocation,
    | "locality"
    | "city"
    | "region"
    | "district"
    | "ghanaPostGPS"
    | "streetName"
    | "nearbyLandmark"
  > | null;
  accentColor?: AccentColor;
  label?: string;
}) {
  const c = ACCENT[accentColor];

  // ── Empty state ────────────────────────────────────────────────────────────
  if (
    !loc ||
    (!loc.region && !loc.city && !loc.locality && !loc.ghanaPostGPS)
  ) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700">
        <MapPin
          size={11}
          className="text-stone-300 dark:text-stone-600 shrink-0"
        />
        <p className="text-xs text-stone-400 dark:text-stone-500 italic">
          No address saved yet
        </p>
      </div>
    );
  }

  const {
    region,
    city,
    locality,
    district,
    streetName,
    nearbyLandmark,
    ghanaPostGPS,
  } = loc;

  // Compose lines
  // Most specific: street + locality together
  const specificLine = [streetName, locality].filter(Boolean).join(", ");
  // Mid: city + district (avoid repeating if same)
  const midLine =
    city === district ? city : [city, district].filter(Boolean).join(" · ");

  return (
    <div
      className={`rounded-xl border border-stone-100 dark:border-stone-700/50 border-l-2 ${c.border} ${c.bg} px-3 py-2.5 space-y-2`}>
      {/* Optional address label (e.g. "Home", "Default address") */}
      {label && (
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
          {label}
        </p>
      )}

      {/* Region — highest level, shown as a subdued uppercase tag */}
      {region && (
        <div className="flex items-center gap-1.5">
          <Building size={9} className={`shrink-0 ${c.icon}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {region}
          </span>
        </div>
      )}

      {/* Mid-level: city + district */}
      {midLine && (
        <div className="flex items-center gap-1.5">
          <Navigation size={9} className={`shrink-0 ${c.icon}`} />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 truncate">
            {midLine}
          </span>
        </div>
      )}

      {/* Most specific: street / locality */}
      {specificLine && (
        <div className="flex items-center gap-1.5 pl-4.25">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
            {specificLine}
          </span>
        </div>
      )}

      {/* Nearby landmark */}
      {nearbyLandmark && (
        <div className="flex items-center gap-1.5 pl-4.25">
          <span className="text-[10px] text-stone-400 dark:text-stone-500 italic truncate">
            Near {nearbyLandmark}
          </span>
        </div>
      )}

      {/* Ghana Post GPS code — visually separated, monospace */}
      {ghanaPostGPS && (
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-stone-100 dark:border-stone-700/40">
          <LocateFixed size={9} className={`shrink-0 ${c.icon}`} />
          <span
            className={`text-[10px] font-mono font-bold tracking-wide border rounded px-1.5 py-0.5 ${c.gps}`}>
            {ghanaPostGPS}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Provider Panel ───────────────────────────────────────────────────────────

function ProviderPanel() {
  const { data: profile, loading } = useMyProviderProfile();

  if (loading) return <CardSkeleton />;
  if (!profile) return null;

  // `contactInfo.mainContact` maps to the primary phone number per ProviderProfile
  const phone = profile.contactInfo?.mainContact;
  const email = profile.contactInfo?.businessEmail;

  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600/60 hover:shadow-md transition-all duration-200">
      <div className="h-0.5 bg-linear-to-r from-sky-400 via-amber-400 to-orange-400" />

      <div className="p-4 space-y-3">
        <LocationBlock loc={profile.locationData ?? null} accentColor="sky" />

        {profile.isAlwaysAvailable && (
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-full px-2 py-0.5">
              <Clock size={8} /> Always available
            </span>
          </div>
        )}

        {(phone || email) && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-stone-50 dark:border-stone-800">
            {phone && (
              <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
                <Phone size={9} className="shrink-0" />
                {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 min-w-0">
                <Mail size={9} className="shrink-0" />
                <span className="truncate max-w-44">{email}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function locationDisplayLabel(loc: Location): string {
  if (loc.customLabel) return loc.customLabel;
  const map: Record<string, string> = {
    HOME: "Home",
    WORK: "Work",
    SCHOOL: "School",
    OTHER: "Other",
  };
  return map[loc.label] ?? loc.label;
}

// ─── Client Panel ─────────────────────────────────────────────────────────────

function geoDistKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ClientPanel() {
  const { locations, defaultLocation, isLoadingLocations } = useClientPreference();
  const { state: geoState, permission: geoPerm, requestLocation } = useGeolocation();

  // Auto-request GPS once if permission is already granted
  const autoRequestedRef = useRef(false);
  useEffect(() => {
    if (geoPerm === "granted" && !autoRequestedRef.current) {
      autoRequestedRef.current = true;
      requestLocation();
    }
  }, [geoPerm, requestLocation]);

  if (isLoadingLocations) return <CardSkeleton />;

  // Pick the saved location closest to the current GPS fix, falling back to the
  // default or first saved location when GPS is unavailable.
  const closestLocation: Location | null = (() => {
    if (!locations.length) return null;
    if (geoState.status === "captured") {
      const withCoords = locations.filter(
        (l) => l.address.gpsCoordinates?.latitude !== undefined,
      );
      if (withCoords.length > 0) {
        return withCoords.reduce((best, loc) => {
          const d = (l: Location) => {
            const c = l.address.gpsCoordinates!;
            return geoDistKm(
              geoState.coords.latitude, geoState.coords.longitude,
              c.latitude, c.longitude,
            );
          };
          return d(loc) < d(best) ? loc : best;
        });
      }
    }
    return defaultLocation ?? locations[0];
  })();

  const hasSavedLocations = locations.length > 0;

  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:shadow-md transition-all duration-200">
      <div className="h-0.5 bg-linear-to-r from-emerald-400 via-amber-400 to-orange-400" />

      <div className="p-4 space-y-3">
        {hasSavedLocations && closestLocation ? (
          <>
            <LocationBlock
              loc={closestLocation.address}
              accentColor="emerald"
              label={locationDisplayLabel(closestLocation)}
            /></>
        ) : (
          /* No saved locations — GPS fallback */
          <>
            {geoState.status === "idle" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700">
                <MapPin
                  size={11}
                  className="text-stone-300 dark:text-stone-600 shrink-0"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 flex-1 italic">
                  {geoPerm === "denied"
                    ? "Location blocked in browser"
                    : "No saved locations"}
                </p>
                {geoPerm !== "denied" && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shrink-0">
                    Detect
                  </button>
                )}
              </div>
            )}

            {geoState.status === "acquiring" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                <Loader2
                  size={11}
                  className="animate-spin text-emerald-400 shrink-0"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Detecting location…
                </p>
              </div>
            )}

            {geoState.status === "captured" && (
              <div className="rounded-xl border border-stone-100 dark:border-stone-700/50 border-l-2 border-l-emerald-400 dark:border-l-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-900/10 px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <LocateFixed
                    size={9}
                    className="shrink-0 text-emerald-400 dark:text-emerald-500"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Current Location
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 border-t border-stone-100 dark:border-stone-700/40">
                  <span className="text-[10px] font-mono font-bold tracking-wide border rounded px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                    {geoState.coords.latitude.toFixed(5)},{" "}
                    {geoState.coords.longitude.toFixed(5)}
                  </span>
                </div>
              </div>
            )}

            {geoState.status === "error" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-dashed border-red-200 dark:border-red-800/50">
                <AlertCircle
                  size={11}
                  className="text-red-400 dark:text-red-500 shrink-0"
                />
                <p className="text-xs text-red-500 dark:text-red-400 flex-1">
                  {geoState.message}
                </p>
                {geoPerm !== "denied" && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="text-[10px] font-semibold text-red-500 dark:text-red-400 hover:text-red-600 transition-colors shrink-0">
                    Retry
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CurrentUserCard() {
  const { profile, loading } = useProfile();

  if (loading.profile || loading.exists) return <CardSkeleton />;
  if (!profile) return null;

  const { role } = profile;

  if (role === UserRole.PROVIDER) return <ProviderPanel />;
  if (role === UserRole.CUSTOMER) return <ClientPanel />;

  return null;
}
