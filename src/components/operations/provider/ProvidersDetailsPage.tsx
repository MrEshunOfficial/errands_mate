"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Layers,
  Shield,
  AlertCircle,
  Home,
  Users,
  ChevronRight,
  ExternalLink,
  Navigation,
  Loader2,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Landmark,
  Globe,
  User,
  Hash,
  Map,
  List,
  Images,
  Send,
  Wifi,
  Star,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import type {
  PopulatedProviderProfile,
  WorkingHours,
  PopulatedUserProfile,
  ProviderStatus,
} from "@/types/provider.profile.types";
import type { UserLocation } from "@/types/location.types";
import type { Service } from "@/types/services/service.types";
import type { PopulatedProfilePicture } from "@/types/core.user.profile.types";
import {
  useProviderProfile,
  useServiceOfferings,
} from "@/hooks/profiles/useProviderProfile";
import { profilePictureAPI } from "@/lib/api/files/profile/profile-picture.api";
import type { IFile } from "@/types/files.types";
import { WeeklyScheduleCalendar } from "../helpers/WeeklyScheduleCalendar";
import { useGeolocation } from "@/hooks/profiles/useGeolocation";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { UserRole } from "@/types/base.types";
import { useProviderReviews } from "@/hooks/reviews/useReviews";
import type { Review } from "@/types/review.types";

// ─── Runtime shape ──────────────────────────────────────────────────────────
interface ApiProviderProfile extends Omit<PopulatedProviderProfile, "profile"> {
  profile: PopulatedUserProfile & {
    userId: {
      _id: string;
      name: string;
      email: string;
      createdAt: string;
    };
  };
  ProviderStatus?: string;
  status: ProviderStatus;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const SERVICES_INITIAL_COUNT = 3;
const GALLERY_PREVIEW_COUNT = 3;

// ─── Guards ─────────────────────────────────────────────────────────────────
function isPopulatedPic(v: unknown): v is PopulatedProfilePicture {
  return typeof v === "object" && v !== null && "url" in v;
}

function isService(s: unknown): s is Service {
  return (
    typeof s === "object" &&
    s !== null &&
    "title" in s &&
    Boolean((s as Service).title)
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3);
}

function buildLocationLine(loc?: UserLocation | null): string {
  if (!loc) return "";
  return [loc.locality, loc.district, loc.city, loc.region]
    .filter(Boolean)
    .join(", ");
}

function buildShortLocation(loc?: UserLocation | null): string {
  if (!loc) return "";
  return [loc.locality, loc.city].filter(Boolean).join(", ");
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function resolveStatus(p: ApiProviderProfile): string {
  return p.status ?? p.ProviderStatus ?? "—";
}

/**
 * Returns true if the provider is currently within their working hours.
 */
function isCurrentlyOpen(
  hours?: WorkingHours,
  isAlwaysAvailable?: boolean,
): boolean {
  if (isAlwaysAvailable) return true;
  if (!hours) return false;

  const now = new Date();
  const today = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const slot = hours[today];
  if (!slot) return false;

  const [startH, startM] = slot.start.split(":").map(Number);
  const [endH, endM] = slot.end.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  return nowMins >= startMins && nowMins < endMins;
}

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

/**
 * Format time string "HH:MM" → "8:00 am"
 */
function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Primitives ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
      {children}
    </p>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}

function InfoRow({ icon, label, value, href, mono }: InfoRowProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-none mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-medium text-stone-800 dark:text-stone-100 wrap-break-word ${mono ? "font-mono tracking-wider" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
  return href ? (
    <a
      href={href}
      className="block hover:opacity-75 transition-opacity"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
      {inner}
    </a>
  ) : (
    inner
  );
}

// ─── Live Availability Badge ─────────────────────────────────────────────────
function LiveAvailabilityBadge({
  isOpen,
  isAlwaysAvailable,
  hours,
  status,
}: {
  isOpen: boolean;
  isAlwaysAvailable?: boolean;
  hours?: WorkingHours;
  status: string;
}) {
  const [, setTick] = useState(0);

  // Re-evaluate every minute
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // Booking-based overrides take priority
  const isBooked = status?.toLowerCase() === "booked";
  const isClosed = status?.toLowerCase() === "closed";

  let label = "";
  let colorClass = "";
  let dotColor = "";

  if (isBooked) {
    label = "Currently Booked";
    colorClass =
      "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40";
    dotColor = "bg-amber-500";
  } else if (isClosed) {
    label = "Closed";
    colorClass =
      "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40";
    dotColor = "bg-red-500";
  } else if (isAlwaysAvailable || isOpen) {
    label = isAlwaysAvailable ? "Always Available" : "Open Now";
    colorClass =
      "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40";
    dotColor = "bg-emerald-500 animate-pulse";
  } else {
    // Find next open day
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayIdx = DAY_ORDER.indexOf(today as (typeof DAY_ORDER)[number]);
    let nextLabel = "";
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7;
      const day = DAY_ORDER[idx];
      if (hours?.[day]) {
        nextLabel =
          i === 1
            ? `Opens tomorrow ${fmt(hours[day].start)}`
            : `Opens ${formatDay(day)}`;
        break;
      }
    }
    label = nextLabel || "Closed Today";
    colorClass =
      "text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/40";
    dotColor = "bg-stone-400 dark:bg-stone-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colorClass}`}
      title="Live availability — updates every minute">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
      <Wifi size={9} className="opacity-60 ml-0.5" />
    </span>
  );
}

// ─── Gallery Section (compact preview with "View all" link) ──────────────────
function GallerySection({
  images,
  providerId,
}: {
  images: { _id: string; url: string }[];
  providerId: string;
}) {
  if (images.length === 0) return null;

  const preview = images.slice(0, GALLERY_PREVIEW_COUNT);
  const overflow = images.length - GALLERY_PREVIEW_COUNT;

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Images size={13} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Business Gallery
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            {images.length}
          </span>
        </div>
        <Link
          href={`/providers/${providerId}/gallery`}
          className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
          View gallery
          <ExternalLink size={10} />
        </Link>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {preview.map((img, i) => {
            const isLast = i === preview.length - 1 && overflow > 0;
            return (
              <Link
                key={img._id}
                href={`/providers/${providerId}/gallery`}
                className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 group hover:opacity-90 transition-opacity">
                <Image
                  src={img.url}
                  alt="Gallery image"
                  fill
                  className="object-cover"
                />
                {isLast && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <Images size={18} className="text-white/80 mx-auto mb-1" />
                      <span className="text-white text-xs font-bold">
                        +{overflow} more
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ service }: { service: Service }) {
  const price =
    typeof service.servicePricing === "number"
      ? `GHS ${service.servicePricing}`
      : null;
  const slug = (service as Service & { slug?: string }).slug;
  const cover = (service as Service & { coverImage?: { url?: string } })
    .coverImage?.url;

  return (
    <Link
      href={`/services/${slug ?? service._id}`}
      className="group flex items-center gap-3 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl border border-stone-100 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800 hover:border-amber-200 dark:hover:border-amber-700/50 hover:shadow-sm transition-all duration-150 active:scale-[0.99]">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-stone-200 dark:bg-stone-700 overflow-hidden shrink-0">
        {cover ? (
          <Image
            src={cover}
            alt={`${service.title} service image`}
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layers size={16} className="text-stone-400 dark:text-stone-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {service.title}
        </p>
        {service.description && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
            {service.description}
          </p>
        )}
        {price && (
          <span className="inline-block text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full mt-1">
            {price}
          </span>
        )}
      </div>
      <ChevronRight
        size={13}
        className="text-stone-300 dark:text-stone-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0"
      />
    </Link>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────
function ServicesSection({
  services,
  loading,
}: {
  services: Service[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = services.length > SERVICES_INITIAL_COUNT;
  const visible = expanded
    ? services
    : services.slice(0, SERVICES_INITIAL_COUNT);

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Layers size={13} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Services Offered
          </h2>
          {services.length > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
              {services.length}
            </span>
          )}
        </div>
        {loading && (
          <Loader2 size={13} className="animate-spin text-stone-400" />
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        {services.length > 0 ? (
          <>
            {visible.map((s) => (
              <ServiceCard key={String(s._id)} service={s} />
            ))}
            {hasMore && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 transition-all">
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
                {expanded
                  ? "Show less"
                  : `Show ${services.length - SERVICES_INITIAL_COUNT} more`}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Layers
                size={20}
                className="text-stone-300 dark:text-stone-600"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                No services listed yet.
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Contact the provider directly to ask what they offer.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Location Map Section ─────────────────────────────────────────────────────
function LocationMapSection({ loc }: { loc: UserLocation }) {
  const [view, setView] = useState<"map" | "details">("map");

  const coords = loc.gpsCoordinates;
  const hasCoords =
    coords && isFinite(coords.latitude) && isFinite(coords.longitude);
  const zoom = 16;
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        coords!.longitude - 0.008
      }%2C${coords!.latitude - 0.006}%2C${
        coords!.longitude + 0.008
      }%2C${coords!.latitude + 0.006}&layer=mapnik&marker=${
        coords!.latitude
      }%2C${coords!.longitude}`
    : null;

  const mapsLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${coords!.latitude}&mlon=${coords!.longitude}#map=${zoom}/${coords!.latitude}/${coords!.longitude}`
    : null;

  const ghanaPostLink = loc.ghanaPostGPS
    ? `https://map.ghanapostgps.com/map/${loc.ghanaPostGPS}`
    : null;

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <MapPin
              size={13}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Location
          </h2>
          {loc.isAddressVerified && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={9} />
              Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === "map"
                ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}>
            <Map size={11} />
            Map
          </button>
          <button
            onClick={() => setView("details")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === "details"
                ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}>
            <List size={11} />
            Details
          </button>
        </div>
      </div>

      {view === "map" && (
        <div className="relative">
          {mapSrc ? (
            <>
              <iframe
                src={mapSrc}
                title={`Map showing location of ${loc.locality ?? "provider"}`}
                className="w-full h-64 sm:h-72 border-0"
                loading="lazy"
                allowFullScreen
              />
              <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-stone-400 shrink-0" />
                  <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {[loc.locality, loc.city, loc.region]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ghanaPostLink && (
                    <a
                      href={ghanaPostLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                      Ghana Post GPS
                      <ExternalLink size={10} />
                    </a>
                  )}
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                      Open in OSM
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3 bg-stone-50 dark:bg-stone-800/40">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Map size={20} className="text-stone-300 dark:text-stone-600" />
              </div>
              <p className="text-sm text-stone-400 dark:text-stone-500">
                No map coordinates available
              </p>
              {ghanaPostLink && (
                <a
                  href={ghanaPostLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                  View Ghana Post GPS location <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {view === "details" && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {loc.locality && (
              <div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                  Locality
                </p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100 capitalize">
                  {loc.locality}
                </p>
              </div>
            )}
            {loc.city && (
              <div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                  City
                </p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {loc.city}
                </p>
              </div>
            )}
            {loc.district && (
              <div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                  District
                </p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {loc.district}
                </p>
              </div>
            )}
            {loc.region && (
              <div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                  Region
                </p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {loc.region}
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-stone-100 dark:bg-stone-800" />

          <div className="space-y-3">
            {loc.ghanaPostGPS && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Navigation
                    size={13}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                    Ghana Post GPS
                  </p>
                  <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-100 tracking-wider">
                    {loc.ghanaPostGPS}
                  </p>
                  {ghanaPostLink && (
                    <a
                      href={ghanaPostLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline mt-1 font-medium">
                      View on Ghana Post map <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            )}
            {loc.nearbyLandmark && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                  <Landmark
                    size={13}
                    className="text-stone-400 dark:text-stone-500"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wide font-bold mb-0.5">
                    Nearby Landmark
                  </p>
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-100 capitalize">
                    {loc.nearbyLandmark}
                  </p>
                </div>
              </div>
            )}
            {coords && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50">
                <Globe size={12} className="text-stone-400 shrink-0" />
                <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          {loc.isAddressVerified && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 size={13} className="shrink-0" />
              Address verified by our team
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Provider Reviews Section ─────────────────────────────────────────────────

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? "text-amber-400" : "text-stone-200 dark:text-stone-700"}
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function maskEmail(clientId: Review["clientId"]): string {
  const email = typeof clientId === "string" ? "" : clientId.email;
  if (!email) return "Anonymous";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 2 ? local[0] + "***" : local.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  return (
    <div className="py-4 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <StarDisplay rating={review.rating} size={13} />
        <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">{date}</span>
      </div>
      {review.comment && (
        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-1.5">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5">{maskEmail(review.clientId)}</p>
    </div>
  );
}

function ProviderReviewsSection({ providerProfileId, ratingStats }: {
  providerProfileId: string;
  ratingStats?: { average: number; count: number };
}) {
  const { reviews, total, loading, loadingMore, error, hasMore, loadMore } =
    useProviderReviews(providerProfileId, 8);

  if (loading) {
    return (
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Star size={13} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">Reviews</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-stone-300 dark:text-stone-600" />
        </div>
      </section>
    );
  }

  if (!loading && total === 0 && !error) return null;

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Star size={13} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">Reviews</h2>
        </div>
        {(ratingStats?.count ?? total) > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay rating={ratingStats?.average ?? 0} size={12} />
            <span className="text-xs font-bold text-stone-700 dark:text-stone-200">
              {(ratingStats?.average ?? 0).toFixed(1)}
            </span>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              ({ratingStats?.count ?? total} review{(ratingStats?.count ?? total) !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {/* Reviews list */}
      <div className="px-4 sm:px-5">
        {error && (
          <div className="flex items-center gap-2 py-6 text-xs text-red-500 dark:text-red-400">
            <AlertCircle size={13} className="shrink-0" /> {error}
          </div>
        )}
        {reviews.length > 0 && reviews.map((r) => (
          <ReviewCard key={r._id} review={r} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="px-4 sm:px-5 pb-4 pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
            {loadingMore ? "Loading…" : `Load more (${total - reviews.length} remaining)`}
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Request CTA Button ───────────────────────────────────────────────────────
function RequestProviderCTA({
  providerId,
  isBooked,
  isCustomer,
}: {
  providerId: string;
  isOpen: boolean;
  isBooked: boolean;
  isCustomer: boolean;
}) {
  if (!isCustomer) return null;

  return (
    <Link
      href={`/requests/provider/${providerId}`}
      className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.98] ${
        isBooked
          ? "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 cursor-default"
          : "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-900/20"
      }`}>
      <Send size={14} />
      {isBooked ? "Currently Unavailable" : "Request This Provider"}
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { profile: myProfile } = useProfile();
  const isCustomer = myProfile?.role === UserRole.CUSTOMER;

  const {
    data: rawProfile,
    loading,
    error,
  } = useProviderProfile(id ?? null, { populate: true });

  const profile = rawProfile as ApiProviderProfile | null | undefined;

  const { data: servicesData, loading: servicesLoading } = useServiceOfferings(
    id ?? null,
  );

  // ── Client geolocation (for distance-to-provider badge) ──────────────────
  const {
    state: geoState,
    permission: geoPerm,
    requestLocation,
  } = useGeolocation();

  // Auto-request if the browser has already granted access
  const autoRequestedRef = useRef(false);
  useEffect(() => {
    if (geoPerm === "granted" && !autoRequestedRef.current) {
      autoRequestedRef.current = true;
      requestLocation();
    }
  }, [geoPerm, requestLocation]);

  // ── Profile picture ───────────────────────────────────────────────────────
  // The provider detail endpoint populates the UserProfile ref but does NOT
  // deeply populate profilePictureId within it. Fetch it separately via the
  // public picture endpoint using the auth userId embedded in the user profile.
  const [fetchedPicture, setFetchedPicture] = useState<IFile | null>(null);

  useEffect(() => {
    if (!rawProfile) return;
    const prof = rawProfile as unknown as ApiProviderProfile;
    const pic = prof?.profile?.profilePictureId;
    if (pic && typeof pic === "object" && "url" in pic) return;
    const authUserId = prof?.profile?.userId?._id;
    if (!authUserId) return;
    let cancelled = false;
    profilePictureAPI
      .getPublicRecord(authUserId)
      .then((file) => { if (!cancelled && file?.url) setFetchedPicture(file); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rawProfile]);

  if (loading) {
    return <LoadingOverlay message="Loading provider profile…" show />;
  }

  if (error || !profile) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
            Provider not found
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            {error ?? "This profile doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => router.push("/providers")}
            className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:bg-amber-500 transition-all">
            Browse Providers
          </button>
        </div>
      </div>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────
  const businessName = profile.businessName ?? "Unknown Provider";
  const userProfile = profile.profile;
  const userId = userProfile?.userId;
  const rawPicture = userProfile?.profilePictureId;
  const picture = isPopulatedPic(rawPicture) ? rawPicture : (fetchedPicture ?? undefined);
  const heroImageUrl = isPopulatedPic(picture) ? picture.url : null;
  const contact = userProfile?.contactInfo;
  const loc = profile.locationData as UserLocation | undefined;
  const locationLine = buildLocationLine(loc);
  const shortLocation = buildShortLocation(loc);
  const hours = profile.workingHours as WorkingHours | undefined;
  const hasHours = hours && Object.keys(hours).length > 0;

  const populatedServices: Service[] = Array.isArray(profile.serviceOfferings)
    ? profile.serviceOfferings.filter(isService)
    : [];
  const allServices: Service[] = servicesData ?? populatedServices;

  const galleryImages = Array.isArray(profile.businessGalleryImages)
    ? (profile.businessGalleryImages as unknown[]).filter(
        (g): g is { _id: string; url: string } =>
          typeof g === "object" && g !== null && "url" in g,
      )
    : [];

  const providerCoords = loc?.gpsCoordinates;
  const clientCoords = geoState.status === "captured" ? geoState.coords : null;
  const distanceKm =
    clientCoords && providerCoords
      ? haversineKm(
          clientCoords.latitude,
          clientCoords.longitude,
          providerCoords.latitude,
          providerCoords.longitude,
        )
      : null;

  const isVerified = profile.isAddressVerified;
  const status = resolveStatus(profile);
  const isBooked = status?.toLowerCase() === "booked";
  const isOpen = isCurrentlyOpen(hours, profile.isAlwaysAvailable);

  return (
    <div className="h-full overflow-y-auto">
      {/* ── Sticky nav ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 shrink-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                  <Home size={12} />
                  <span className="hidden xs:inline">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/providers"
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                  <Users size={12} />
                  <span className="hidden sm:inline">Providers</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium max-w-30 sm:max-w-40 truncate text-stone-700 dark:text-stone-300">
                  {businessName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors shrink-0 py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <ArrowLeft size={13} /> Back
          </button>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div>
        {/* ── Hero ── */}
        <div className="relative overflow-hidden min-h-55 sm:min-h-65">
          {/* Background: business image or gradient fallback */}
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={businessName}
              fill
              priority
              className="object-cover object-center"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            </>
          )}

          {/* Gradient overlay — ensures all text and buttons are legible */}
          <div className={`absolute inset-0 ${
            heroImageUrl
              ? "bg-linear-to-r from-stone-900/90 via-stone-900/75 to-stone-900/40 dark:from-stone-950/95 dark:via-stone-950/80 dark:to-stone-950/50"
              : "bg-linear-to-t from-stone-900/60 to-transparent"
          }`} />

          {/* Content */}
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-8 sm:pt-10 pb-8 sm:pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
                  {businessName}
                </h1>

                {userId?.name && (
                  <p className="flex items-center gap-1.5 text-sm text-stone-300 mt-1">
                    <User size={12} className="shrink-0 text-stone-400" />
                    <span className="truncate">{userId.name}</span>
                  </p>
                )}

                {shortLocation && (
                  <p className="flex items-center gap-1.5 text-sm text-stone-300 mt-1">
                    <MapPin size={12} className="shrink-0 text-amber-400" />
                    <span className="truncate">{shortLocation}</span>
                    {isVerified && (
                      <BadgeCheck
                        size={13}
                        className="text-emerald-400 shrink-0 ml-0.5"
                      />
                    )}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <LiveAvailabilityBadge
                    isOpen={isOpen}
                    isAlwaysAvailable={profile.isAlwaysAvailable}
                    hours={hours}
                    status={status}
                  />

                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm">
                      <Shield size={11} /> Verified
                    </span>
                  )}
                  {allServices.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm">
                      <Layers size={11} />
                      {allServices.length} service
                      {allServices.length !== 1 ? "s" : ""}
                    </span>
                  )}

                  {/* Rating */}
                  {(profile.ratingStats?.count ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm">
                      <Star size={10} className="text-amber-400" fill="currentColor" />
                      {profile.ratingStats!.average.toFixed(1)}
                      <span className="text-white/50">({profile.ratingStats!.count})</span>
                    </span>
                  )}

                  {/* Distance from client to provider */}
                  {distanceKm !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm">
                      <Navigation size={11} />
                      {distanceKm < 1
                        ? `${Math.round(distanceKm * 1000)} m away`
                        : `${distanceKm.toFixed(1)} km away`}
                    </span>
                  ) : geoState.status === "acquiring" ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/60 backdrop-blur-sm">
                      <Loader2 size={10} className="animate-spin" />
                      Getting distance…
                    </span>
                  ) : geoPerm !== "denied" &&
                    geoState.status !== "captured" &&
                    providerCoords ? (
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-colors">
                      <Navigation size={11} />
                      How far?
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Hero CTA — desktop only */}
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
                {isCustomer && (
                  <Link
                    href={`/requests/provider/${id}`}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg ${
                      isBooked
                        ? "bg-white/10 border border-white/15 text-white/60 cursor-default"
                        : "bg-amber-500 hover:bg-amber-400 text-white shadow-amber-900/30"
                    }`}>
                    <Send size={13} />
                    {isBooked ? "Currently Unavailable" : "Request Provider"}
                  </Link>
                )}
                {contact?.mainContact && (
                  <a
                    href={`tel:${contact.mainContact}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors backdrop-blur-sm">
                    <Phone size={13} />
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── Body ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5 sm:pt-6 pb-24">
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">
            {/* ── Main column ── */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
              {/* Services */}
              <ServicesSection
                services={allServices}
                loading={servicesLoading}
              />

              {/* Availability / Schedule */}
              <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <CalendarDays
                        size={13}
                        className="text-amber-600 dark:text-amber-400"
                      />
                    </div>
                    <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
                      Schedule & Availability
                    </h2>
                  </div>
                  {/* Live indicator */}
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                    <Wifi size={10} className="text-emerald-500" />
                    Live
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <WeeklyScheduleCalendar
                    workingHours={hasHours ? hours : undefined}
                    isAlwaysAvailable={profile.isAlwaysAvailable}
                    status={status}
                    gridHeight={220}
                    hideStatusStrip={false}
                  />
                </div>
              </section>

              {/* Location map */}
              {loc && <LocationMapSection loc={loc} />}

              {/* Reviews */}
              <ProviderReviewsSection
                providerProfileId={String(profile._id)}
                ratingStats={profile.ratingStats}
              />
            </div>

            {/* ── Sidebar ── */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 self-start lg:sticky lg:top-14">
              <div className="space-y-4 pb-6">
                {/* Request CTA — desktop sidebar only; mobile gets sticky bottom bar */}
                <div className="hidden lg:block">
                  <RequestProviderCTA
                    providerId={id ?? ""}
                    isOpen={isOpen}
                    isBooked={isBooked}
                    isCustomer={isCustomer}
                  />
                </div>

                {/* Contact */}
                {(contact?.mainContact || contact?.businessEmail) && (
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-700/60  p-4 sm:p-5 space-y-3.5">
                    <SectionLabel>Contact</SectionLabel>
                    {contact.mainContact && (
                      <InfoRow
                        icon={<Phone size={13} />}
                        label="Phone"
                        value={contact.mainContact}
                        href={`tel:${contact.mainContact}`}
                      />
                    )}
                    {contact.additionalContact && (
                      <InfoRow
                        icon={<Phone size={13} />}
                        label="Secondary"
                        value={contact.additionalContact}
                        href={`tel:${contact.additionalContact}`}
                      />
                    )}
                    {contact.businessEmail && (
                      <InfoRow
                        icon={<Mail size={13} />}
                        label="Email"
                        value={contact.businessEmail}
                        href={`mailto:${contact.businessEmail}`}
                      />
                    )}
                  </div>
                )}

                {/* About */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-700/60 p-4 sm:p-5 space-y-3.5">
                  <SectionLabel>About</SectionLabel>
                  {userId?.name && (
                    <InfoRow
                      icon={<User size={13} />}
                      label="Owner"
                      value={userId.name}
                    />
                  )}
                  <InfoRow
                    icon={<Building2 size={13} />}
                    label="Member since"
                    value={formatDate(userId?.createdAt ?? profile.createdAt)}
                  />
                  {status && status !== "—" && (
                    <InfoRow
                      icon={<Hash size={13} />}
                      label="Status"
                      value={status}
                    />
                  )}
                  {(profile.ratingStats?.count ?? 0) > 0 && (
                    <InfoRow
                      icon={<Star size={13} className="text-amber-400" />}
                      label="Rating"
                      value={`${profile.ratingStats!.average.toFixed(1)} / 5 (${profile.ratingStats!.count} review${profile.ratingStats!.count !== 1 ? "s" : ""})`}
                    />
                  )}
                </div>

                {/* Location quick-ref */}
                {loc && (
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-700/60  p-4 sm:p-5 space-y-3.5">
                    <SectionLabel>Location</SectionLabel>
                    {locationLine && (
                      <InfoRow
                        icon={<MapPin size={13} />}
                        label="Area"
                        value={locationLine}
                      />
                    )}
                    {loc.ghanaPostGPS && (
                      <InfoRow
                        icon={<Navigation size={13} />}
                        label="Ghana Post GPS"
                        value={loc.ghanaPostGPS}
                        mono
                      />
                    )}
                    {loc.nearbyLandmark && (
                      <InfoRow
                        icon={<Landmark size={13} />}
                        label="Nearby Landmark"
                        value={loc.nearbyLandmark}
                      />
                    )}
                  </div>
                )}

                {galleryImages.length > 0 && (
                  <GallerySection
                    images={galleryImages}
                    providerId={id ?? ""}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA bar ────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <LiveAvailabilityBadge
            isOpen={isOpen}
            isAlwaysAvailable={profile.isAlwaysAvailable}
            hours={hours}
            status={status}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {contact?.mainContact && (
            <a
              href={`tel:${contact.mainContact}`}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-amber-300 hover:text-amber-600 transition-all shrink-0">
              <Phone size={15} />
            </a>
          )}
          {isCustomer && (
            <Link
              href={`/requests/provider/${id}`}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                isBooked
                  ? "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-default pointer-events-none"
                  : "bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-900/20"
              }`}>
              <Send size={13} />
              {isBooked ? "Unavailable" : "Request"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
