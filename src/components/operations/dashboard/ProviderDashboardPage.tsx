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
    year: "numeric",
  });
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

// ─── Booking status config ────────────────────────────────────────────────────

const BOOKING_STATUS_CFG: Record<
  BookingStatus,
  { label: string; icon: React.ReactNode; classes: string; dot: string; accent?: string }
> = {
  [BookingStatus.CONFIRMED]: {
    label: "Confirmed",
    icon: <CheckCircle2 size={11} />,
    classes: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    accent: "from-emerald-400 to-teal-400",
  },
  [BookingStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <Wrench size={11} />,
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
  },
  [BookingStatus.AWAITING_VALIDATION]: {
    label: "Awaiting Validation",
    icon: <Clock size={11} />,
    classes: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
    accent: "from-amber-400 to-orange-400",
  },
  [BookingStatus.DISPUTED]: {
    label: "Disputed",
    icon: <AlertTriangle size={11} />,
    classes: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-500",
    accent: "from-red-400 to-rose-400",
  },
  [BookingStatus.REBUTTAL_SUBMITTED]: {
    label: "Under Review",
    icon: <MessageSquare size={11} />,
    classes: "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500 animate-pulse",
    accent: "from-violet-400 to-purple-400",
  },
  [BookingStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={11} />,
    classes: "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
  },
  [BookingStatus.RESOLVED]: {
    label: "Resolved",
    icon: <Shield size={11} />,
    classes: "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  [BookingStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={11} />,
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
};

const REQUEST_STATUS_CFG: Record<
  RequestStatus,
  { label: string; icon: React.ReactNode; classes: string; dot: string }
> = {
  [RequestStatus.PENDING]: {
    label: "Pending",
    icon: <Clock size={11} />,
    classes: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
  },
  [RequestStatus.ACCEPTED]: {
    label: "Accepted",
    icon: <CheckCircle2 size={11} />,
    classes: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
  },
  [RequestStatus.REJECTED]: {
    label: "Rejected",
    icon: <XCircle size={11} />,
    classes: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-400",
  },
  [RequestStatus.RESCHEDULED]: {
    label: "Reschedule Proposed",
    icon: <CalendarDays size={11} />,
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
  },
  [RequestStatus.EXPIRED]: {
    label: "Expired",
    icon: <Clock size={11} />,
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={11} />,
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={11} />,
    classes: "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
  },
};

// ─── Provider status config ────────────────────────────────────────────────────

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
    badge: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700",
    pulse: true,
  },
  booked: {
    label: "Booked",
    dot: "bg-amber-500",
    badge: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
    pulse: false,
  },
  requested: {
    label: "Requested",
    dot: "bg-sky-500",
    badge: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700",
    pulse: false,
  },
  closed: {
    label: "Closed",
    dot: "bg-gray-400",
    badge: "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    pulse: false,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const cfg = REQUEST_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
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
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4">
      <div className={`w-1.5 h-5 rounded-full ${accent} mb-3`} />
      {loading ? (
        <div className="h-8 w-12 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
      )}
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{label}</p>
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
      className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      {cfg.accent ? (
        <span className={`w-1 h-8 rounded-full bg-linear-to-b ${cfg.accent} shrink-0`} />
      ) : (
        <span className={`w-1 h-8 rounded-full ${cfg.dot} shrink-0`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
            {booking.serviceDescription || `Job #${shortId(booking._id)}`}
          </p>
          {needsAction && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
              Action
            </span>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5">
          <BookingStatusBadge status={booking.status} />
          <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
            <CalendarDays size={9} />
            {fmtDate(booking.scheduledDate)}
          </span>
          {(booking.finalPrice ?? booking.estimatedPrice) !== undefined && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <DollarSign size={9} />
              {booking.currency} {(booking.finalPrice ?? booking.estimatedPrice)!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400 transition-colors shrink-0" />
    </Link>
  );
}

function PendingRequestRow({ req }: { req: ProviderRequest }) {
  return (
    <Link
      href={`/requests/${req._id}`}
      className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span className="w-1 h-8 rounded-full bg-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
          {req.clientMessage || req.taskTitle || `Request #${shortId(req._id)}`}
        </p>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5">
          <RequestStatusBadge status={req.status} />
          {req.schedule?.preferredDate && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <CalendarDays size={9} />
              {fmtDate(req.schedule.preferredDate)}
            </span>
          )}
          {req.serviceLocation?.ghanaPostGPS && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <MapPin size={9} />
              {req.serviceLocation.ghanaPostGPS}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
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
  if (pendingCount === 0 && activeJobsCount === 0 && disputedCount === 0) return null;
  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 flex items-start gap-3">
      <Bell size={16} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">You have items needing attention</p>
        <ul className="mt-1 space-y-0.5">
          {pendingCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {pendingCount} new client request{pendingCount > 1 ? "s" : ""} waiting for your response
            </li>
          )}
          {activeJobsCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {activeJobsCount} active job{activeJobsCount > 1 ? "s" : ""} in progress
            </li>
          )}
          {disputedCount > 0 && (
            <li className="text-xs text-sky-700 dark:text-sky-400">
              {disputedCount} disputed booking{disputedCount > 1 ? "s" : ""} — consider submitting a rebuttal
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const { data: providerProfile, loading: profileLoading } = useMyProviderProfile();
  const profileId = providerProfile?._id ? String(providerProfile._id) : null;
  const { data: services } = useServiceOfferings(profileId);
  const { profile: userProfile } = useProfile();
  const avatarUrl = isPopulatedPicture(userProfile?.profilePictureId)
    ? userProfile.profilePictureId.thumbnailUrl || userProfile.profilePictureId.url
    : undefined;

  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useProviderBookings();
  const { data: pendingRequests, loading: pendingLoading, error: pendingError } = useMyPendingRequests();
  const { data: allRequests, loading: allRequestsLoading } = useMyRequestsAsProvider();

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

  // Computed stats
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

  const recentBookings = bookings?.slice(0, 4) ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStatus = (providerProfile as any).status ?? (providerProfile as any).ProviderStatus;
  const statusCfg = rawStatus ? PROVIDER_STATUS_CFG[String(rawStatus).toLowerCase()] ?? null : null;

  const businessName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (providerProfile as any).businessName ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (providerProfile as any).displayName ??
    "Provider";

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={businessName}
                className="w-12 h-12 rounded-2xl object-cover border border-stone-200 dark:border-stone-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-stone-200 dark:border-stone-700">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{initials}</span>
              </div>
            )}
            {statusCfg && (
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-900 ${statusCfg.dot}`} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              {getGreeting()}
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500">{businessName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusCfg && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1 ${statusCfg.badge}`}>
              <span className="relative flex h-2 w-2 shrink-0">
                {statusCfg.pulse && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.dot}`} />
              </span>
              {statusCfg.label}
            </span>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <ExternalLink size={12} />
            Profile
          </Link>
        </div>
      </div>

      {/* Action banner */}
      {!bookingsLoading && !pendingLoading && (
        <ActionBanner
          pendingCount={pendingCount}
          activeJobsCount={activeJobs}
          disputedCount={disputedJobs}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Jobs */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Briefcase size={14} className="text-stone-500 dark:text-stone-400" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">Recent Jobs</h2>
              {(bookings?.length ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  {bookings?.length}
                </span>
              )}
            </div>
            <Link
              href="/provider/bookings"
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={11} />
            </Link>
          </div>

          {bookingsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-stone-50 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          )}

          {bookingsError && !bookingsLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{bookingsError}</p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && recentBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
                <Inbox size={18} className="text-stone-400" />
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">No jobs yet</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 max-w-48 leading-relaxed">
                Accept a client request to get your first booking
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && recentBookings.length > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentBookings.map((b) => (
                <RecentJobRow key={b._id} booking={b} />
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Send size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">Pending Requests</h2>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  {pendingCount}
                </span>
              )}
            </div>
            <Link
              href="/provider/requests"
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={11} />
            </Link>
          </div>

          {pendingLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-stone-50 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          )}

          {pendingError && !pendingLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{pendingError}</p>
            </div>
          )}

          {!pendingLoading && !pendingError && (pendingRequests?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
                <Inbox size={18} className="text-stone-400" />
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">No pending requests</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 max-w-48 leading-relaxed">
                New client requests will appear here
              </p>
            </div>
          )}

          {!pendingLoading && !pendingError && (pendingRequests?.length ?? 0) > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {(pendingRequests ?? []).slice(0, 4).map((r) => (
                <PendingRequestRow key={r._id} req={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-5">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/provider/requests"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
              <Send size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">My Requests</span>
          </Link>

          <Link
            href="/provider/bookings"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/40 transition-colors">
              <Play size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">My Jobs</span>
          </Link>

          <Link
            href="/provider/services"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 transition-colors">
              <FileCheck size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">My Services</span>
            {(services?.length ?? 0) > 0 && (
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                {services?.length} listed
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <ExternalLink size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Business Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
