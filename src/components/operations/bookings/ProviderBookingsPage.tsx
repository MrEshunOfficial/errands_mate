"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
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
  Play,
} from "lucide-react";
import {
  useProviderBookings,
  useStartService,
  useSubmitProof,
  useSubmitRebuttal,
} from "@/hooks/bookings/useBooking";
import { useMyProviderProfile } from "@/hooks/profiles/useProviderProfile";
import { providerProfileAPI } from "@/lib/api/profile/business.profile.api";
import { Booking, BookingStatus } from "@/types/booking.types";
import { completionAttemptAPI } from "@/lib/api/bookings/completion-attempt.api";
import { useTaskCompletionAttachment } from "@/hooks/files/useTaskCompletionAttachment";
import { ProofUploader } from "@/components/files/ProofUploader";
import { IFile } from "@/types/files.types";

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

type FilterTab = "all" | BookingStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: BookingStatus.CONFIRMED, label: "Confirmed" },
  { id: BookingStatus.IN_PROGRESS, label: "In Progress" },
  { id: BookingStatus.AWAITING_VALIDATION, label: "Awaiting" },
  { id: BookingStatus.DISPUTED, label: "Disputed" },
  { id: BookingStatus.REBUTTAL_SUBMITTED, label: "Under Review" },
  { id: BookingStatus.COMPLETED, label: "Completed" },
];

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

// ─── Start service confirm ────────────────────────────────────────────────────

function StartServiceDialog({
  bookingId,
  onClose,
  onStarted,
}: {
  bookingId: string;
  onClose: () => void;
  onStarted: () => void;
}) {
  const { mutate: start, loading, error } = useStartService({
    onSuccess: () => { onStarted(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
            <Play size={16} className="text-sky-600 dark:text-sky-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Start service?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              This marks the booking as In Progress and notifies the client.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="ml-auto text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
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
            Start now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submit proof dialog ──────────────────────────────────────────────────────

function SubmitProofDialog({
  bookingId,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [phase, setPhase] = useState<"initiating" | "uploading" | "error">("initiating");
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [uploadedProofs, setUploadedProofs] = useState<IFile[]>([]);
  const [notes, setNotes] = useState("");
  const [initiateError, setInitiateError] = useState<string | null>(null);

  const { mutate: submit, loading: submitLoading, error: submitError } = useSubmitProof({
    onSuccess: () => { onSubmitted(); onClose(); },
  });

  const {
    uploadProof: rawUpload,
    uploadMultipleProofs: rawUploadMultiple,
    deleteProofFromCloudinary: rawDelete,
    isUploading,
    error: uploadError,
  } = useTaskCompletionAttachment();

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <button
            onClick={onClose}
            disabled={submitLoading || isUploading}
            className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          {phase === "initiating" && (
            <div className="flex items-center justify-center py-8 gap-2.5 text-stone-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Preparing upload…</span>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={13} className="shrink-0" />
                {initiateError}
              </div>
              <button onClick={onClose} className="w-full h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300">
                Close
              </button>
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

// ─── Rebuttal dialog ──────────────────────────────────────────────────────────

function RebuttalDialog({
  bookingId,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [message, setMessage] = useState("");
  const { mutate: submit, loading, error } = useSubmitRebuttal({
    onSuccess: () => { onSubmitted(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <MessageSquare size={16} className="text-violet-600 dark:text-violet-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Submit rebuttal</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
          Explain why the client&apos;s dispute is incorrect. An admin will review your response.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your rebuttal message..."
          rows={4}
          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 mb-3 resize-none"
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3">
            <AlertCircle size={12} className="shrink-0" />{error}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => submit({ bookingId, body: { message: message.trim() } })}
            disabled={loading || !message.trim()}
            className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
            Submit rebuttal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

type ActiveDialog = { type: "start" | "proof" | "rebuttal"; bookingId: string } | null;

function BookingCard({
  booking,
  onAction,
}: {
  booking: Booking;
  onAction: (type: "start" | "proof" | "rebuttal", id: string) => void;
}) {
  const cfg = STATUS_CFG[booking.status];

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
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {booking.status === BookingStatus.CONFIRMED && (
              <button
                onClick={() => onAction("start", booking._id)}
                className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <Play size={12} />
                Start
              </button>
            )}
            {booking.status === BookingStatus.IN_PROGRESS && (
              <button
                onClick={() => onAction("proof", booking._id)}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} />
                Complete job
              </button>
            )}
            {booking.status === BookingStatus.DISPUTED && (
              <button
                onClick={() => onAction("rebuttal", booking._id)}
                className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <MessageSquare size={12} />
                Rebut
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
          ? "Bookings appear here after you accept a client request."
          : "Bookings in this status will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderBookingsPage() {
  const { data: bookings, loading, error, refetch } = useProviderBookings();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const { data: myProfile } = useMyProviderProfile();
  const myProfileId = myProfile?._id as string | undefined;

  function handleJobDone() {
    refetch();
    if (myProfileId) {
      providerProfileAPI
        .updateProviderStatus(myProfileId, { status: "Available" })
        .catch((err) => console.error("Failed to reset provider status after job completion:", err));
    }
  }

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

  const actionableCount = bookings?.filter((b) =>
    [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.DISPUTED].includes(b.status),
  ).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Briefcase size={18} className="text-stone-400" />
            My Jobs
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Manage your active bookings
          </p>
        </div>
        {actionableCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-700/50">
            <Wrench size={11} className="animate-pulse" />
            {actionableCount} action{actionableCount === 1 ? "" : "s"} needed
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
          <button onClick={refetch} className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && <EmptyState filter={activeFilter} />}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onAction={(type, id) => setActiveDialog({ type, bookingId: id })}
            />
          ))}
        </div>
      )}

      {activeDialog?.type === "start" && (
        <StartServiceDialog
          bookingId={activeDialog.bookingId}
          onClose={() => setActiveDialog(null)}
          onStarted={refetch}
        />
      )}
      {activeDialog?.type === "proof" && (
        <SubmitProofDialog
          bookingId={activeDialog.bookingId}
          onClose={() => setActiveDialog(null)}
          onSubmitted={handleJobDone}
        />
      )}
      {activeDialog?.type === "rebuttal" && (
        <RebuttalDialog
          bookingId={activeDialog.bookingId}
          onClose={() => setActiveDialog(null)}
          onSubmitted={refetch}
        />
      )}
    </div>
  );
}
