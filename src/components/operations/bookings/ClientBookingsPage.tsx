"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Star,
  Shield,
  Ban,
  CalendarDays,
  MapPin,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  Inbox,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  useClientBookings,
  useCancelBooking,
  useRespondToProof,
} from "@/hooks/bookings/useBooking";
import { Booking, BookingStatus } from "@/types/booking.types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
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

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = "all" | BookingStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: BookingStatus.CONFIRMED, label: "Confirmed" },
  { id: BookingStatus.IN_PROGRESS, label: "In Progress" },
  { id: BookingStatus.AWAITING_VALIDATION, label: "Needs Review" },
  { id: BookingStatus.DISPUTED, label: "Disputed" },
  { id: BookingStatus.COMPLETED, label: "Completed" },
  { id: BookingStatus.CANCELLED, label: "Cancelled" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  bookingId,
  onClose,
  onCancelled,
}: {
  bookingId: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const { mutate: cancel, loading, error } = useCancelBooking({
    onSuccess: () => { onCancelled(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Cancel booking?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              The provider will be notified. This cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="ml-auto text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation (required)"
          rows={3}
          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 mb-3 resize-none"
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3">
            <AlertCircle size={12} className="shrink-0" />{error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={() => cancel({ bookingId, reason: reason.trim() })}
            disabled={loading || !reason.trim()}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Respond to proof dialog ──────────────────────────────────────────────────

function RespondProofDialog({
  bookingId,
  onClose,
  onResponded,
}: {
  bookingId: string;
  onClose: () => void;
  onResponded: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "dispute" | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const { mutate: respond, loading, error } = useRespondToProof({
    onSuccess: () => { onResponded(); onClose(); },
  });

  const canSubmit =
    decision === "approve"
      ? rating >= 1 && rating <= 5
      : decision === "dispute"
      ? !!disputeReason.trim()
      : false;

  const handleSubmit = () => {
    if (!decision) return;
    if (decision === "approve") {
      respond({
        bookingId,
        body: { approved: true, rating, review: review.trim() || undefined },
      });
    } else {
      respond({
        bookingId,
        body: { approved: false, disputeReason: disputeReason.trim() },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Review submitted proof</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDecision("approve")}
              className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                decision === "approve"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              }`}
            >
              <ThumbsUp size={14} /> Approve
            </button>
            <button
              onClick={() => setDecision("dispute")}
              className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                decision === "dispute"
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              <ThumbsDown size={14} /> Dispute
            </button>
          </div>

          {decision === "approve" && (
            <div className="space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 block">
                  Rating (1–5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${
                        rating >= n
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Leave a review (optional)"
                rows={2}
                className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
          )}

          {decision === "dispute" && (
            <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-3">
              <label className="text-[11px] font-semibold text-red-700 dark:text-red-400 mb-1.5 block">
                Reason for dispute
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why the proof is not acceptable..."
                rows={3}
                className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="shrink-0" />{error}
            </p>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`flex-1 h-10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              !canSubmit
                ? "bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed"
                : decision === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : decision === "approve" ? (
              <><ThumbsUp size={13} /> Approve proof</>
            ) : (
              <><ThumbsDown size={13} /> Submit dispute</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  onRespond,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onRespond: (id: string) => void;
}) {
  const cfg = STATUS_CFG[booking.status];
  const canCancel = booking.status === BookingStatus.CONFIRMED;
  const canRespond = booking.status === BookingStatus.AWAITING_VALIDATION;

  return (
    <div className="group rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden transition-all hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-600">
      {cfg.accent && <div className={`h-0.5 bg-linear-to-r ${cfg.accent}`} />}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={booking.status} />
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                #{shortId(booking._id)}
              </span>
            </div>
            {booking.serviceDescription && (
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 line-clamp-1">
                {booking.serviceDescription}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 shrink-0 mt-0.5">
            <CalendarDays size={11} />
            {fmtDate(booking.scheduledDate)}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {booking.serviceLocation?.ghanaPostGPS && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <MapPin size={10} />
              {booking.serviceLocation.ghanaPostGPS}
            </span>
          )}
          {(booking.finalPrice ?? booking.estimatedPrice) !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <DollarSign size={10} />
              {booking.currency}{" "}
              {(booking.finalPrice ?? booking.estimatedPrice)!.toLocaleString()}
            </span>
          )}
          {booking.scheduledTimeSlot?.start && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <Clock size={10} />
              {booking.scheduledTimeSlot.start}
              {booking.scheduledTimeSlot.end && ` – ${booking.scheduledTimeSlot.end}`}
            </span>
          )}
        </div>

        {canRespond && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2 mb-3 flex items-center gap-2">
            <Clock size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Provider submitted proof — your review is required
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={() => onCancel(booking._id)}
                className="h-8 px-3 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
              >
                <Ban size={12} />
                Cancel
              </button>
            )}
            {canRespond && (
              <button
                onClick={() => onRespond(booking._id)}
                className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} />
                Review proof
              </button>
            )}
          </div>
          <Link
            href={`/bookings/${booking._id}`}
            className="h-8 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
          >
            Details
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-stone-400 dark:text-stone-500" />
      </div>
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
        {filter === "all" ? "No bookings yet" : `No ${filter.toLowerCase().replace("_", " ")} bookings`}
      </p>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
        {filter === "all"
          ? "Your bookings will appear here after a provider accepts your request."
          : "Bookings in this status will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientBookingsPage() {
  const { data: bookings, loading, error, refetch } = useClientBookings();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const filtered =
    !bookings
      ? []
      : activeFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  const counts: Partial<Record<FilterTab, number>> = {};
  if (bookings) {
    counts.all = bookings.length;
    for (const b of bookings) {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    }
  }

  const awaitingCount = bookings?.filter(
    (b) => b.status === BookingStatus.AWAITING_VALIDATION,
  ).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <BookOpen size={18} className="text-stone-400" />
            My Bookings
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Track your service bookings
          </p>
        </div>
        {awaitingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
            <Clock size={11} className="animate-pulse" />
            {awaitingCount} need{awaitingCount === 1 ? "s" : ""} review
          </span>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-6 pb-1">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.id];
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
                isActive
                  ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-stone-900"
                    : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState filter={activeFilter} />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onCancel={setCancellingId}
              onRespond={setRespondingId}
            />
          ))}
        </div>
      )}

      {cancellingId && (
        <CancelDialog
          bookingId={cancellingId}
          onClose={() => setCancellingId(null)}
          onCancelled={refetch}
        />
      )}

      {respondingId && (
        <RespondProofDialog
          bookingId={respondingId}
          onClose={() => setRespondingId(null)}
          onResponded={refetch}
        />
      )}
    </div>
  );
}
