"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Clock,
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
const GALLERY_MAX_DESKTOP = 5;
const GALLERY_MAX_MOBILE = 3;

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
function initials(name?: string | null): string {
  if (!name?.trim()) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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

// ─── Avatar ──────────────────────────────────────────────────────────────────
function ProviderAvatar({
  picture,
  name,
  size = "lg",
  isOpen,
}: {
  picture: unknown;
  name: string;
  size?: "lg" | "xl";
  isOpen?: boolean;
}) {
  const url = isPopulatedPic(picture) ? picture.url : null;
  const thumb = isPopulatedPic(picture) ? picture.thumbnailUrl : null;
  const dim =
    size === "xl"
      ? "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
      : "w-14 h-14 sm:w-16 sm:h-16";
  const text = size === "xl" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl";

  return (
    <div className="relative shrink-0">
      <div
        className={`${dim} rounded-3xl bg-linear-to-br from-amber-400 via-orange-400 to-orange-500 flex items-center justify-center text-white ${text} font-black shadow-2xl select-none ring-4 ring-white/10 overflow-hidden`}>
        {url ? (
          <Image
            src={thumb ?? url}
            alt={name}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>
      {isOpen !== undefined && (
        <span
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-stone-900 rounded-full ${
            isOpen ? "bg-emerald-400 animate-pulse" : "bg-stone-500"
          }`}
        />
      )}
    </div>
  );
}

// ─── Working Hours Calendar View ─────────────────────────────────────────────
function AvailabilityCalendar({
  hours,
  isAlwaysAvailable,
  status,
}: {
  hours?: WorkingHours;
  isAlwaysAvailable?: boolean;
  status: string;
}) {
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const isBooked = status?.toLowerCase() === "booked";
  const isClosed = status?.toLowerCase() === "closed";

  if (isAlwaysAvailable) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
          <Clock size={16} className="text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Available 24 / 7
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            This provider is always reachable
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Always on
        </span>
      </div>
    );
  }

  if (!hours || Object.keys(hours).length === 0) {
    return (
      <p className="text-sm text-stone-400 dark:text-stone-500">
        No schedule information available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Booking status override notice */}
      {isBooked && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <AlertCircle size={13} className="shrink-0" />
          Currently booked — schedule hours still shown below
        </div>
      )}
      {isClosed && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-xs font-semibold text-red-700 dark:text-red-300">
          <AlertCircle size={13} className="shrink-0" />
          Provider is currently closed — check back later
        </div>
      )}

      {/* Desktop 7-col calendar grid */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_ORDER.map((day) => {
            const slot = hours[day];
            const isToday = today === day;
            const isOpenNow = isToday && isCurrentlyOpen(hours);
            const effectivelyClosed = isBooked || isClosed;

            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <p
                  className={`text-[10px] font-bold ${
                    isToday
                      ? "text-amber-500"
                      : "text-stone-400 dark:text-stone-500"
                  }`}>
                  {formatDay(day)}
                </p>
                {slot ? (
                  <div
                    className={`w-full rounded-xl px-0.5 py-2.5 text-[10px] font-medium leading-tight text-center relative ${
                      isOpenNow && !effectivelyClosed
                        ? "bg-emerald-500 text-white"
                        : isToday
                          ? "bg-amber-500 text-white"
                          : "bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700/50 text-stone-600 dark:text-stone-400"
                    }`}>
                    {isOpenNow && !effectivelyClosed && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    )}
                    {fmt(slot.start)}
                    <br />
                    {fmt(slot.end)}
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-xl px-0.5 py-2.5 text-[10px] leading-tight text-center ${
                      isToday
                        ? "text-amber-400/60 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20"
                        : "text-stone-300 dark:text-stone-700 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/30"
                    }`}>
                    Off
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-stone-400 dark:text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Open now
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Today (closed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700" />{" "}
            Working day
          </span>
        </div>
      </div>

      {/* Mobile stacked list */}
      <div className="sm:hidden space-y-1.5">
        {DAY_ORDER.map((day) => {
          const slot = hours[day];
          const isToday = today === day;
          const isOpenNow = isToday && isCurrentlyOpen(hours);
          const effectivelyClosed = isBooked || isClosed;

          return (
            <div
              key={day}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border relative overflow-hidden ${
                isOpenNow && !effectivelyClosed
                  ? "bg-emerald-500 border-emerald-500"
                  : isToday
                    ? "bg-amber-500 border-amber-500"
                    : "bg-stone-50 dark:bg-stone-800/60 border-stone-100 dark:border-stone-700/50"
              }`}>
              {isOpenNow && !effectivelyClosed && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60 animate-ping" />
              )}
              <span
                className={`font-semibold text-xs ${
                  isOpenNow && !effectivelyClosed
                    ? "text-white"
                    : isToday
                      ? "text-white"
                      : "text-stone-500 dark:text-stone-400"
                }`}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
                {isOpenNow && !effectivelyClosed && (
                  <span className="ml-1.5 text-[10px] font-normal opacity-75">
                    (open)
                  </span>
                )}
              </span>
              {slot ? (
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "text-white/90"
                      : "text-stone-600 dark:text-stone-400"
                  }`}>
                  {fmt(slot.start)} – {fmt(slot.end)}
                </span>
              ) : (
                <span
                  className={`text-xs ${
                    isToday
                      ? "text-white/70"
                      : "text-stone-300 dark:text-stone-600"
                  }`}>
                  Closed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Gallery Section (compact with "View all" link) ───────────────────────────
function GallerySection({
  images,
  providerId,
}: {
  images: { _id: string; url: string }[];
  providerId: string;
}) {
  if (images.length === 0) return <div>gallery items here</div>;

  // Show different counts by screen size via JS (we'll render both and toggle via CSS)
  const desktopImages = images.slice(0, GALLERY_MAX_DESKTOP);
  const mobileImages = images.slice(0, GALLERY_MAX_MOBILE);
  const hasMore = images.length > GALLERY_MAX_DESKTOP;
  const mobileHasMore = images.length > GALLERY_MAX_MOBILE;

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Images
              size={13}
              className="text-violet-600 dark:text-violet-400"
            />
          </div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Business Gallery
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            {images.length}
          </span>
        </div>
        {images.length > GALLERY_MAX_MOBILE && (
          <Link
            href={`/providers/${providerId}/gallery`}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
            View all
            <ExternalLink size={10} />
          </Link>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {/* Mobile: show 3 */}
        <div className="sm:hidden grid grid-cols-3 gap-2">
          {mobileImages.map((img, i) => (
            <Link
              key={img._id}
              href={
                i === mobileImages.length - 1 && mobileHasMore
                  ? `/providers/${providerId}/gallery`
                  : img.url
              }
              target={
                i === mobileImages.length - 1 && mobileHasMore
                  ? undefined
                  : "_blank"
              }
              rel={
                i === mobileImages.length - 1 && mobileHasMore
                  ? undefined
                  : "noopener noreferrer"
              }
              className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 group hover:opacity-90 transition-opacity">
              <Image
                src={img.url}
                alt="Gallery image"
                fill
                className="object-cover"
              />
              {i === mobileImages.length - 1 && mobileHasMore && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    +{images.length - GALLERY_MAX_MOBILE} more
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Desktop: show 5 */}
        <div className="hidden sm:grid grid-cols-5 gap-2">
          {desktopImages.map((img, i) => (
            <Link
              key={img._id}
              href={
                i === desktopImages.length - 1 && hasMore
                  ? `/providers/${providerId}/gallery`
                  : img.url
              }
              target={
                i === desktopImages.length - 1 && hasMore ? undefined : "_blank"
              }
              rel={
                i === desktopImages.length - 1 && hasMore
                  ? undefined
                  : "noopener noreferrer"
              }
              className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 group hover:opacity-90 transition-opacity">
              <Image
                src={img.url}
                alt="Gallery image"
                fill
                className="object-cover"
              />
              {i === desktopImages.length - 1 && hasMore && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-xl">
                  <div className="text-center">
                    <Images size={18} className="text-white/80 mx-auto mb-1" />
                    <span className="text-white text-xs font-bold">
                      +{images.length - GALLERY_MAX_DESKTOP} more
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
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

// ─── Request CTA Button ───────────────────────────────────────────────────────
function RequestProviderCTA({
  providerId,
  isBooked,
}: {
  providerId: string;
  isOpen: boolean;
  isBooked: boolean;
}) {
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

  const {
    data: rawProfile,
    loading,
    error,
  } = useProviderProfile(id ?? null, { populate: true });

  const profile = rawProfile as ApiProviderProfile | null | undefined;

  const { data: servicesData, loading: servicesLoading } = useServiceOfferings(
    id ?? null,
  );

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
  const picture = userProfile?.profilePictureId;
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

  const isVerified = profile.isAddressVerified;
  const status = resolveStatus(profile);
  const isBooked = status?.toLowerCase() === "booked";
  const isOpen = isCurrentlyOpen(hours, profile.isAlwaysAvailable);

  return (
    <>
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
      <div className="flex-1">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-8 sm:pt-10 pb-8 sm:pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              <ProviderAvatar
                picture={picture}
                name={businessName}
                size="xl"
                isOpen={isOpen}
              />

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {businessName}
                </h1>

                {userId?.name && (
                  <p className="flex items-center gap-1.5 text-sm text-stone-400 mt-1">
                    <User size={12} className="shrink-0 text-stone-500" />
                    <span className="truncate">{userId.name}</span>
                  </p>
                )}

                {shortLocation && (
                  <p className="flex items-center gap-1.5 text-sm text-stone-400 mt-1">
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
                  {/* Live availability badge */}
                  <LiveAvailabilityBadge
                    isOpen={isOpen}
                    isAlwaysAvailable={profile.isAlwaysAvailable}
                    hours={hours}
                    status={status}
                  />

                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
                      <Shield size={11} /> Verified
                    </span>
                  )}
                  {allServices.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
                      <Layers size={11} />
                      {allServices.length} service
                      {allServices.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Hero CTA — desktop only */}
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
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
                {contact?.mainContact && (
                  <a
                    href={`tel:${contact.mainContact}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors">
                    <Phone size={13} />
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 sm:py-6">
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
                  <AvailabilityCalendar
                    hours={hasHours ? hours : undefined}
                    isAlwaysAvailable={profile.isAlwaysAvailable}
                    status={status}
                  />
                </div>
              </section>

              {/* Location map */}
              {loc && <LocationMapSection loc={loc} />}
            </div>

            {/* ── Sidebar ── */}
            <ScrollArea className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto pr-1">
              <div className="space-y-4 pb-6">
                {/* Request CTA — mobile first */}
                <div className="lg:hidden">
                  <RequestProviderCTA
                    providerId={id ?? ""}
                    isOpen={isOpen}
                    isBooked={isBooked}
                  />
                </div>

                {/* Desktop request CTA in sidebar */}
                <div className="hidden lg:block">
                  <RequestProviderCTA
                    providerId={id ?? ""}
                    isOpen={isOpen}
                    isBooked={isBooked}
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

                <div className="rounded-2xl border border-stone-200 dark:border-stone-700/60 p-4 sm:p-5 space-y-3.5">
                  <SectionLabel>Gallery</SectionLabel>
                  {/* Gallery — repositioned here for better visual hierarchy */}
                  {galleryImages.length >= 0 && (
                    <GallerySection
                      images={galleryImages}
                      providerId={id ?? ""}
                    />
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
