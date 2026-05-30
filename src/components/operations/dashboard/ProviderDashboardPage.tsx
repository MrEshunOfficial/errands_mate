"use client";

import Link from "next/link";
import {
  Briefcase,
  Send,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Ban,
  Star,
  Shield,
  MessageSquare,
  XCircle,
  CalendarDays,
  MapPin,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  Inbox,
  Play,
  FileCheck,
  ArrowRight,
  ExternalLink,
  Bell,
  User,
} from "lucide-react";
import { useProviderBookings } from "@/hooks/bookings/useBooking";
import {
  useMyPendingRequests,
  useMyRequestsAsProvider,
} from "@/hooks/requests/useProviderRequest";
import { Booking, BookingStatus } from "@/types/booking.types";
import { ProviderRequest, RequestStatus } from "@/types/provider.request.types";
import {
  useMyProviderProfile,
  useServiceOfferings,
} from "@/hooks/profiles/useProviderProfile";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { isPopulatedPicture } from "@/types/core.user.profile.types";
import ProviderSetupPrompt from "@/components/homepage/ProviderSetupPrompt";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

// ─── Status configs ───────────────────────────────────────────────────────────

const BOOKING_STATUS_CFG: Record<
  BookingStatus,
  { label: string; classes: string; dot: string; accent?: string }
> = {
  [BookingStatus.CONFIRMED]: {
    label: "Confirmed",
    classes:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    accent: "from-emerald-400 to-teal-400",
  },
  [BookingStatus.RESCHEDULE_REQUESTED]: {
    label: "Reschedule Proposed",
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
  },
  [BookingStatus.IN_PROGRESS]: {
    label: "In Progress",
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
  },
  [BookingStatus.AWAITING_VALIDATION]: {
    label: "Awaiting Review",
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
    accent: "from-amber-400 to-orange-400",
  },
  [BookingStatus.DISPUTED]: {
    label: "Disputed",
    classes:
      "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-500",
    accent: "from-red-400 to-rose-400",
  },
  [BookingStatus.REBUTTAL_SUBMITTED]: {
    label: "Under Review",
    classes:
      "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500 animate-pulse",
    accent: "from-violet-400 to-purple-400",
  },
  [BookingStatus.COMPLETED]: {
    label: "Completed",
    classes:
      "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
  },
  [BookingStatus.RESOLVED]: {
    label: "Resolved",
    classes:
      "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  [BookingStatus.CANCELLED]: {
    label: "Cancelled",
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
};

const REQUEST_STATUS_CFG: Record<
  RequestStatus,
  { label: string; classes: string; dot: string }
> = {
  [RequestStatus.PENDING]: {
    label: "Pending",
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
  },
  [RequestStatus.ACCEPTED]: {
    label: "Accepted",
    classes:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
  },
  [RequestStatus.REJECTED]: {
    label: "Rejected",
    classes:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-400",
  },
  [RequestStatus.RESCHEDULED]: {
    label: "Rescheduled",
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
  },
  [RequestStatus.EXPIRED]: {
    label: "Expired",
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.CANCELLED]: {
    label: "Cancelled",
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    classes:
      "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
  },
};

interface StatusVisual {
  label: string;
  dot: string;
  badge: string;
  pulse: boolean;
}

const PROVIDER_STATUS_CFG: Record<string, StatusVisual> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    badge:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700",
    pulse: true,
  },
  booked: {
    label: "Booked",
    dot: "bg-amber-500",
    badge:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
    pulse: false,
  },
  requested: {
    label: "Requested",
    dot: "bg-sky-500",
    badge:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700",
    pulse: false,
  },
  closed: {
    label: "Closed",
    dot: "bg-gray-400",
    badge:
      "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    pulse: false,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const cfg = REQUEST_STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
  loading,
}: {
  label: string;
  value: number;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-4 min-w-0">
      <div className={`w-1 h-4 rounded-full ${accent} mb-2`} />
      {loading ? (
        <div className="h-7 w-10 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums leading-none">
          {value}
        </p>
      )}
      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 leading-tight">
        {label}
      </p>
    </div>
  );
}

function RecentJobRow({ booking }: { booking: Booking }) {
  const cfg = BOOKING_STATUS_CFG[booking.status];
  const needsAction = [
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.DISPUTED,
  ].includes(booking.status);

  return (
    <Link
      href={`/bookings/${booking._id}`}
      className="group flex items-start gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span
        className={`w-1 mt-1 h-9 rounded-full shrink-0 ${
          cfg.accent ? `bg-linear-to-b ${cfg.accent}` : cfg.dot
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-100 leading-snug line-clamp-1 flex-1">
            {booking.serviceDescription || `Job #${shortId(booking._id)}`}
          </p>
          {needsAction && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
              Action
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
          <BookingStatusBadge status={booking.status} />
          <span className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
            <CalendarDays size={9} />
            {fmtDate(booking.scheduledDate)}
          </span>
          {(booking.finalPrice ?? booking.estimatedPrice) !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
              <DollarSign size={9} />
              {booking.currency}{" "}
              {(booking.finalPrice ?? booking.estimatedPrice)!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-stone-300 group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400 transition-colors shrink-0 mt-1"
      />
    </Link>
  );
}

function PendingRequestRow({ req }: { req: ProviderRequest }) {
  return (
    <Link
      href={`/requests/${req._id}`}
      className="group flex items-start gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span className="w-1 mt-1 h-9 rounded-full bg-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 leading-snug line-clamp-1">
          {req.clientMessage || req.taskTitle || `Request #${shortId(req._id)}`}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
          <RequestStatusBadge status={req.status} />
          <span className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
            <CalendarDays size={9} />
            {fmtDate(req.schedule?.preferredDate)}
          </span>
          {req.serviceLocation?.ghanaPostGPS && (
            <span className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
              <MapPin size={9} />
              {req.serviceLocation.ghanaPostGPS}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
        Respond <ArrowRight size={11} />
      </span>
    </Link>
  );
}

function ActionBanner({
  pendingCount,
  activeJobsCount,
  disputedCount,
}: {
  pendingCount: number;
  activeJobsCount: number;
  disputedCount: number;
}) {
  if (pendingCount === 0 && activeJobsCount === 0 && disputedCount === 0)
    return null;
  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 flex items-start gap-3">
      <Bell
        size={15}
        className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
          Items needing attention
        </p>
        <ul className="mt-1 space-y-0.5">
          {pendingCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {pendingCount} client request{pendingCount > 1 ? "s" : ""} waiting
              for your response
            </li>
          )}
          {activeJobsCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {activeJobsCount} active job{activeJobsCount > 1 ? "s" : ""} in
              progress
            </li>
          )}
          {disputedCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {disputedCount} disputed booking
              {disputedCount > 1 ? "s" : ""} — consider submitting a rebuttal
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  count,
  countBg,
  href,
  loading,
  error,
  empty,
  children,
  iconBg = "bg-stone-100 dark:bg-stone-800",
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  countBg?: string;
  href: string;
  loading: boolean;
  error?: string | null;
  empty: React.ReactNode;
  children: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate">
            {title}
          </h2>
          {count != null && count > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                countBg ??
                "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
              }`}
            >
              {count}
            </span>
          )}
        </div>
        <Link
          href={href}
          className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-0.5 transition-colors shrink-0 ml-2"
        >
          All <ChevronRight size={11} />
        </Link>
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-stone-50 dark:bg-stone-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && empty}
      {!loading && !error && children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const { data: providerProfile, loading: profileLoading } =
    useMyProviderProfile();
  const profileId = providerProfile?._id ? String(providerProfile._id) : null;
  const { data: services } = useServiceOfferings(profileId);
  const { profile: userProfile } = useProfile();
  const avatarUrl = isPopulatedPicture(userProfile?.profilePictureId)
    ? userProfile.profilePictureId.thumbnailUrl ||
      userProfile.profilePictureId.url
    : undefined;

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useProviderBookings();
  const {
    data: pendingRequests,
    loading: pendingLoading,
    error: pendingError,
  } = useMyPendingRequests();
  const { data: allRequests, loading: allRequestsLoading } =
    useMyRequestsAsProvider();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300 mx-auto mb-3" />
          <p className="text-xs text-stone-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!providerProfile) {
    return <ProviderSetupPrompt />;
  }

  const activeJobs =
    bookings?.filter((b) =>
      [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(b.status),
    ).length ?? 0;
  const disputedJobs =
    bookings?.filter((b) => b.status === BookingStatus.DISPUTED).length ?? 0;
  const completedJobs =
    bookings?.filter((b) => b.status === BookingStatus.COMPLETED).length ?? 0;
  const pendingCount = pendingRequests?.length ?? 0;
  const totalRequests = allRequests?.length ?? 0;

  const recentBookings = bookings?.slice(0, 5) ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStatus =
    (providerProfile as any).status ??
    (providerProfile as any).ProviderStatus;
  const statusCfg = rawStatus
    ? PROVIDER_STATUS_CFG[String(rawStatus).toLowerCase()] ?? null
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const businessName =
    (providerProfile as any).businessName ??
    (providerProfile as any).displayName ??
    "Provider";

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase();

  void services;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={businessName}
              className="w-11 h-11 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {initials || <User size={16} className="text-blue-400" />}
              </span>
            </div>
          )}
          {statusCfg && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-stone-900 ${statusCfg.dot}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 leading-snug">
                {getGreeting()}
              </h1>
              <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
                {businessName}
              </p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <ExternalLink size={11} />
              Profile
            </Link>
          </div>
          {statusCfg && (
            <span
              className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${statusCfg.badge}`}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {statusCfg.pulse && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusCfg.dot}`}
                />
              </span>
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Action banner ────────────────────────────────────────────────── */}
      {!bookingsLoading && !pendingLoading && (
        <ActionBanner
          pendingCount={pendingCount}
          activeJobsCount={activeJobs}
          disputedCount={disputedJobs}
        />
      )}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Active Jobs"
          value={activeJobs}
          accent="bg-sky-400"
          loading={bookingsLoading}
        />
        <StatCard
          label="Pending Requests"
          value={pendingCount}
          accent="bg-amber-400"
          loading={pendingLoading}
        />
        <StatCard
          label="Completed Jobs"
          value={completedJobs}
          accent="bg-teal-400"
          loading={bookingsLoading}
        />
        <StatCard
          label="Total Requests"
          value={totalRequests}
          accent="bg-violet-400"
          loading={allRequestsLoading}
        />
      </div>

      {/* ── Activity panels ──────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        <SectionCard
          icon={
            <Briefcase
              size={14}
              className="text-stone-500 dark:text-stone-400"
            />
          }
          title="Recent Jobs"
          count={bookings?.length}
          href="/provider/bookings"
          loading={bookingsLoading}
          error={bookingsError}
          empty={
            recentBookings.length === 0 &&
            !bookingsLoading &&
            !bookingsError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
                  <Inbox size={18} className="text-stone-400" />
                </div>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  No jobs yet
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-[200px] leading-relaxed">
                  Accept a client request to get your first booking
                </p>
              </div>
            ) : null
          }
        >
          {recentBookings.length > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {recentBookings.map((b) => (
                <RecentJobRow key={b._id} booking={b} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={
            <Send size={14} className="text-amber-600 dark:text-amber-400" />
          }
          title="Pending Requests"
          count={pendingCount}
          countBg="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          href="/provider/requests"
          loading={pendingLoading}
          error={pendingError}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          empty={
            pendingCount === 0 && !pendingLoading && !pendingError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
                  <Inbox size={18} className="text-stone-400" />
                </div>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  No pending requests
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-[200px] leading-relaxed">
                  New client requests will appear here
                </p>
              </div>
            ) : null
          }
        >
          {(pendingRequests?.length ?? 0) > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {(pendingRequests ?? []).slice(0, 5).map((r) => (
                <PendingRequestRow key={r._id} req={r} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              href: "/provider/requests",
              bg: "bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40",
              icon: (
                <Send
                  size={15}
                  className="text-amber-600 dark:text-amber-400"
                />
              ),
              label: "My Requests",
              badge: pendingCount > 0 ? pendingCount : undefined,
            },
            {
              href: "/provider/bookings",
              bg: "bg-sky-50 dark:bg-sky-900/20 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/40",
              icon: (
                <Play size={15} className="text-sky-600 dark:text-sky-400" />
              ),
              label: "My Jobs",
              badge: activeJobs > 0 ? activeJobs : undefined,
            },
            {
              href: "/provider/services",
              bg: "bg-violet-50 dark:bg-violet-900/20 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40",
              icon: (
                <FileCheck
                  size={15}
                  className="text-violet-600 dark:text-violet-400"
                />
              ),
              label: "My Services",
              badge: undefined,
            },
            {
              href: "/profile",
              bg: "bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40",
              icon: (
                <ExternalLink
                  size={15}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              ),
              label: "Business Profile",
              badge: undefined,
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
            >
              {action.badge != null && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none">
                  {action.badge}
                </span>
              )}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${action.bg}`}
              >
                {action.icon}
              </div>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 text-center leading-tight px-1">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
