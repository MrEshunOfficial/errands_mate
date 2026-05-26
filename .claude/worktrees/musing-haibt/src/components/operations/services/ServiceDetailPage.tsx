"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Share2,
  ArrowLeft,
  AlertCircle,
  Layers,
  BadgePercent,
  CalendarDays,
  Info,
  MapPin,
  ShieldCheck,
  Building2,
  Clock,
  Star,
  Wallet,
  CheckCircle2,
  CalendarClock,
  Tag,
  ChevronRight,
  Wifi,
  WifiOff,
  Navigation,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

import { useServiceBySlug } from "@/hooks/services/useServices";
import { ServicePricing, Service } from "@/types/services/service.types";
import { Category } from "@/types/services/categories/service.category.types";
import { IFile } from "@/types/files.types";

interface ProviderLocationData {
  ghanaPostGPS?: string;
  region?: string;
  city?: string;
  district?: string;
  locality?: string;
  isAddressVerified?: boolean;
  gpsCoordinates?: { latitude: number; longitude: number };
}

interface WorkingHourSchedule {
  start: string;
  end: string;
}

type WorkingHours = Record<string, WorkingHourSchedule>;

interface PopulatedProvider {
  _id: string;
  businessName?: string;
  profile?: {
    // ← add this
    contactInfo?: {
      mainContact?: string | null;
      additionalContact?: string | null;
      businessEmail?: string | null;
    } | null;
  } | null;
  contactInfo?: {
    // keep for backwards safety
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
  serviceOfferings?: Service[]; // ← was serviceOffered
  status?: string;
}
// =============================================================================
// Helpers
// =============================================================================

const GRID_START = 6;
const GRID_END = 23;
const GRID_SPAN = GRID_END - GRID_START;
const HOUR_LABELS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const mins = (h - GRID_START) * 60 + (m ?? 0);
  return Math.max(0, Math.min(100, (mins / (GRID_SPAN * 60)) * 100));
}

function nowToPercent(now: Date): number | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < GRID_START || h >= GRID_END) return null;
  const mins = (h - GRID_START) * 60 + m;
  return (mins / (GRID_SPAN * 60)) * 100;
}

function useNowPercent() {
  const [pct, setPct] = useState(() => nowToPercent(new Date()));
  useEffect(() => {
    const tick = () => setPct(nowToPercent(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return pct;
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function safeDistance(value: unknown): string {
  const d = safeDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

function safeFormat(value: unknown, fmt: string): string {
  const d = safeDate(value);
  return d ? format(d, fmt) : "—";
}

function getCoverImage(cover: unknown): { url?: string } | null {
  if (!cover) return null;
  if (typeof cover === "string") return { url: cover };
  if (typeof cover === "object" && cover !== null) {
    const c = cover as unknown as IFile;
    if (c.url) return { url: c.url };
  }
  return null;
}

function getCategoryName(category: unknown): string | null {
  if (!category) return null;
  if (typeof category === "string") return null;
  return (category as Category).catName ?? null;
}

function formatPrice(
  amount: number | null | undefined,
  currency: string = "GHS",
  compact = false,
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(amount);
}

function getBasePrice(pricing?: ServicePricing): number | null {
  if (!pricing) return null;
  if (pricing.basePrice != null) return pricing.basePrice;
  if (pricing.tiers?.length) return pricing.tiers[0].basePrice ?? null;
  return null;
}

function getPopulatedProvider(providerId: unknown): PopulatedProvider | null {
  if (!providerId || typeof providerId === "string") return null;
  return providerId as PopulatedProvider;
}

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

const DAY_SHORT: Record<Day, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
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
  const slot = hours[today];
  if (!slot) return false;
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return cur >= slot.start && cur <= slot.end;
}

/** Haversine distance in km */
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
// Design tokens / shared class strings
// =============================================================================

const CARD_BASE =
  "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

const SECTION_LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500";

// =============================================================================
// Primitives
// =============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={`${SECTION_LABEL} mb-3`}>{children}</p>;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${CARD_BASE} p-5 sm:p-6 ${className}`}>{children}</div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 dark:bg-gray-800" />;
}

type BadgeVariant = "green" | "blue" | "violet" | "amber" | "red" | "gray";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
  blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800",
  violet:
    "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-800",
  amber:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800",
  red: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800",
  gray: "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

function TrustBadge({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  variant: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${BADGE_STYLES[variant]}`}>
      <span className="w-3 h-3 flex items-center justify-center">{icon}</span>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5">
      <p className={`${SECTION_LABEL} mb-0.5`}>{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 wrap-break-word">
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// Live Status Hook
// =============================================================================

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
    const open = isCurrentlyOpen(
      provider.workingHours,
      provider.isAlwaysAvailable,
    );
    if (open) {
      const today = todayDayName();
      const slot = provider.workingHours?.[today];
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
      if (provider.workingHours?.[day]) {
        const slot = provider.workingHours[day];
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

  const [status, setStatus] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => setStatus(compute()), 60_000);
    return () => clearInterval(id);
  }, [compute]);

  return status;
}

// =============================================================================
// GPS Distance Hook
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

    // Defer all setState calls to avoid synchronous updates inside the effect body
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
// Hero
// =============================================================================

function ServiceHero({
  service,
  categoryName,
  coverImage,
}: {
  service: Service;
  categoryName: string | null;
  coverImage: { url?: string } | null;
}) {
  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-950 rounded-none">
      {coverImage?.url ? (
        <Image
          src={coverImage.url}
          alt={service.title}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-gray-900 to-gray-950 flex items-center justify-center">
          <Package className="w-20 h-20 text-gray-800" />
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
        {categoryName && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-300 bg-blue-500/15 border border-blue-400/25 rounded-full px-3 py-1 mb-3">
            <Package size={10} />
            {categoryName}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white leading-tight tracking-tight max-w-2xl">
          {service.title}
        </h1>
        <div className="flex flex-wrap gap-3 sm:gap-5 mt-3">
          <span className="text-xs text-white/40 flex items-center gap-1.5">
            <CalendarDays size={11} />
            Listed {safeDistance(service.createdAt)}
          </span>
          {service.updatedAt && (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <CalendarClock size={11} />
              Updated {safeDistance(service.updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Description Card
// =============================================================================

function DescriptionCard({ description }: { description?: string }) {
  return (
    <Card>
      <CardHeader icon={<Info size={13} />} title="About this service" />
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {description || "No description provided."}
      </p>
    </Card>
  );
}

// =============================================================================
// Tags Card
// =============================================================================

function TagsCard({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <Card>
      <CardHeader icon={<Tag size={13} />} title="Tags" />
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium border border-gray-100 dark:border-gray-700">
            #{tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Tiers Card
// =============================================================================

function TiersCard({
  tiers,
  currency,
}: {
  tiers: NonNullable<ServicePricing["tiers"]>;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader icon={<Layers size={13} />} title="Packages" />
      <div className="grid sm:grid-cols-2 gap-3">
        {tiers.map((tier, i) => (
          <div
            key={tier.tierId}
            className={`rounded-xl p-4 border transition-colors ${
              i === 0
                ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20"
            }`}>
            {i === 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 mb-2">
                Most popular
              </p>
            )}
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {tier.label}
              </p>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                {formatPrice(tier.basePrice, currency, true)}
              </p>
            </div>
            {tier.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {tier.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Additional Fees Card
// =============================================================================

function AdditionalFeesCard({
  fees,
  currency,
}: {
  fees: NonNullable<ServicePricing["additionalFees"]>;
  currency: string;
}) {
  if (!fees.length) return null;
  return (
    <Card>
      <CardHeader icon={<BadgePercent size={13} />} title="Additional fees" />
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {fees.map((fee, i) => (
          <div
            key={i}
            className={`flex justify-between items-center py-2.5 px-3 gap-3 ${
              i !== fees.length - 1
                ? "border-b border-gray-50 dark:border-gray-800/80"
                : ""
            }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  fee.isOptional
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
                }`}>
                {fee.isOptional ? "Optional" : "Required"}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {fee.label}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums shrink-0">
              {formatPrice(fee.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Service Info Card
// =============================================================================

function ServiceInfoCard({ service }: { service: Service }) {
  return (
    <Card>
      <CardHeader icon={<CalendarDays size={13} />} title="Service info" />
      <dl className="w-full flex flex-col gap-2">
        <div>
          <dt className={`${SECTION_LABEL} mb-1`}>Published</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {safeDistance(service.createdAt)}
          </dd>
        </div>
        <div>
          <dt className={`${SECTION_LABEL} mb-1`}>Last updated</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {safeDistance(service.updatedAt)}
          </dd>
        </div>
        {service.approvedAt && (
          <div>
            <dt className={`${SECTION_LABEL} mb-1`}>Approved</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {safeFormat(service.approvedAt, "MMM d, yyyy")}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

// =============================================================================
// Pricing Panel
// =============================================================================

function PricingPanel({
  pricing,
  onShare,
  onRequest,
  hasProvider,
}: {
  pricing?: ServicePricing;
  onShare: () => void;
  onRequest: () => void;
  hasProvider: boolean;
}) {
  const basePrice = getBasePrice(pricing);
  const currency = pricing?.currency ?? "GHS";
  const hasTiers = !!pricing?.tiers?.length;

  return (
    <div className={`${CARD_BASE} overflow-hidden`}>
      <div className="bg-gray-950 dark:bg-black px-5 sm:px-6 py-6">
        {basePrice != null ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {hasTiers ? "Starting from" : "Service price"}
            </p>
            <p className="text-4xl sm:text-[42px] font-semibold tracking-tight leading-none tabular-nums text-white">
              {formatPrice(basePrice, currency)}
            </p>
            {pricing?.unit && (
              <p className="text-xs text-gray-400 mt-2">per {pricing.unit}</p>
            )}
            {pricing?.taxIncluded && (
              <div className="flex items-center gap-1.5 mt-3">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-xs text-emerald-500 font-medium">
                  All taxes included
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xl font-semibold text-white">Price on request</p>
        )}
      </div>

      <div className="px-5 sm:px-6 py-4 space-y-2.5">
        {hasProvider && (
          <Button
            onClick={onRequest}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-xl shadow-none transition-colors">
            Request this Provider
          </Button>
        )}
        <Button
          onClick={onShare}
          variant="outline"
          className="w-full h-9 text-xs font-medium rounded-xl gap-2 border-gray-200 dark:border-gray-700">
          <Share2 size={13} />
          Share this service
        </Button>
      </div>

      {pricing?.pricingNotes && (
        <>
          <Divider />
          <p className="px-5 sm:px-6 py-4 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {pricing.pricingNotes}
          </p>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Provider Weekly Schedule (time-grid calendar — matches AvailabilityCard)
// =============================================================================

function ProviderSchedule({
  workingHours,
  isAlwaysAvailable,
}: {
  workingHours?: WorkingHours;
  isAlwaysAvailable?: boolean;
}) {
  const nowPct = useNowPercent();
  const todayIdx = ALL_DAYS.indexOf(todayDayName());
  const wh = workingHours ?? {};
  const isAlways = !!isAlwaysAvailable;

  // ── Status strip ──────────────────────────────────────────────────────────
  const isOpen = isCurrentlyOpen(workingHours, isAlwaysAvailable);
  const activeDays = isAlways ? 7 : Object.keys(wh).length;
  const todayDay = ALL_DAYS[todayIdx];
  const todaySlot = isAlways ? null : wh[todayDay];

  const statusLabel = (() => {
    if (isAlways) return "Always open";
    if (!todaySlot) return "Closed today";
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return cur >= todaySlot.start && cur <= todaySlot.end
      ? `Open until ${fmt12(todaySlot.end)}`
      : `Opens ${fmt12(todaySlot.start)}`;
  })();

  if (isAlways) {
    return (
      <div className="space-y-3">
        {/* Status strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Always open
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Wifi size={12} />
            Available 24 / 7
          </span>
        </div>
        {/* Placeholder grid for always-available */}
        <div className="flex gap-0">
          <div className="relative w-10 shrink-0" style={{ height: 200 }}>
            {HOUR_LABELS.map((h) => {
              const top = ((h - GRID_START) / GRID_SPAN) * 100;
              return (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-gray-400 dark:text-gray-500 font-medium"
                  style={{ top: `${top}%` }}>
                  {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              );
            })}
          </div>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {ALL_DAYS.map((day, idx) => {
              const isToday = idx === todayIdx;
              return (
                <div key={day} className="flex flex-col gap-1">
                  <div
                    className={`text-center py-1 rounded-md text-[10px] font-bold tracking-wide ${
                      isToday
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}>
                    <span className="hidden sm:block">
                      {DAY_ABBR[day].slice(0, 2)}
                    </span>
                    <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  </div>
                  <div
                    className={`relative rounded-lg overflow-hidden ${
                      isToday
                        ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-800"
                        : "bg-gray-50 dark:bg-gray-800/40"
                    }`}
                    style={{ height: 200 }}>
                    {HOUR_LABELS.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-gray-200/60 dark:border-gray-700/40"
                        style={{
                          top: `${((h - GRID_START) / GRID_SPAN) * 100}%`,
                        }}
                      />
                    ))}
                    {/* Full-height emerald block */}
                    <div className="absolute left-0.5 right-0.5 top-0.5 bottom-0.5 rounded-md bg-emerald-400/70 dark:bg-emerald-700/70" />
                    {isToday && nowPct !== null && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${nowPct}%` }}>
                        <div className="relative flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-0.5 shadow-sm shadow-red-500/50" />
                          <div className="flex-1 h-px bg-red-500/80" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" />
            Working hours
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="w-3 h-0.5 bg-red-500 inline-block" />
            Current time
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Today
          </span>
        </div>
      </div>
    );
  }

  if (!workingHours || Object.keys(workingHours).length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <WifiOff size={13} />
        No schedule configured
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
              isOpen
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {statusLabel}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {activeDays}d / wk
          </span>
          {todaySlot && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {fmt12(todaySlot.start)} – {fmt12(todaySlot.end)}
            </span>
          )}
        </div>
      </div>

      {/* ── Time-grid calendar ── */}
      <div className="flex gap-0">
        {/* Hour ruler */}
        <div className="relative w-10 shrink-0" style={{ height: 200 }}>
          {HOUR_LABELS.map((h) => {
            const top = ((h - GRID_START) / GRID_SPAN) * 100;
            return (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-gray-400 dark:text-gray-500 font-medium"
                style={{ top: `${top}%` }}>
                {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {ALL_DAYS.map((day, idx) => {
            const slot = wh[day];
            const isToday = idx === todayIdx;
            const isOpenNow =
              isToday && isCurrentlyOpen(workingHours, isAlwaysAvailable);

            return (
              <div key={day} className="flex flex-col gap-1">
                {/* Day label */}
                <div
                  className={`text-center py-1 rounded-md text-[10px] font-bold tracking-wide transition-colors ${
                    isToday
                      ? "bg-emerald-500 text-white"
                      : slot
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : "text-gray-300 dark:text-gray-600"
                  }`}>
                  <span className="hidden sm:block">
                    {DAY_ABBR[day].slice(0, 2)}
                  </span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                </div>

                {/* Time column */}
                <div
                  className={`relative rounded-lg overflow-hidden ${
                    isToday
                      ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-800"
                      : "bg-gray-50 dark:bg-gray-800/40"
                  }`}
                  style={{ height: 200 }}>
                  {/* Hour grid lines */}
                  {HOUR_LABELS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-200/60 dark:border-gray-700/40"
                      style={{
                        top: `${((h - GRID_START) / GRID_SPAN) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Working-hours block */}
                  {slot &&
                    (() => {
                      const top = timeToPercent(slot.start);
                      const bot = timeToPercent(slot.end);
                      const height = bot - top;
                      return (
                        <div
                          className={`absolute left-0.5 right-0.5 rounded-md ${
                            isOpenNow
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : isToday
                                ? "bg-emerald-500 dark:bg-emerald-600"
                                : "bg-emerald-400/70 dark:bg-emerald-700/70"
                          }`}
                          style={{ top: `${top}%`, height: `${height}%` }}>
                          {height > 14 && (
                            <span className="absolute top-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/90 leading-none">
                              {slot.start}
                            </span>
                          )}
                          {height > 18 && (
                            <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80 leading-none">
                              {slot.end}
                            </span>
                          )}
                          {isOpenNow && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                          )}
                        </div>
                      );
                    })()}

                  {/* Live "now" needle — only on today */}
                  {isToday && nowPct !== null && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: `${nowPct}%` }}>
                      <div className="relative flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-0.5 shadow-sm shadow-red-500/50" />
                        <div className="flex-1 h-px bg-red-500/80" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" />
          Working hours
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="w-3 h-0.5 bg-red-500 inline-block" />
          Current time
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          Today
        </span>
      </div>
    </div>
  );
}
// =============================================================================
// Provider Location Distance Widget
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
      {/* Location identity */}
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

      {/* Distance badge */}
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

      {/* GhanaPost GPS */}
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

      {/* External map links */}
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
// Provider Panel (enhanced)
// =============================================================================

function ProviderPanel({
  provider,
  onRequest,
}: {
  provider: PopulatedProvider;
  onRequest: () => void;
}) {
  const router = useRouter();
  const loc = provider.locationData;
  const liveStatus = useLiveStatus(provider);

  const locationLine = [loc?.locality, loc?.city, loc?.region]
    .filter(Boolean)
    .join(", ");

  // Contact lives under provider.profile.contactInfo in the API response
  const contact = provider.profile?.contactInfo ?? provider.contactInfo;

  // Fix service count too
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
            {/* Live status dot */}
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${liveStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
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
            <ProviderSchedule
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
      <Divider />
      <div className="px-5 sm:px-6 py-4">
        <Button
          onClick={()=>(router.push(`/requests/provider/${provider._id}`))}
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
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data, isLoading, error, refetch } = useServiceBySlug(slug, true);

  console.log(data);

  const serviceRaw = data?.service ?? data;
  const service = serviceRaw as Service | null;

  if (isLoading)
    return <LoadingOverlay message="Fetching service details…" show />;

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load service"}
        onBack={() => router.push("/services")}
        onRetry={refetch}
      />
    );
  }

  if (!service?.title) {
    return (
      <ErrorState
        message="This service doesn't exist or has been removed."
        onBack={() => router.push("/services")}
        onRetry={refetch}
        notFound
      />
    );
  }

  const coverImage = getCoverImage(service.coverImage);
  const categoryName = getCategoryName(service.categoryId);
  const pricing = service.servicePricing;
  const hasTiers = !!pricing?.tiers?.length;
  const currency = pricing?.currency ?? "GHS";
  const provider = getPopulatedProvider(service.providerId);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: service.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleRequest = (providerId: string) => {
    router.push(`/requests/provider/${providerId}`);
  };

  return (
    <main className="h-full overflow-auto ">
      {/* ── Hero ── */}
      <ServiceHero
        service={service}
        categoryName={categoryName}
        coverImage={coverImage}
      />

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
          {/* ── Left: main content ── */}
          <div className="space-y-4 min-w-0">
            <PricingPanel
              pricing={pricing}
              onShare={handleShare}
              onRequest={() => handleRequest(provider?._id ?? "")}
              hasProvider={!!provider}
            />
            {provider && (
              <ProviderPanel
                provider={provider}
                onRequest={() => router.push(`/providers/${provider._id}`)}
              />
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <DescriptionCard description={service.description} />
            {service.tags?.length ? <TagsCard tags={service.tags} /> : null}
            {hasTiers && pricing?.tiers && (
              <TiersCard tiers={pricing.tiers} currency={currency} />
            )}
            {pricing?.additionalFees?.length ? (
              <AdditionalFeesCard
                fees={pricing.additionalFees}
                currency={currency}
              />
            ) : null}
            <ServiceInfoCard service={service} />
          </div>
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({
  message,
  onBack,
  onRetry,
  notFound = false,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
  notFound?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 mb-5">
          <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {notFound ? "Service not found" : "Something went wrong"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 h-9 text-sm border-gray-200 dark:border-gray-700">
            <ArrowLeft size={13} />
            Browse services
          </Button>
          {!notFound && (
            <Button
              onClick={onRetry}
              className="h-9 text-sm bg-blue-600 hover:bg-blue-700">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
