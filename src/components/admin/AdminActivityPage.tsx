"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useBookingStats } from "@/hooks/booking/useBookings";
import { useAllBookings } from "@/hooks/booking/useBookings";
import {
  useAdminOpenDisputes,
  useAdminPendingRebuttals,
  useAdminResolveDispute,
} from "@/hooks/bookings/useCompletionAttempt";
import {
  CompletionAttempt,
  AdminResolutionOutcome,
} from "@/types/completion-attempt.types";
import { BookingStatus } from "@/types/booking/booking.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  AWAITING_VALIDATION:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  VALIDATED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  DISPUTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  REBUTTAL_SUBMITTED:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  RESOLVED:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  CANCELLED:
    "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

const PAGE_SIZE = 15;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          {label}
        </p>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}
        >
          <Icon size={14} />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse bg-stone-100 dark:bg-stone-800 rounded-xl ${className}`}
    />
  );
}

// ─── Resolve Panel ────────────────────────────────────────────────────────────

const OUTCOME_CONFIG: Record<
  AdminResolutionOutcome,
  { label: string; className: string }
> = {
  [AdminResolutionOutcome.PROVIDER_FAVOUR]: {
    label: "Favour Provider",
    className:
      "border-green-300 dark:border-green-700/60 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100",
  },
  [AdminResolutionOutcome.CLIENT_FAVOUR]: {
    label: "Favour Client",
    className:
      "border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100",
  },
  [AdminResolutionOutcome.REDO]: {
    label: "Order Redo",
    className:
      "border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100",
  },
  [AdminResolutionOutcome.SPLIT]: {
    label: "Split Payment",
    className:
      "border-blue-300 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100",
  },
};

function ResolvePanel({
  attemptId,
  onResolved,
}: {
  attemptId: string;
  onResolved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdminResolutionOutcome | null>(null);
  const [notes, setNotes] = useState("");

  const { mutate, loading } = useAdminResolveDispute({
    onSuccess: () => {
      toast.success("Dispute resolved");
      onResolved();
    },
    onError: (err) => toast.error(err),
  });

  return (
    <div className="border-t border-stone-100 dark:border-stone-800 mt-2 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <Shield size={11} />
        Admin Resolution
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(OUTCOME_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() =>
                  setSelected(
                    selected === key
                      ? null
                      : (key as AdminResolutionOutcome),
                  )
                }
                className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${cfg.className} ${selected === key ? "ring-2 ring-offset-1 ring-current" : ""}`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution notes (optional)"
            rows={2}
            className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() =>
              selected && mutate({ attemptId, outcome: selected, notes: notes.trim() || undefined })
            }
            disabled={!selected || loading}
            className="w-full py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold disabled:opacity-40 transition-opacity"
          >
            {loading ? "Resolving…" : "Confirm Resolution"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Attempt Card ─────────────────────────────────────────────────────────────

function AttemptCard({
  attempt,
  onResolved,
}: {
  attempt: CompletionAttempt;
  onResolved: () => void;
}) {
  const bookingId =
    typeof attempt.bookingId === "string" ? attempt.bookingId : attempt._id;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
            Attempt #{attempt.attemptNumber}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            {fmtDate(attempt.createdAt)}
          </p>
        </div>
        <Link
          href={`/admin/bookings/${bookingId}`}
          className="shrink-0 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
        >
          View booking
          <ExternalLink size={10} />
        </Link>
      </div>
      {attempt.dispute?.reason && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-1">
          <span className="font-semibold">Dispute: </span>
          {attempt.dispute.reason}
        </p>
      )}
      {attempt.rebuttal?.message && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
          <span className="font-semibold">Rebuttal: </span>
          {attempt.rebuttal.message}
        </p>
      )}
      <ResolvePanel attemptId={attempt._id} onResolved={onResolved} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useBookingStats();

  const {
    data: bookingsData,
    loading: bookingsLoading,
    refetch: refetchBookings,
  } = useAllBookings(
    {
      status: statusFilter || undefined,
      limit: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    },
    { enabled: true },
  );

  const {
    data: disputes,
    loading: disputesLoading,
    refetch: refetchDisputes,
  } = useAdminOpenDisputes();

  const {
    data: rebuttals,
    loading: rebuttalsLoading,
    refetch: refetchRebuttals,
  } = useAdminPendingRebuttals();

  const totalPages = Math.ceil((bookingsData?.total ?? 0) / PAGE_SIZE);

  const refetchAll = () => {
    refetchStats();
    refetchBookings();
    refetchDisputes();
    refetchRebuttals();
  };

  const STATUS_FILTERS: { label: string; value: string }[] = [
    { label: "All", value: "" },
    { label: "Confirmed", value: BookingStatus.CONFIRMED },
    { label: "In Progress", value: BookingStatus.IN_PROGRESS },
    { label: "Awaiting Validation", value: BookingStatus.AWAITING_VALIDATION },
    { label: "Disputed", value: BookingStatus.DISPUTED },
    { label: "Rebuttal", value: BookingStatus.REBUTTAL_SUBMITTED },
    { label: "Completed", value: BookingStatus.COMPLETED },
    { label: "Cancelled", value: BookingStatus.CANCELLED },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              Activity
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Live booking activity, disputes, and rebuttals
          </p>
        </div>
        <button
          onClick={refetchAll}
          className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Bookings"
              value={fmt(stats?.total)}
              icon={Briefcase}
              accent="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="In Progress"
              value={fmt(stats?.IN_PROGRESS)}
              icon={Clock}
              accent="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Awaiting Validation"
              value={fmt(stats?.AWAITING_VALIDATION)}
              icon={Clock}
              accent="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
            />
            <StatCard
              label="Open Disputes"
              value={fmt(stats?.openDisputes)}
              icon={AlertTriangle}
              accent="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
            />
            <StatCard
              label="Pending Rebuttals"
              value={fmt(stats?.pendingRebuttals)}
              icon={MessageSquare}
              accent="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
            />
            <StatCard
              label="Completed"
              value={fmt(stats?.COMPLETED)}
              icon={CheckCircle}
              accent="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Confirmed"
              value={fmt(stats?.CONFIRMED)}
              icon={Briefcase}
              accent="bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400"
            />
            <StatCard
              label="Cancelled"
              value={fmt(stats?.CANCELLED)}
              icon={XCircle}
              accent="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
            />
          </>
        )}
      </div>

      {/* Open Disputes & Pending Rebuttals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Disputes */}
        <div>
          <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle size={11} />
            Open Disputes
            {disputes && disputes.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {disputes.length}
              </span>
            )}
          </p>
          {disputesLoading ? (
            <Skeleton className="h-40" />
          ) : !disputes?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400 dark:text-stone-500 rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900">
              <Inbox size={28} className="mb-2" />
              <p className="text-sm">No open disputes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((attempt) => (
                <AttemptCard
                  key={attempt._id}
                  attempt={attempt}
                  onResolved={refetchAll}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Rebuttals */}
        <div>
          <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare size={11} />
            Pending Rebuttals
            {rebuttals && rebuttals.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {rebuttals.length}
              </span>
            )}
          </p>
          {rebuttalsLoading ? (
            <Skeleton className="h-40" />
          ) : !rebuttals?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400 dark:text-stone-500 rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900">
              <Inbox size={28} className="mb-2" />
              <p className="text-sm">No pending rebuttals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rebuttals.map((attempt) => (
                <AttemptCard
                  key={attempt._id}
                  attempt={attempt}
                  onResolved={refetchAll}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            Bookings
          </p>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(0);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  statusFilter === f.value
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
          {bookingsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : !bookingsData?.bookings?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 dark:text-stone-500">
              <Inbox size={32} className="mb-2" />
              <p className="text-sm">No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800 text-left">
                      <th className="px-4 py-3 font-semibold text-stone-500 dark:text-stone-400">
                        Booking #
                      </th>
                      <th className="px-4 py-3 font-semibold text-stone-500 dark:text-stone-400">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-stone-500 dark:text-stone-400 hidden sm:table-cell">
                        Scheduled
                      </th>
                      <th className="px-4 py-3 font-semibold text-stone-500 dark:text-stone-400 hidden md:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {bookingsData.bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-stone-700 dark:text-stone-300">
                          {booking.bookingNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {booking.status && (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[booking.status] ?? "bg-stone-100 text-stone-600"}`}
                            >
                              {booking.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">
                          {booking.scheduledDate
                            ? new Date(booking.scheduledDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" },
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-500 dark:text-stone-400 hidden md:table-cell">
                          {fmtDate(booking.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/bookings/${booking._id}`}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
                          >
                            View
                            <ExternalLink size={10} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-[11px] text-stone-400 dark:text-stone-500">
                    Page {page + 1} of {totalPages} ·{" "}
                    {bookingsData.total ?? 0} total
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
