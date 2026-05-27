"use client";

import Link from "next/link";
import {
  BookOpen,
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
  AlertCircle,
  Search,
  PlusCircle,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { useClientBookings } from "@/hooks/bookings/useBooking";
import { useMyRequestsAsClient } from "@/hooks/requests/useProviderRequest";
import { Booking, BookingStatus } from "@/types/booking.types";
import { ProviderRequest, RequestStatus } from "@/types/provider.request.types";
import { useAuth } from "@/hooks/auth/useAuth";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";

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
    label: "Awaiting Your Review",
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

// ─── Request status config ────────────────────────────────────────────────────

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

function RecentBookingRow({ booking }: { booking: Booking }) {
  const cfg = BOOKING_STATUS_CFG[booking.status];
  return (
    <Link
      href={`/bookings/${booking._id}`}
      className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      {cfg.accent && (
        <span className={`w-1 h-8 rounded-full bg-linear-to-b ${cfg.accent} shrink-0`} />
      )}
      {!cfg.accent && (
        <span className={`w-1 h-8 rounded-full ${cfg.dot} shrink-0`} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
          {booking.serviceDescription || `Booking #${shortId(booking._id)}`}
        </p>
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

function RecentRequestRow({ req }: { req: ProviderRequest }) {
  return (
    <Link
      href={`/requests/${req._id}`}
      className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span className={`w-1 h-8 rounded-full ${REQUEST_STATUS_CFG[req.status].dot} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
          {req.clientMessage || req.taskTitle || `Request #${shortId(req._id)}`}
        </p>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5">
          <RequestStatusBadge status={req.status} />
          <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
            <CalendarDays size={9} />
            {fmtDate(req.schedule?.preferredDate)}
          </span>
          {req.serviceLocation?.ghanaPostGPS && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <MapPin size={9} />
              {req.serviceLocation.ghanaPostGPS}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400 transition-colors shrink-0" />
    </Link>
  );
}

function AlertBanner({
  bookingsNeedReview,
  reschedulePending,
}: {
  bookingsNeedReview: number;
  reschedulePending: number;
}) {
  if (bookingsNeedReview === 0 && reschedulePending === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Action required</p>
        <ul className="mt-1 space-y-0.5">
          {bookingsNeedReview > 0 && (
            <li className="text-xs text-amber-700 dark:text-amber-400">
              {bookingsNeedReview} booking{bookingsNeedReview > 1 ? "s need" : " needs"} your review — provider submitted proof
            </li>
          )}
          {reschedulePending > 0 && (
            <li className="text-xs text-amber-700 dark:text-amber-400">
              {reschedulePending} reschedule proposal{reschedulePending > 1 ? "s" : ""} waiting for your response
            </li>
          )}
        </ul>
      </div>
      <Link
        href="/my-bookings"
        className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1"
      >
        View <ArrowRight size={11} />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const { isAuthenticated } = useAuth();
  useProfile(isAuthenticated);

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useClientBookings();

  const {
    data: requests,
    loading: requestsLoading,
    error: requestsError,
  } = useMyRequestsAsClient();

  const isLoading = bookingsLoading || requestsLoading;

  // Computed stats
  // (profile used for future personalization; currently only loaded to warm cache)
  const totalBookings = bookings?.length ?? 0;
  const activeBookings =
    bookings?.filter((b) =>
      [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(b.status),
    ).length ?? 0;
  const awaitingReview =
    bookings?.filter((b) => b.status === BookingStatus.AWAITING_VALIDATION).length ?? 0;
  const pendingRequests =
    requests?.filter((r) => r.status === RequestStatus.PENDING).length ?? 0;
  const completedBookings =
    bookings?.filter((b) => b.status === BookingStatus.COMPLETED).length ?? 0;

  const reschedulePending =
    requests?.filter((r) => r.status === RequestStatus.RESCHEDULED).length ?? 0;

  const recentBookings = bookings?.slice(0, 4) ?? [];
  const recentRequests = requests?.slice(0, 4) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
            {getGreeting()}
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Here&apos;s a summary of your activity
          </p>
        </div>
        <Link
          href="/providers"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
        >
          <Search size={13} />
          Find a provider
        </Link>
      </div>

      {/* Action banner */}
      {!isLoading && (
        <AlertBanner
          bookingsNeedReview={awaitingReview}
          reschedulePending={reschedulePending}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Active Bookings"
          value={activeBookings}
          accent="bg-sky-400"
          loading={bookingsLoading}
        />
        <StatCard
          label="Needs Review"
          value={awaitingReview}
          accent="bg-amber-400"
          loading={bookingsLoading}
        />
        <StatCard
          label="Pending Requests"
          value={pendingRequests}
          accent="bg-violet-400"
          loading={requestsLoading}
        />
        <StatCard
          label="Completed"
          value={completedBookings}
          accent="bg-teal-400"
          loading={bookingsLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Bookings */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <BookOpen size={14} className="text-stone-500 dark:text-stone-400" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">Recent Bookings</h2>
              {totalBookings > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  {totalBookings}
                </span>
              )}
            </div>
            <Link
              href="/my-bookings"
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
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">No bookings yet</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 max-w-48 leading-relaxed">
                Find a provider and send a request to get started
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && recentBookings.length > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentBookings.map((b) => (
                <RecentBookingRow key={b._id} booking={b} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Send size={14} className="text-stone-500 dark:text-stone-400" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">Recent Requests</h2>
              {(requests?.length ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  {requests?.length}
                </span>
              )}
            </div>
            <Link
              href="/my-requests"
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={11} />
            </Link>
          </div>

          {requestsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-stone-50 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          )}

          {requestsError && !requestsLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{requestsError}</p>
            </div>
          )}

          {!requestsLoading && !requestsError && recentRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
                <Inbox size={18} className="text-stone-400" />
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">No requests sent</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 max-w-48 leading-relaxed">
                Browse providers and send a service request
              </p>
            </div>
          )}

          {!requestsLoading && !requestsError && recentRequests.length > 0 && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentRequests.map((r) => (
                <RecentRequestRow key={r._id} req={r} />
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
            href="/providers"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <Search size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Find Provider</span>
          </Link>

          <Link
            href="/services"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 transition-colors">
              <PlusCircle size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Browse Services</span>
          </Link>

          <Link
            href="/my-bookings"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">My Bookings</span>
          </Link>

          <Link
            href="/my-requests"
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
              <Send size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">My Requests</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
