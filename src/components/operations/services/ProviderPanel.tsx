"use client";

// =============================================================================
// ProviderPanel.tsx
// Self-contained panel showing provider identity, schedule, location & contact.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Wifi,
  ShieldCheck,
  Star,
  Clock,
  Wallet,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  Navigation,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkingHours } from "@/types/provider.profile.types";
import { Service } from "@/types/services/service.types";
import {
  CARD_BASE,
  BADGE_STYLES,
  BadgeVariant,
  Divider,
  SectionLabel,
  TrustBadge,
  InfoRow,
} from "./service-ui-primitives";
import { WeeklyScheduleCalendar } from "../helpers/WeeklyScheduleCalendar";

// =============================================================================
// Types (local to this file — mirrors what ServiceDetailPage populates)
// =============================================================================

export interface ProviderLocationData {
  ghanaPostGPS?: string;
  region?: string;
  city?: string;
  district?: string;
  locality?: string;
  isAddressVerified?: boolean;
  gpsCoordinates?: { latitude: number; longitude: number };
}

export interface PopulatedProvider {
  _id: string;
  businessName?: string;
  profile?: {
    contactInfo?: {
      mainContact?: string | null;
      additionalContact?: string | null;
      businessEmail?: string | null;
    } | null;
  } | null;
  /** Kept for backwards-compat with older API responses */
  contactInfo?: {
    mainContact?: string | null;
    additionalContact?: string | null;
    businessEmail?: string | null;
  } | null;
  locationData?: ProviderLocationData;
  isAlwaysAvailable?: boolean;
  isCompanyTrained?: boolean;
  requireInitialDeposit?: boolean;
  percentageDeposit?: number;
  workingHours?: WorkingHours;
  serviceOfferings?: Service[];
  status?: string;
  ratingStats?: { average: number; count: number };
}

// =============================================================================
// Schedule helpers
// =============================================================================

const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Day = (typeof ALL_DAYS)[number];

const DAY_ABBR: Record<Day, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function todayDayName(): Day {
  const days: Day[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
}

function isCurrentlyOpen(
  hours?: WorkingHours,
  isAlwaysAvailable?: boolean,
): boolean {
  if (isAlwaysAvailable) return true;
  if (!hours) return false;
  const today = todayDayName();
  const slot = (hours as Record<string, { start: string; end: string }>)[today];
  if (!slot) return false;
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return cur >= slot.start && cur <= slot.end;
}


function useLiveStatus(provider: PopulatedProvider) {
  const compute = useCallback(() => {
    const status = provider.status?.toLowerCase();
    if (status === "booked") {
      return {
        isOpen: false,
        label: "Currently Booked",
        variant: "amber" as BadgeVariant,
        dot: "bg-amber-500",
      };
    }
    if (status === "closed") {
      return {
        isOpen: false,
        label: "Closed",
        variant: "red" as BadgeVariant,
        dot: "bg-red-500",
      };
    }
    if (provider.isAlwaysAvailable) {
      return {
        isOpen: true,
        label: "Always Available",
        variant: "green" as BadgeVariant,
        dot: "bg-emerald-500 animate-pulse",
      };
    }

    const wh = provider.workingHours as
      | Record<string, { start: string; end: string }>
      | undefined;
    const open = isCurrentlyOpen(
      provider.workingHours,
      provider.isAlwaysAvailable,
    );

    if (open) {
      const today = todayDayName();
      const slot = wh?.[today];
      return {
        isOpen: true,
        label: slot ? `Open until ${fmt12(slot.end)}` : "Open Now",
        variant: "green" as BadgeVariant,
        dot: "bg-emerald-500 animate-pulse",
      };
    }

    // Find next open day
    const todayIdx = ALL_DAYS.indexOf(todayDayName());
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7;
      const day = ALL_DAYS[idx];
      const slot = wh?.[day];
      if (slot) {
        const label =
          i === 1
            ? `Opens tomorrow ${fmt12(slot.start)}`
            : `Opens ${DAY_ABBR[day]}`;
        return {
          isOpen: false,
          label,
          variant: "gray" as BadgeVariant,
          dot: "bg-gray-400",
        };
      }
    }

    return {
      isOpen: false,
      label: "Closed Today",
      variant: "gray" as BadgeVariant,
      dot: "bg-gray-400",
    };
  }, [provider]);

  // Initialise directly from `compute` so the effect never needs a synchronous setState.
  const [status, setStatus] = useState(compute);

  // Re-sync whenever `compute` identity changes (i.e. provider prop changed),
  // then keep ticking every minute. All setState calls happen asynchronously
  // inside callbacks — never synchronously in the effect body.
  useEffect(() => {
    const id = setInterval(() => setStatus(compute()), 60_000);
    return () => clearInterval(id);
  }, [compute]);

  // When the provider changes, `compute` gets a new reference and the interval
  // above restarts, but we also need to update immediately. We do that through
  // a separate effect that uses the functional updater so it's treated as an
  // external-system sync rather than a cascading render.
  useEffect(() => {
    setStatus(compute());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); // intentionally depend on provider, not compute

  return status;
}

// =============================================================================
// GPS distance hook
// =============================================================================

interface GpsState {
  distanceKm: number | null;
  loading: boolean;
  error: string | null;
}

function useDistanceToProvider(providerCoords?: {
  latitude: number;
  longitude: number;
}): GpsState {
  const [state, setState] = useState<GpsState>({
    distanceKm: null,
    loading: false,
    error: null,
  });

  const lat = providerCoords?.latitude;
  const lng = providerCoords?.longitude;

  useEffect(() => {
    if (lat == null || lng == null) return;

    let cancelled = false;
    const setAsync = (next: GpsState) => {
      Promise.resolve().then(() => {
        if (!cancelled) setState(next);
      });
    };

    if (!navigator.geolocation) {
      setAsync({
        distanceKm: null,
        loading: false,
        error: "Geolocation not supported",
      });
      return;
    }

    setAsync({ distanceKm: null, loading: true, error: null });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(
          pos.coords.latitude,
          pos.coords.longitude,
          lat,
          lng,
        );
        if (!cancelled)
          setState({ distanceKm: km, loading: false, error: null });
      },
      () => {
        if (!cancelled)
          setState({
            distanceKm: null,
            loading: false,
            error: "Location access denied",
          });
      },
      { timeout: 8000, maximumAge: 300_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return state;
}

// =============================================================================
// Haversine
// =============================================================================

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

// =============================================================================
// ProviderLocationWidget
// =============================================================================

function ProviderLocationWidget({
  locationData,
}: {
  locationData?: ProviderLocationData;
}) {
  const { distanceKm, loading, error } = useDistanceToProvider(
    locationData?.gpsCoordinates,
  );

  const locationLine = [
    locationData?.locality,
    locationData?.city,
    locationData?.region,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsLink = locationData?.gpsCoordinates
    ? `https://www.openstreetmap.org/?mlat=${locationData.gpsCoordinates.latitude}&mlon=${locationData.gpsCoordinates.longitude}#map=16/${locationData.gpsCoordinates.latitude}/${locationData.gpsCoordinates.longitude}`
    : null;

  const ghanaPostLink = locationData?.ghanaPostGPS
    ? `https://map.ghanapostgps.com/map/${locationData.ghanaPostGPS}`
    : null;

  return (
    <div className="space-y-3">
      {locationLine && (
        <div className="flex items-start gap-2.5">
          <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
              {locationLine}
            </p>
            {locationData?.district && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {locationData.district}
              </p>
            )}
          </div>
        </div>
      )}

      {locationData?.gpsCoordinates && (
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              distanceKm !== null
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
            <Navigation size={11} className="shrink-0" />
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" /> Getting distance…
              </span>
            ) : distanceKm !== null ? (
              formatDistanceKm(distanceKm)
            ) : error ? (
              "Distance unavailable"
            ) : (
              "Calculating distance…"
            )}
          </div>
        </div>
      )}

      {locationData?.ghanaPostGPS && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            GPS Code
          </span>
          <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 tracking-wider">
            {locationData.ghanaPostGPS}
          </span>
        </div>
      )}

      {(mapsLink || ghanaPostLink) && (
        <div className="flex items-center gap-3">
          {ghanaPostLink && (
            <a
              href={ghanaPostLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
              Ghana Post Map
              <ExternalLink size={10} />
            </a>
          )}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Open in Map
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ProviderSchedule
// =============================================================================

// function ProviderSchedule({
//   workingHours,
//   isAlwaysAvailable,
// }: {
//   workingHours?: WorkingHours;
//   isAlwaysAvailable?: boolean;
// }) {
//   const nowPct = useNowPercent();
//   const todayIdx = ALL_DAYS.indexOf(todayDayName());
//   const wh = (workingHours ?? {}) as Record<
//     string,
//     { start: string; end: string }
//   >;
//   const isAlways = !!isAlwaysAvailable;
//   const isOpen = isCurrentlyOpen(workingHours, isAlwaysAvailable);
//   const activeDays = isAlways ? 7 : Object.keys(wh).length;
//   const todayDay = ALL_DAYS[todayIdx];
//   const todaySlot = isAlways ? null : wh[todayDay];

//   const statusLabel = (() => {
//     if (isAlways) return "Always open";
//     if (!todaySlot) return "Closed today";
//     const now = new Date();
//     const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
//     return cur >= todaySlot.start && cur <= todaySlot.end
//       ? `Open until ${fmt12(todaySlot.end)}`
//       : `Opens ${fmt12(todaySlot.start)}`;
//   })();

//   const legend = (
//     <div className="flex items-center gap-4 flex-wrap">
//       <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
//         <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" />
//         Working hours
//       </span>
//       <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
//         <span className="w-3 h-0.5 bg-red-500 inline-block" />
//         Current time
//       </span>
//       <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
//         <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
//         Today
//       </span>
//     </div>
//   );

//   if (!workingHours || Object.keys(workingHours).length === 0) {
//     if (!isAlways) {
//       return (
//         <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
//           <WifiOff size={13} />
//           No schedule configured
//         </div>
//       );
//     }
//   }

//   return (
//     <div className="space-y-3">
//       {/* Status strip */}
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div className="flex items-center gap-2.5">
//           <div
//             className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
//               isOpen || isAlways
//                 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
//                 : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
//             }`}>
//             <span
//               className={`w-1.5 h-1.5 rounded-full ${
//                 isOpen || isAlways
//                   ? "bg-emerald-500 animate-pulse"
//                   : "bg-gray-400"
//               }`}
//             />
//             {statusLabel}
//           </div>
//           {!isAlways && (
//             <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
//               <Clock size={10} />
//               {new Date().toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-3">
//           {!isAlways && (
//             <>
//               <span className="text-xs text-gray-400 dark:text-gray-500">
//                 {activeDays}d / wk
//               </span>
//               {todaySlot && (
//                 <span className="text-xs text-gray-400 dark:text-gray-500">
//                   {fmt12(todaySlot.start)} – {fmt12(todaySlot.end)}
//                 </span>
//               )}
//             </>
//           )}
//           {isAlways && (
//             <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
//               <Wifi size={12} />
//               Available 24 / 7
//             </span>
//           )}
//         </div>
//       </div>

//       {/* Time-grid calendar */}
//       <div className="flex gap-0">
//         {/* Hour ruler */}
//         <div className="relative w-10 shrink-0" style={{ height: 200 }}>
//           {HOUR_LABELS.map((h) => {
//             const top = ((h - GRID_START) / GRID_SPAN) * 100;
//             return (
//               <div
//                 key={h}
//                 className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-gray-400 dark:text-gray-500 font-medium"
//                 style={{ top: `${top}%` }}>
//                 {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
//               </div>
//             );
//           })}
//         </div>

//         {/* Day columns */}
//         <div className="flex-1 grid grid-cols-7 gap-1">
//           {ALL_DAYS.map((day, idx) => {
//             const slot = isAlways ? { start: "06:00", end: "23:00" } : wh[day];
//             const isToday = idx === todayIdx;
//             const isOpenNow =
//               isToday &&
//               (isAlways || isCurrentlyOpen(workingHours, isAlwaysAvailable));

//             return (
//               <div key={day} className="flex flex-col gap-1">
//                 {/* Day label */}
//                 <div
//                   className={`text-center py-1 rounded-md text-[10px] font-bold tracking-wide transition-colors ${
//                     isToday
//                       ? "bg-emerald-500 text-white"
//                       : slot
//                         ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
//                         : "text-gray-300 dark:text-gray-600"
//                   }`}>
//                   <span className="hidden sm:block">
//                     {DAY_ABBR[day].slice(0, 2)}
//                   </span>
//                   <span className="sm:hidden">{DAY_SHORT[day]}</span>
//                 </div>

//                 {/* Time column */}
//                 <div
//                   className={`relative rounded-lg overflow-hidden ${
//                     isToday
//                       ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-800"
//                       : "bg-gray-50 dark:bg-gray-800/40"
//                   }`}
//                   style={{ height: 200 }}>
//                   {/* Hour grid lines */}
//                   {HOUR_LABELS.map((h) => (
//                     <div
//                       key={h}
//                       className="absolute left-0 right-0 border-t border-gray-200/60 dark:border-gray-700/40"
//                       style={{
//                         top: `${((h - GRID_START) / GRID_SPAN) * 100}%`,
//                       }}
//                     />
//                   ))}

//                   {/* Working-hours block */}
//                   {slot &&
//                     (() => {
//                       const top = isAlways ? 0 : timeToPercent(slot.start);
//                       const bot = isAlways ? 100 : timeToPercent(slot.end);
//                       const height = bot - top;
//                       return (
//                         <div
//                           className={`absolute left-0.5 right-0.5 rounded-md ${
//                             isAlways ? "top-0.5 bottom-0.5" : ""
//                           } ${
//                             isOpenNow
//                               ? "bg-emerald-500 dark:bg-emerald-600"
//                               : isToday
//                                 ? "bg-emerald-500 dark:bg-emerald-600"
//                                 : "bg-emerald-400/70 dark:bg-emerald-700/70"
//                           }`}
//                           style={
//                             isAlways
//                               ? undefined
//                               : { top: `${top}%`, height: `${height}%` }
//                           }>
//                           {!isAlways && height > 14 && (
//                             <span className="absolute top-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/90 leading-none">
//                               {slot.start}
//                             </span>
//                           )}
//                           {!isAlways && height > 18 && (
//                             <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80 leading-none">
//                               {slot.end}
//                             </span>
//                           )}
//                           {isOpenNow && (
//                             <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
//                           )}
//                         </div>
//                       );
//                     })()}

//                   {/* Live "now" needle — only on today */}
//                   {isToday && nowPct !== null && (
//                     <div
//                       className="absolute left-0 right-0 z-10 pointer-events-none"
//                       style={{ top: `${nowPct}%` }}>
//                       <div className="relative flex items-center">
//                         <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-0.5 shadow-sm shadow-red-500/50" />
//                         <div className="flex-1 h-px bg-red-500/80" />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {legend}
//     </div>
//   );
// }

// =============================================================================
// ProviderPanel (default export)
// =============================================================================

export default function ProviderPanel({
  provider,
  onRequest,
  isCustomer,
}: {
  provider: PopulatedProvider;
  onRequest: () => void;
  isCustomer: boolean;
}) {
  const router = useRouter();
  const loc = provider.locationData;
  const liveStatus = useLiveStatus(provider);

  const locationLine = [loc?.locality, loc?.city, loc?.region]
    .filter(Boolean)
    .join(", ");

  // Contact lives under provider.profile.contactInfo in the API response
  const contact = provider.profile?.contactInfo ?? provider.contactInfo;

  const serviceCount = provider.serviceOfferings?.length ?? 0;
  const hasContact =
    contact &&
    (contact.mainContact || contact.additionalContact || contact.businessEmail);
  const hasSchedule =
    provider.isAlwaysAvailable ||
    (provider.workingHours && Object.keys(provider.workingHours).length > 0);
  const hasLocation =
    loc && (loc.locality || loc.city || loc.region || loc.ghanaPostGPS);

  const handleViewProvider = () => {
    router.push(`/providers/${provider._id}`);
  };

  return (
    <div className={`${CARD_BASE} overflow-hidden`}>
      {/* ── Identity ── */}
      <div className="px-5 sm:px-6 py-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
          About the Provider
        </p>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 relative">
            <Building2 size={18} className="text-white" />
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${
                liveStatus.isOpen
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {provider.businessName ?? "Provider"}
            </p>
            {locationLine && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {locationLine}
              </p>
            )}
            {(provider.ratingStats?.count ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {provider.ratingStats!.average.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  ({provider.ratingStats!.count})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live status pill */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${BADGE_STYLES[liveStatus.variant]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.dot}`} />
            {liveStatus.label}
            <Wifi size={9} className="opacity-60 ml-0.5" />
          </span>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-1.5">
          {loc?.isAddressVerified && (
            <TrustBadge
              icon={<ShieldCheck size={10} />}
              label="Verified"
              variant="green"
            />
          )}
          {provider.isCompanyTrained && (
            <TrustBadge
              icon={<Star size={10} />}
              label="Company trained"
              variant="blue"
            />
          )}
          {provider.isAlwaysAvailable && (
            <TrustBadge
              icon={<Clock size={10} />}
              label="Always available"
              variant="violet"
            />
          )}
          {provider.requireInitialDeposit &&
            provider.percentageDeposit != null && (
              <TrustBadge
                icon={<Wallet size={10} />}
                label={`${provider.percentageDeposit}% deposit`}
                variant="amber"
              />
            )}
        </div>
      </div>

      {/* ── Schedule ── */}
      {hasSchedule && (
        <>
          <Divider />
          <div className="px-5 sm:px-6 py-4">
            <SectionLabel>Schedule & Availability</SectionLabel>
            <WeeklyScheduleCalendar
              workingHours={provider.workingHours}
              isAlwaysAvailable={provider.isAlwaysAvailable}
            />
          </div>
        </>
      )}

      {/* ── Location & Distance ── */}
      {hasLocation && (
        <>
          <Divider />
          <div className="px-5 sm:px-6 py-4">
            <SectionLabel>Location & Distance</SectionLabel>
            <ProviderLocationWidget locationData={loc} />
          </div>
        </>
      )}

      {/* ── Contact ── */}
      {hasContact && (
        <>
          <Divider />
          <div className="px-5 sm:px-6 py-4">
            <SectionLabel>Contact</SectionLabel>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {contact?.mainContact && (
                <InfoRow label="Primary" value={contact.mainContact} />
              )}
              {contact?.additionalContact && (
                <InfoRow label="Secondary" value={contact.additionalContact} />
              )}
              {contact?.businessEmail && (
                <InfoRow label="Email" value={contact.businessEmail} />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── View all services from this provider ── */}
      {serviceCount > 0 && (
        <>
          <Divider />
          <div className="px-5 sm:px-6 py-4">
            <button
              onClick={handleViewProvider}
              className="w-full flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all group">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                  <Layers
                    size={12}
                    className="text-blue-500 dark:text-blue-400"
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    View all services
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {serviceCount} service{serviceCount !== 1 ? "s" : ""}{" "}
                    offered
                  </p>
                </div>
              </div>
              <ChevronRight
                size={14}
                className="text-gray-300 dark:text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          </div>
        </>
      )}

      {/* ── View Provider Profile link ── */}
      <Divider />
      <div className="px-5 sm:px-6 py-3">
        <button
          onClick={handleViewProvider}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-colors">
          View Provider Details
          <ExternalLink size={11} />
        </button>
      </div>

      {/* ── CTA ── */}
      {isCustomer && (
        <>
          <Divider />
          <div className="px-5 sm:px-6 py-4">
            <Button
              onClick={onRequest}
              disabled={provider.status?.toLowerCase() === "booked"}
              className={`w-full h-10 text-sm font-medium rounded-xl shadow-none transition-colors ${
                provider.status?.toLowerCase() === "booked"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {provider.status?.toLowerCase() === "booked"
                ? "Provider Currently Booked"
                : "Request this provider"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
