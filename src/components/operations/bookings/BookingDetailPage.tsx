"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Star,
  Shield,
  Ban,
  MapPin,
  DollarSign,
  Loader2,
  AlertCircle,
  X,
  Play,
  ThumbsUp,
  ThumbsDown,
  CalendarClock,
  Navigation,
  ExternalLink,
  Hash,
  User,
  Building2,
  Phone,
  FileText,
  Tag,
  CalendarCheck,
  Printer,
} from "lucide-react";
import {
  useBookingById,
  useBookingAttempts,
  useStartService,
  useSubmitProof,
  useSubmitRebuttal,
  useRespondToProof,
  useCancelBooking,
  useProposeReschedule,
  useRespondToReschedule,
} from "@/hooks/bookings/useBooking";
import { useAuth } from "@/hooks/auth/useAuth";
import { Booking, BookingStatus, BookingDetailContext } from "@/types/booking.types";
import {
  CompletionAttempt,
  AttemptStatus,
} from "@/types/completion-attempt.types";
import { completionAttemptAPI } from "@/lib/api/bookings/completion-attempt.api";
import { useTaskCompletionAttachment } from "@/hooks/files/useTaskCompletionAttachment";
import { ProofUploader } from "@/components/files/ProofUploader";
import { IFile } from "@/types/files.types";
import Image from "next/image";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  BookingStatus,
  { label: string; icon: React.ReactNode; classes: string; dot: string; accent?: string; description: string }
> = {
  [BookingStatus.CONFIRMED]: {
    label: "Confirmed",
    icon: <CheckCircle2 size={14} />,
    classes: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    accent: "from-emerald-400 to-teal-400",
    description: "Provider accepted — service is scheduled",
  },
  [BookingStatus.RESCHEDULE_REQUESTED]: {
    label: "Reschedule Proposed",
    icon: <CalendarClock size={14} />,
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
    description: "A new date has been proposed — awaiting the other party's response",
  },
  [BookingStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <Wrench size={14} />,
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
    description: "Provider has started the service",
  },
  [BookingStatus.AWAITING_VALIDATION]: {
    label: "Awaiting Validation",
    icon: <Clock size={14} />,
    classes: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
    accent: "from-amber-400 to-orange-400",
    description: "Proof submitted — client review required",
  },
  [BookingStatus.DISPUTED]: {
    label: "Disputed",
    icon: <AlertTriangle size={14} />,
    classes: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-500",
    accent: "from-red-400 to-rose-400",
    description: "Client disputed the proof — awaiting provider rebuttal",
  },
  [BookingStatus.REBUTTAL_SUBMITTED]: {
    label: "Under Admin Review",
    icon: <MessageSquare size={14} />,
    classes: "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500 animate-pulse",
    accent: "from-violet-400 to-purple-400",
    description: "Provider rebutted — an admin will make a final ruling",
  },
  [BookingStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={14} />,
    classes: "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
    description: "Service completed and accepted by the client",
  },
  [BookingStatus.RESOLVED]: {
    label: "Resolved",
    icon: <Shield size={14} />,
    classes: "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
    description: "Dispute resolved by admin",
  },
  [BookingStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={14} />,
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
    description: "Booking was cancelled",
  },
};

const ATTEMPT_STATUS_CFG: Record<
  AttemptStatus,
  { label: string; classes: string }
> = {
  [AttemptStatus.PENDING]: { label: "Pending", classes: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-700/50" },
  [AttemptStatus.ACCEPTED]: { label: "Accepted", classes: "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-900/20 dark:border-teal-700/50" },
  [AttemptStatus.DISPUTED]: { label: "Disputed", classes: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-700/50" },
  [AttemptStatus.REBUTTAL_PENDING]: { label: "Rebuttal Submitted", classes: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-900/20 dark:border-violet-700/50" },
  [AttemptStatus.ADMIN_RESOLVED]: { label: "Admin Resolved", classes: "text-stone-600 bg-stone-100 border-stone-200 dark:text-stone-400 dark:bg-stone-800 dark:border-stone-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-stone-50 dark:border-stone-800/60 last:border-0">
      <span className="w-32 shrink-0 text-[11px] font-semibold text-stone-400 dark:text-stone-500 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-xs text-stone-700 dark:text-stone-300">{children}</div>
    </div>
  );
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function CancelDialog({
  bookingId,
  onClose,
  onDone,
}: {
  bookingId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const { mutate: cancelBooking, loading } = useCancelBooking({ onSuccess: () => { onDone(); onClose(); } });

  const handleSubmit = () => cancelBooking({ bookingId, reason: reason.trim() });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Cancel booking?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">A reason is required. This cannot be undone.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-stone-400 hover:text-stone-600 rounded-lg p-1"><X size={16} /></button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation..."
          rows={3}
          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4 resize-none"
        />
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Keep it</button>
          <button onClick={handleSubmit} disabled={loading || !reason.trim()} className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposeRescheduleDialog({
  bookingId,
  onClose,
  onDone,
}: {
  bookingId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");
  const { mutate: propose, loading, error } = useProposeReschedule({ onSuccess: () => { onDone(); onClose(); } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <CalendarClock size={16} className="text-sky-600 dark:text-sky-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Propose new date</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed"><X size={16} /></button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">New date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">Start time (optional)</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">End time (optional)</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">Note (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Reason for the change…"
              rows={2}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3">
            <AlertCircle size={12} className="shrink-0" />{error}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
          <button
            onClick={() => propose({
              bookingId,
              body: {
                newDate,
                newTimeSlot: start ? { start, end: end || start } : undefined,
                message: message.trim() || undefined,
              },
            })}
            disabled={loading || !newDate}
            className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CalendarClock size={13} />}
            Send proposal
          </button>
        </div>
      </div>
    </div>
  );
}

function RespondRescheduleDialog({
  bookingId,
  pendingReschedule,
  onClose,
  onDone,
}: {
  bookingId: string;
  pendingReschedule: NonNullable<import("@/types/booking.types").PendingReschedule>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [counterDate, setCounterDate] = useState("");
  const [counterStart, setCounterStart] = useState("");
  const [counterEnd, setCounterEnd] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"decide" | "counter">("decide");

  const { mutate: respond, loading, error } = useRespondToReschedule({
    onSuccess: () => { onDone(); onClose(); },
  });

  const expiresAt = new Date(pendingReschedule.expiresAt);
  const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3_600_000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <CalendarClock size={14} className="text-sky-600 dark:text-sky-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Reschedule proposed</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Proposed schedule */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-900/10 px-4 py-3 space-y-1.5">
            <p className="text-xs font-bold text-sky-800 dark:text-sky-200">
              {new Date(pendingReschedule.newDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            {pendingReschedule.newTimeSlot?.start && (
              <p className="text-xs text-sky-700 dark:text-sky-300">
                {pendingReschedule.newTimeSlot.start}
                {pendingReschedule.newTimeSlot.end && ` – ${pendingReschedule.newTimeSlot.end}`}
              </p>
            )}
            {pendingReschedule.message && (
              <p className="text-xs text-sky-600 dark:text-sky-400 italic">&ldquo;{pendingReschedule.message}&rdquo;</p>
            )}
            <p className="text-[10px] text-sky-500 dark:text-sky-500">
              Expires in {hoursLeft}h
            </p>
          </div>

          {mode === "decide" ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => respond({ bookingId, body: { action: "accept" } })}
                  disabled={loading}
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} /> Accept
                </button>
                <button
                  onClick={() => respond({ bookingId, body: { action: "reject" } })}
                  disabled={loading}
                  className="h-10 rounded-xl border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={13} /> Reject
                </button>
                <button
                  onClick={() => setMode("counter")}
                  disabled={loading}
                  className="h-10 rounded-xl border border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-400 text-[12px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CalendarClock size={13} /> Counter
                </button>
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
                  <Loader2 size={13} className="animate-spin" /> Processing…
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Your preferred date</label>
                  <input
                    type="date"
                    value={counterDate}
                    onChange={(e) => setCounterDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">Start time</label>
                    <input type="time" value={counterStart} onChange={(e) => setCounterStart(e.target.value)} className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">End time</label>
                    <input type="time" value={counterEnd} onChange={(e) => setCounterEnd(e.target.value)} className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                  </div>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why (optional)…"
                  rows={2}
                  className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMode("decide")} disabled={loading} className="h-9 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Back</button>
                <button
                  onClick={() => respond({
                    bookingId,
                    body: {
                      action: "counter",
                      newDate: counterDate,
                      newTimeSlot: counterStart ? { start: counterStart, end: counterEnd || counterStart } : undefined,
                      message: message.trim() || undefined,
                    },
                  })}
                  disabled={loading || !counterDate}
                  className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <CalendarClock size={13} />}
                  Send counter
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="shrink-0" />{error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RespondProofDialog({
  bookingId,
  onClose,
  onDone,
}: {
  bookingId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "dispute" | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const { mutate: respond, loading, error } = useRespondToProof({ onSuccess: () => { onDone(); onClose(); } });

  const canSubmit = decision === "approve" ? rating >= 1 : decision === "dispute" ? !!disputeReason.trim() : false;

  const handleSubmit = () => {
    if (!decision) return;
    respond({
      bookingId,
      body: decision === "approve"
        ? { approved: true, rating, review: review.trim() || undefined }
        : { approved: false, disputeReason: disputeReason.trim() },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Review proof</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 rounded-lg p-1"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDecision("approve")} className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${decision === "approve" ? "bg-emerald-600 border-emerald-600 text-white" : "border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}>
              <ThumbsUp size={14} /> Approve
            </button>
            <button onClick={() => setDecision("dispute")} className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${decision === "dispute" ? "bg-red-600 border-red-600 text-white" : "border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"}`}>
              <ThumbsDown size={14} /> Dispute
            </button>
          </div>
          {decision === "approve" && (
            <div className="space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 block">Rating (1–5)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${rating >= n ? "bg-amber-400 border-amber-400 text-white" : "border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-300"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Leave a review (optional)" rows={2} className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
            </div>
          )}
          {decision === "dispute" && (
            <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-3">
              <label className="text-[11px] font-semibold text-red-700 dark:text-red-400 mb-1.5 block">Reason for dispute</label>
              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Explain why the proof is unacceptable..." rows={3} className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
          )}
          {error && <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"><AlertCircle size={12} className="shrink-0" />{error}</p>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} disabled={loading} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || loading} className={`flex-1 h-10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${!canSubmit ? "bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed" : decision === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : decision === "approve" ? <><ThumbsUp size={13} /> Approve</> : <><ThumbsDown size={13} /> Dispute</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Proof image grid ─────────────────────────────────────────────────────────

function ProofImageGrid({ attemptId }: { attemptId: string }) {
  const { proofs, isLoading } = useTaskCompletionAttachment(attemptId);

  if (isLoading) return (
    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 py-1">
      <Loader2 size={11} className="animate-spin" />
      Loading images…
    </div>
  );

  if (!proofs.length) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {proofs.map((img) => (
        <a
          key={img._id}
          href={img.url}
          target="_blank"
          rel="noreferrer"
          className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:opacity-90 transition-opacity"
        >
          <Image
            src={img.thumbnailUrl ?? img.url}
            alt={img.fileName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 120px"
          />
        </a>
      ))}
    </div>
  );
}

// ─── Attempt card ─────────────────────────────────────────────────────────────

function AttemptCard({ attempt }: { attempt: CompletionAttempt }) {
  const statusCfg = ATTEMPT_STATUS_CFG[attempt.status];
  const hasImages = !!(attempt.proof.images?.length);

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[12px] font-bold text-stone-700 dark:text-stone-300">
          Attempt #{attempt.attemptNumber}
        </p>
        <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Proof */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Proof</p>
          {attempt.proof.notes ? (
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{attempt.proof.notes}</p>
          ) : (
            <p className="text-xs text-stone-400 dark:text-stone-500 italic">No notes provided.</p>
          )}
          {hasImages && <ProofImageGrid attemptId={attempt._id} />}
          <p className="text-[10px] text-stone-400 dark:text-stone-500">
            Submitted {fmtDateTime(attempt.proof.submittedAt)}
          </p>
        </div>

        {/* Client response */}
        {attempt.clientResponse && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Client response</p>
            <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/50 dark:bg-teal-900/10 px-4 py-3 space-y-1.5">
              {attempt.clientResponse.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={n <= attempt.clientResponse!.rating! ? "text-amber-400 fill-amber-400" : "text-stone-300 dark:text-stone-600"}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">{attempt.clientResponse.rating}/5</span>
                </div>
              )}
              {attempt.clientResponse.review && (
                <p className="text-xs text-teal-800 dark:text-teal-200 italic">&ldquo;{attempt.clientResponse.review}&rdquo;</p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                Responded {fmtDateTime(attempt.clientResponse.respondedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Dispute */}
        {attempt.dispute && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Dispute</p>
            <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 px-4 py-3 space-y-1.5">
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{attempt.dispute.reason}</p>
              {attempt.dispute.evidence && attempt.dispute.evidence.length > 0 && (
                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  {attempt.dispute.evidence.length} evidence file(s) attached
                </p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                Raised {fmtDateTime(attempt.dispute.raisedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Rebuttal */}
        {attempt.rebuttal && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Provider rebuttal</p>
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 px-4 py-3 space-y-1.5">
              <p className="text-xs text-violet-800 dark:text-violet-200 leading-relaxed">{attempt.rebuttal.message}</p>
              {attempt.rebuttal.attachments && attempt.rebuttal.attachments.length > 0 && (
                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  {attempt.rebuttal.attachments.length} attachment(s)
                </p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                Submitted {fmtDateTime(attempt.rebuttal.submittedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Admin resolution */}
        {attempt.adminResolution && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Admin resolution</p>
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 capitalize">
                {attempt.adminResolution.outcome.replace(/_/g, " ").toLowerCase()}
              </p>
              {attempt.adminResolution.notes && (
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{attempt.adminResolution.notes}</p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                Resolved {fmtDateTime(attempt.adminResolution.resolvedAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Completion attempts section ──────────────────────────────────────────────

function CompletionAttemptsSection({ bookingId }: { bookingId: string }) {
  const { data: attempts, loading, error } = useBookingAttempts(bookingId);

  if (loading) return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 px-5 py-8 flex items-center justify-center">
      <Loader2 size={16} className="animate-spin text-stone-400" />
    </div>
  );

  if (error || !attempts?.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 px-1">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Completion attempts
        </p>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
          {attempts.length}
        </span>
      </div>
      {attempts.map((attempt: CompletionAttempt) => (
        <AttemptCard key={attempt._id} attempt={attempt} />
      ))}
    </div>
  );
}

// ─── Detail body ──────────────────────────────────────────────────────────────

type DialogType = "cancel" | "propose-reschedule" | "respond-reschedule" | "start" | "proof" | "rebuttal" | "respond";

function BookingDetail({
  booking,
  context,
}: {
  booking: Booking;
  context?: BookingDetailContext;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState<DialogType | null>(null);


  // Prefer server-determined viewer role; fall back to ID comparison
  const serverViewer = context?.viewer;
  const viewer: "client" | "provider" =
    serverViewer === "client" || serverViewer === "provider"
      ? serverViewer
      : String(user?.id) === String(booking.clientId)
      ? "client"
      : "provider";

  const cfg = STATUS_CFG[booking.status];
  const close = () => setOpenDialog(null);
  const refresh = () => { close(); router.refresh(); };

  const isClient = viewer === "client";
  const isProvider = viewer === "provider";

  const mapsUrl = booking.serviceLocation?.ghanaPostGPS
    ? `https://www.google.com/maps/search/${encodeURIComponent(booking.serviceLocation.ghanaPostGPS + " Ghana")}`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Nav row — hidden when printing */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-[12px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <Printer size={13} />
          Print / Save PDF
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-stone-200">
        <p className="text-xl font-bold text-stone-900">Booking Receipt</p>
        <p className="text-sm text-stone-500 mt-1">
          Ref: {booking.bookingNumber || booking._id.slice(-8).toUpperCase()}
          {" · "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl border p-4 mb-5 flex items-center gap-3 ${cfg.classes}`}>
        <span className={`w-9 h-9 rounded-full flex items-center justify-center ${cfg.classes}`}>
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{cfg.label}</p>
          <p className="text-[11px] opacity-70">{cfg.description}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Action bar — hidden when printing */}
      <div className="flex flex-wrap gap-2 mb-5 print:hidden">
        {isProvider && booking.status === BookingStatus.CONFIRMED && (
          <>
            <button onClick={() => setOpenDialog("start")} className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
              <Play size={14} /> Start job
            </button>
            <button onClick={() => setOpenDialog("propose-reschedule")} className="h-10 px-4 rounded-xl border border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-400 text-[12px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors flex items-center gap-2">
              <CalendarClock size={14} /> Propose reschedule
            </button>
          </>
        )}
        {isProvider && booking.status === BookingStatus.RESCHEDULE_REQUESTED &&
          booking.pendingReschedule?.proposedBy === "client" && (
          <button onClick={() => setOpenDialog("respond-reschedule")} className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
            <CalendarClock size={14} /> Respond to reschedule
          </button>
        )}
        {isProvider && booking.status === BookingStatus.IN_PROGRESS && (
          <button onClick={() => setOpenDialog("proof")} className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
            <CheckCircle2 size={14} /> Mark job complete
          </button>
        )}
        {isProvider && booking.status === BookingStatus.DISPUTED && (
          <button onClick={() => setOpenDialog("rebuttal")} className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
            <MessageSquare size={14} /> Submit rebuttal
          </button>
        )}

        {isClient && booking.status === BookingStatus.AWAITING_VALIDATION && (
          <button onClick={() => setOpenDialog("respond")} className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
            <CheckCircle2 size={14} /> Review proof
          </button>
        )}
        {isClient && booking.status === BookingStatus.CONFIRMED && (
          <>
            <button onClick={() => setOpenDialog("propose-reschedule")} className="h-10 px-4 rounded-xl border border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-400 text-[12px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors flex items-center gap-2">
              <CalendarClock size={14} /> Propose reschedule
            </button>
            <button onClick={() => setOpenDialog("cancel")} className="h-10 px-4 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
              <Ban size={14} /> Cancel
            </button>
          </>
        )}
        {isClient && booking.status === BookingStatus.RESCHEDULE_REQUESTED &&
          booking.pendingReschedule?.proposedBy === "provider" && (
          <button onClick={() => setOpenDialog("respond-reschedule")} className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2">
            <CalendarClock size={14} /> Respond to reschedule
          </button>
        )}
        {booking.status === BookingStatus.RESCHEDULE_REQUESTED && (
          <button onClick={() => setOpenDialog("cancel")} className="h-10 px-4 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
            <Ban size={14} /> Cancel booking
          </button>
        )}


      </div>

      <div className="space-y-4">
        {/* Party info — provider details for client, client details for provider */}
        {viewer === "client" && context?.providerDetails && (
          <Section title="Provider">
            {context.providerDetails.profilePicture?.url && (
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={context.providerDetails.profilePicture.thumbnailUrl ?? context.providerDetails.profilePicture.url}
                  alt="Provider"
                  className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                  width={20}
                  height={20}
                />
                {context.providerDetails.businessName && (
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{context.providerDetails.businessName}</p>
                )}
              </div>
            )}
            {!context.providerDetails.profilePicture?.url && context.providerDetails.businessName && (
              <Row label="Business">
                <span className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-stone-400" />
                  {context.providerDetails.businessName}
                </span>
              </Row>
            )}
            {context.providerDetails.mainContact && (
              <Row label="Contact">
                <span className="flex items-center gap-1.5">
                  <Phone size={11} className="text-stone-400" />
                  {context.providerDetails.mainContact}
                </span>
              </Row>
            )}
          </Section>
        )}

        {viewer === "provider" && context?.clientDetails && (
          <Section title="Client">
            {context.clientDetails.profilePicture?.url && (
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={context.clientDetails.profilePicture.thumbnailUrl ?? context.clientDetails.profilePicture.url}
                  alt="Client"
                  className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                  width={20}
                  height={20}
                />
                {context.clientDetails.name && (
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{context.clientDetails.name}</p>
                )}
              </div>
            )}
            {!context.clientDetails.profilePicture?.url && context.clientDetails.name && (
              <Row label="Name">
                <span className="flex items-center gap-1.5">
                  <User size={11} className="text-stone-400" />
                  {context.clientDetails.name}
                </span>
              </Row>
            )}
            {context.clientDetails.mainContact && (
              <Row label="Contact">
                <span className="flex items-center gap-1.5">
                  <Phone size={11} className="text-stone-400" />
                  {context.clientDetails.mainContact}
                </span>
              </Row>
            )}
          </Section>
        )}

        {/* Task context — shown when booking originated from a task */}
        {context?.taskContext && (
          <Section title="Task details">
            {context.taskContext.title && (
              <Row label="Title">
                <span className="flex items-start gap-1.5">
                  <FileText size={11} className="text-stone-400 mt-0.5 shrink-0" />
                  <span className="font-medium">{context.taskContext.title}</span>
                </span>
              </Row>
            )}
            {context.taskContext.description && (
              <Row label="Description">
                <span className="leading-relaxed whitespace-pre-line">{context.taskContext.description}</span>
              </Row>
            )}
            {context.taskContext.tags && context.taskContext.tags.length > 0 && (
              <Row label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {context.taskContext.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              </Row>
            )}
            {context.taskContext.location && (
              <>
                {context.taskContext.location.ghanaPostGPS && (
                  <Row label="GPS">
                    <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-100">
                      {context.taskContext.location.ghanaPostGPS}
                    </span>
                  </Row>
                )}
                {[
                  context.taskContext.location.locality,
                  context.taskContext.location.city,
                  context.taskContext.location.district,
                  context.taskContext.location.region,
                ].filter(Boolean).length > 0 && (
                  <Row label="Area">
                    {[
                      context.taskContext.location.locality,
                      context.taskContext.location.city,
                      context.taskContext.location.district,
                      context.taskContext.location.region,
                    ].filter(Boolean).join(", ")}
                  </Row>
                )}
              </>
            )}
          </Section>
        )}

        {/* Booking details */}
        <Section title="Booking details">
          <Row label="Booking #">
            <span className="font-mono font-semibold flex items-center gap-1.5">
              <Hash size={11} className="text-stone-400" />
              {booking.bookingNumber || booking._id.slice(-8).toUpperCase()}
            </span>
          </Row>
          <Row label="Scheduled date">{fmtDate(booking.scheduledDate)}</Row>
          {booking.scheduledTimeSlot?.start && (
            <Row label="Time slot">
              {booking.scheduledTimeSlot.start}
              {booking.scheduledTimeSlot.end && ` – ${booking.scheduledTimeSlot.end}`}
            </Row>
          )}
          {booking.serviceDescription && (
            <Row label="Description">{booking.serviceDescription}</Row>
          )}
          {booking.specialInstructions && (
            <Row label="Instructions">{booking.specialInstructions}</Row>
          )}
        </Section>

        {/* Pricing */}
        {(booking.estimatedPrice !== undefined || booking.finalPrice !== undefined) && (
          <Section title="Pricing">
            <Row label="Currency">{booking.currency}</Row>
            {booking.estimatedPrice !== undefined && (
              <Row label="Estimated">
                <span className="flex items-center gap-1">
                  <DollarSign size={11} className="text-stone-400" />
                  {booking.estimatedPrice.toLocaleString()}
                </span>
              </Row>
            )}
            {booking.finalPrice !== undefined && (
              <Row label="Final">
                <span className="flex items-center gap-1 font-semibold">
                  <DollarSign size={11} className="text-stone-400" />
                  {booking.finalPrice.toLocaleString()}
                </span>
              </Row>
            )}
            {booking.depositAmount !== undefined && (
              <Row label="Deposit">
                {booking.depositAmount.toLocaleString()} {booking.depositPaid ? "(paid)" : "(unpaid)"}
              </Row>
            )}
          </Section>
        )}

        {/* Reschedule proposal */}
        {context?.providerProposedSchedule && (
          <div className="rounded-2xl border border-sky-200 dark:border-sky-700/50 bg-sky-50/50 dark:bg-sky-900/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-sky-100 dark:border-sky-800/50 flex items-center gap-2">
              <CalendarCheck size={13} className="text-sky-600 dark:text-sky-400" />
              <p className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">Reschedule proposal</p>
            </div>
            <div className="px-5 py-4 space-y-1">
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-200">
                {fmtDate(context.providerProposedSchedule.preferredDate)}
              </p>
              {context.providerProposedSchedule.timeSlot?.start && (
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  {context.providerProposedSchedule.timeSlot.start}
                  {context.providerProposedSchedule.timeSlot.end &&
                    ` – ${context.providerProposedSchedule.timeSlot.end}`}
                </p>
              )}
              {context.providerProposedSchedule.message && (
                <p className="text-xs text-sky-600 dark:text-sky-400 italic mt-1">
                  &ldquo;{context.providerProposedSchedule.message}&rdquo;
                </p>
              )}
              <p className="text-[10px] text-sky-500 dark:text-sky-500 mt-1">
                Proposed {fmtDateTime(context.providerProposedSchedule.proposedAt)} · confirmed by client
              </p>
            </div>
          </div>
        )}

        {/* Service location */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
            <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Service location</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {booking.serviceLocation?.ghanaPostGPS && (
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-100">
                    {booking.serviceLocation.ghanaPostGPS}
                  </p>
                  {booking.serviceLocation.nearbyLandmark && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {booking.serviceLocation.nearbyLandmark}
                    </p>
                  )}
                </div>
              </div>
            )}
            {[
              booking.serviceLocation?.locality,
              booking.serviceLocation?.city,
              booking.serviceLocation?.district,
              booking.serviceLocation?.region,
            ].filter(Boolean).length > 0 && (
              <div className="flex items-start gap-2.5">
                <Navigation size={13} className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {[booking.serviceLocation?.locality, booking.serviceLocation?.city, booking.serviceLocation?.district, booking.serviceLocation?.region].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {mapsUrl && (
              <Link href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                <ExternalLink size={11} />
                Open in Google Maps
              </Link>
            )}
          </div>
        </div>

        {/* Pending reschedule panel */}
        {booking.pendingReschedule && booking.status === BookingStatus.RESCHEDULE_REQUESTED && (
          <div className="rounded-2xl border-2 border-sky-300 dark:border-sky-600/50 bg-sky-50 dark:bg-sky-900/10 overflow-hidden">
            <div className="px-5 py-3 bg-sky-100/80 dark:bg-sky-900/30 border-b border-sky-200 dark:border-sky-700/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock size={13} className="text-sky-600 dark:text-sky-400" />
                <p className="text-[11px] font-bold text-sky-800 dark:text-sky-200 uppercase tracking-wider">
                  Reschedule proposal pending
                </p>
              </div>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                Proposed by {booking.pendingReschedule.proposedBy}
              </span>
            </div>
            <div className="px-5 py-4 space-y-1.5">
              <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">
                {new Date(booking.pendingReschedule.newDate).toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
              </p>
              {booking.pendingReschedule.newTimeSlot?.start && (
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  {booking.pendingReschedule.newTimeSlot.start}
                  {booking.pendingReschedule.newTimeSlot.end &&
                    ` – ${booking.pendingReschedule.newTimeSlot.end}`}
                </p>
              )}
              {booking.pendingReschedule.message && (
                <p className="text-xs text-sky-600 dark:text-sky-400 italic">
                  &ldquo;{booking.pendingReschedule.message}&rdquo;
                </p>
              )}
              <p className="text-[10px] text-sky-500 dark:text-sky-500 mt-1">
                Expires {fmtDateTime(booking.pendingReschedule.expiresAt)}
                {booking.rescheduleCount !== undefined && ` · ${booking.rescheduleCount}/3 proposals used`}
              </p>
            </div>
          </div>
        )}

        {/* Completion attempts */}
        <CompletionAttemptsSection bookingId={booking._id} />

        {/* Cancellation */}
        {booking.status === BookingStatus.CANCELLED && (
          <Section title="Cancellation">
            {booking.cancellationReason && <Row label="Reason">{booking.cancellationReason}</Row>}
            {booking.cancelledAt && <Row label="Cancelled at">{fmtDateTime(booking.cancelledAt)}</Row>}
            {booking.cancelledBy && <Row label="By">{booking.cancelledBy}</Row>}
          </Section>
        )}

        {/* Final outcome */}
        {booking.finalOutcome && (
          <Section title="Final outcome">
            <Row label="Resolution">
              <span className="font-semibold capitalize">{booking.finalOutcome.resolution.replace("_", " ")}</span>
            </Row>
            <Row label="Closed at">{fmtDateTime(booking.finalOutcome.closedAt)}</Row>
            {booking.finalOutcome.adminOutcome && (
              <Row label="Admin ruling">{booking.finalOutcome.adminOutcome.replace("_", " ")}</Row>
            )}
          </Section>
        )}

        {/* Timeline */}
        <Section title="Timeline">
          <Row label="Created">{fmtDateTime(booking.createdAt)}</Row>
          {booking.confirmedAt && <Row label="Confirmed">{fmtDateTime(booking.confirmedAt)}</Row>}
          {booking.startedAt && <Row label="Started">{fmtDateTime(booking.startedAt)}</Row>}
          {booking.completedAt && <Row label="Completed">{fmtDateTime(booking.completedAt)}</Row>}
          {booking.cancelledAt && <Row label="Cancelled">{fmtDateTime(booking.cancelledAt)}</Row>}
        </Section>
      </div>

      {/* Dialogs */}
      {openDialog === "start" && <ConfirmStartDialog bookingId={booking._id} onClose={close} onDone={refresh} />}
      {openDialog === "cancel" && <CancelDialog bookingId={booking._id} onClose={close} onDone={refresh} />}
      {openDialog === "propose-reschedule" && <ProposeRescheduleDialog bookingId={booking._id} onClose={close} onDone={refresh} />}
      {openDialog === "respond-reschedule" && booking.pendingReschedule && (
        <RespondRescheduleDialog
          bookingId={booking._id}
          pendingReschedule={booking.pendingReschedule}
          onClose={close}
          onDone={refresh}
        />
      )}
      {openDialog === "respond" && <RespondProofDialog bookingId={booking._id} onClose={close} onDone={refresh} />}
      {openDialog === "proof" && (
        <SubmitProofInline bookingId={booking._id} onClose={close} onDone={refresh} />
      )}
      {openDialog === "rebuttal" && (
        <RebuttalInline bookingId={booking._id} onClose={close} onDone={refresh} />
      )}
    </div>
  );
}

// ─── Inline proof/rebuttal dialogs (reusing hook directly) ───────────────────

function ConfirmStartDialog({
  bookingId,
  onClose,
  onDone,
}: {
  bookingId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { mutate: start, loading, error } = useStartService({
    onSuccess: () => { onDone(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
            <Play size={16} className="text-sky-600 dark:text-sky-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Start job?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              This marks the booking as In Progress and notifies the client.
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-stone-400 hover:text-stone-600 rounded-lg p-1"><X size={16} /></button>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3">
            <AlertCircle size={12} className="shrink-0" />{error}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Not yet
          </button>
          <button
            onClick={() => start({ bookingId })}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Start job
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitProofInline({ bookingId, onClose, onDone }: { bookingId: string; onClose: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"initiating" | "uploading" | "error">("initiating");
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [uploadedProofs, setUploadedProofs] = useState<IFile[]>([]);
  const [notes, setNotes] = useState("");
  const [initiateError, setInitiateError] = useState<string | null>(null);

  const { mutate: submit, loading: submitLoading, error: submitError } = useSubmitProof({
    onSuccess: () => { onDone(); onClose(); },
  });

  const {
    uploadProof: rawUpload,
    uploadMultipleProofs: rawUploadMultiple,
    deleteProofFromCloudinary: rawDelete,
    isUploading,
    error: uploadError,
  } = useTaskCompletionAttachment();

  // Step 1: initiate attempt on mount
  useEffect(() => {
    completionAttemptAPI
      .initiateAttempt(bookingId)
      .then((res) => {
        if (res.attempt?._id) {
          setCompletionId(res.attempt._id);
          setPhase("uploading");
        } else {
          setInitiateError(res.message ?? "Failed to initiate attempt");
          setPhase("error");
        }
      })
      .catch((err: unknown) => {
        setInitiateError(err instanceof Error ? err.message : "Failed to initiate attempt");
        setPhase("error");
      });
  }, [bookingId]);

  const handleUpload = async (cId: string, file: File) => {
    const result = await rawUpload(cId, file);
    if (result?.file) setUploadedProofs((prev) => [...prev, result.file]);
    return result;
  };

  const handleUploadMultiple = async (cId: string, files: File[]) => {
    const result = await rawUploadMultiple(cId, files);
    if (result?.files) setUploadedProofs((prev) => [...prev, ...result.files]);
    return result;
  };

  const handleDelete = async (cId: string, fileId: string) => {
    const ok = await rawDelete(cId, fileId);
    if (ok) setUploadedProofs((prev) => prev.filter((f) => f._id !== fileId));
    return ok;
  };

  const handleSubmit = () => {
    if (!completionId) return;
    submit({
      bookingId,
      body: {
        attemptId: completionId,
        notes: notes.trim() || undefined,
        images: uploadedProofs.map((f) => f._id),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Mark job complete</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 rounded-lg p-1"><X size={16} /></button>
        </div>

        <div className="px-5 py-4">
          {phase === "initiating" && (
            <div className="flex items-center justify-center py-8 gap-2.5 text-stone-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Preparing…</span>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={13} className="shrink-0" />
                {initiateError}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300">Close</button>
              </div>
            </div>
          )}

          {phase === "uploading" && completionId && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Add a completion note and optionally attach photo evidence of the finished work.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Completion note — briefly describe what was done..."
                rows={3}
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
              <ProofUploader
                completionId={completionId}
                proofs={uploadedProofs}
                isLoading={false}
                isUploading={isUploading}
                error={uploadError}
                onUpload={handleUpload}
                onUploadMultiple={handleUploadMultiple}
                onDelete={handleDelete}
              />
              {submitError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={12} className="shrink-0" />{submitError}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={onClose} disabled={submitLoading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading || isUploading}
                  className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Complete job
                  {uploadedProofs.length > 0 && ` (${uploadedProofs.length} photo${uploadedProofs.length !== 1 ? "s" : ""})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RebuttalInline({ bookingId, onClose, onDone }: { bookingId: string; onClose: () => void; onDone: () => void }) {
  const [message, setMessage] = useState("");
  const { mutate: submit, loading, error } = useSubmitRebuttal({ onSuccess: () => { onDone(); onClose(); } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><MessageSquare size={16} className="text-violet-600 dark:text-violet-400" /></span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Submit rebuttal</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 rounded-lg p-1"><X size={16} /></button>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your rebuttal message..." rows={4} className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 mb-3 resize-none" />
        {error && <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3"><AlertCircle size={12} className="shrink-0" />{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
          <button onClick={() => submit({ bookingId, body: { message: message.trim() } })} disabled={loading || !message.trim()} className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const { data: detail, loading, error, refetch } = useBookingById(bookingId);
  const booking = detail?.booking;
  const context = detail?.context;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertCircle size={24} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {error ?? "Booking not found"}
          </p>
          <button onClick={refetch} className="text-[12px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <BookingDetail booking={booking} context={context} />;
}
