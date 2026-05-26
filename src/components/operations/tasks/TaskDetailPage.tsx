"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Ban,
  Radio,
  MapPin,
  Tag,
  Hourglass,
  Loader2,
  AlertCircle,
  Users,
  ExternalLink,
  Eye,
  CalendarDays,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  Navigation,
  X,
  Zap,
  Star,
} from "lucide-react";
import {
  useTaskById,
  useMatchedProviders,
  useCancelTask,
  useMakeTaskFloating,
  useTriggerMatching,
  useExpressInterest,
  useWithdrawInterest,
} from "@/hooks/tasks/useTasks";
import { useAuth } from "@/hooks/auth/useAuth";
import { Task, TaskStatus, PopulatedProviderMatchResult } from "@/types/task.types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ReactNode;
    classes: string;
    dot: string;
    accent?: string;
    subtext: string;
  }
> = {
  [TaskStatus.PENDING]: {
    label: "Pending",
    icon: <Hourglass size={12} />,
    classes:
      "text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400 animate-pulse",
    subtext: "Provider matching is in progress.",
  },
  [TaskStatus.MATCHED]: {
    label: "Matched",
    icon: <CheckCircle2 size={12} />,
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500",
    accent: "from-amber-400 to-orange-400",
    subtext: "Providers have been matched. Select one to send a request.",
  },
  [TaskStatus.FLOATING]: {
    label: "Floating",
    icon: <Radio size={12} />,
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
    subtext: "Open to all nearby providers.",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={12} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
    subtext: "This task was cancelled.",
  },
  [TaskStatus.EXPIRED]: {
    label: "Expired",
    icon: <Clock size={12} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
    subtext: "This task expired without being fulfilled.",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Section / Row ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-stone-50 dark:border-stone-800/60 last:border-0">
      <span className="w-28 shrink-0 text-[11px] font-semibold text-stone-400 dark:text-stone-500 pt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0 text-xs text-stone-700 dark:text-stone-300">
        {children}
      </div>
    </div>
  );
}

// ─── Location section ─────────────────────────────────────────────────────────

function LocationSection({
  locationContext,
}: {
  locationContext: Task["locationContext"];
}) {
  const { ghanaPostGPS, nearbyLandmark, gpsCoordinates, resolvedAddress } =
    locationContext;

  const hasAny =
    !!ghanaPostGPS || !!nearbyLandmark || !!gpsCoordinates || !!resolvedAddress;
  if (!hasAny) return null;

  const mapsUrl = gpsCoordinates
    ? `https://www.google.com/maps?q=${gpsCoordinates.latitude},${gpsCoordinates.longitude}`
    : ghanaPostGPS
      ? `https://www.google.com/maps/search/${encodeURIComponent(ghanaPostGPS + " Ghana")}`
      : null;

  const osmSrc = gpsCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.006},${gpsCoordinates.latitude - 0.006},${gpsCoordinates.longitude + 0.006},${gpsCoordinates.latitude + 0.006}&layer=mapnik&marker=${gpsCoordinates.latitude},${gpsCoordinates.longitude}`
    : null;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Location
        </p>
      </div>

      {osmSrc && (
        <div className="relative w-full h-40 bg-stone-100 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
          <iframe
            src={osmSrc}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
            title="Task location map"
          />
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {(ghanaPostGPS || nearbyLandmark) && (
          <div className="flex items-start gap-2.5">
            <MapPin
              size={14}
              className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <div className="space-y-0.5 min-w-0">
              {ghanaPostGPS && (
                <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-100">
                  {ghanaPostGPS}
                </p>
              )}
              {nearbyLandmark && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {nearbyLandmark}
                </p>
              )}
            </div>
          </div>
        )}

        {resolvedAddress && (
          <div className="flex items-start gap-2.5">
            <Navigation
              size={13}
              className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {resolvedAddress}
            </p>
          </div>
        )}

        {gpsCoordinates && (
          <p className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
            {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
          </p>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
            <ExternalLink size={11} />
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  taskId,
  onClose,
  onCancelled,
}: {
  taskId: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const { mutate: cancel, loading } = useCancelTask({ onSuccess: onCancelled });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Cancel task?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              This cannot be undone.
            </p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={2}
          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Keep it
          </button>
          <button
            onClick={() => cancel({ taskId, reason: reason.trim() || undefined })}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Ban size={13} />
            )}
            Cancel task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Interest dialog (provider) ───────────────────────────────────────────────

function InterestDialog({
  taskId,
  onClose,
  onExpressed,
}: {
  taskId: string;
  onClose: () => void;
  onExpressed: () => void;
}) {
  const [message, setMessage] = useState("");
  const { mutate: express, loading, error } = useExpressInterest({
    onSuccess: onExpressed,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap size={14} className="text-amber-600 dark:text-amber-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Express interest
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 rounded-lg p-1">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
          Let the client know you&apos;re available. Add an optional message to
          stand out.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I can be there tomorrow morning — I've done similar work in your area."
          rows={3}
          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3 resize-none"
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-3">
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => express({ taskId, message: message.trim() || undefined })}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Zap size={13} />
            )}
            Express interest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Matched provider card ────────────────────────────────────────────────────

function MatchedProviderCard({
  match,
  taskId,
}: {
  match: PopulatedProviderMatchResult;
  taskId: string;
}) {
  const p = match.providerId;
  const name = p.businessName ?? "Provider";
  const initials = name.slice(0, 2).toUpperCase();
  const locationLine = [p.locationData?.city, p.locationData?.region]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/40 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate">
          {name}
        </p>
        {locationLine && (
          <p className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            <MapPin size={10} className="shrink-0" />
            {locationLine}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Star size={9} />
            {Math.round(match.matchScore)}% match
          </span>
          {typeof match.distance === "number" && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              {match.distance.toFixed(1)} km away
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/requests/provider/${p._id}?taskId=${taskId}&source=task_match`}
        className="shrink-0 flex items-center gap-1 h-8 px-3 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-amber-500 dark:hover:bg-amber-500 text-white text-[11px] font-bold transition-all">
        Request
        <ChevronRight size={11} />
      </Link>
    </div>
  );
}

// ─── Task detail body ─────────────────────────────────────────────────────────

function TaskDetail({
  task,
  refetch,
}: {
  task: Task;
  refetch: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [showCancel, setShowCancel] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [floatLoading, setFloatLoading] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);

  const isOwner = !!user?.id && user.id === task.clientId;
  const isTerminal =
    task.status === TaskStatus.CANCELLED || task.status === TaskStatus.EXPIRED;
  const isFloating = task.status === TaskStatus.FLOATING;
  const isMatched = task.status === TaskStatus.MATCHED;

  const { mutate: makeFloat } = useMakeTaskFloating({
    onSuccess: () => {
      setFloatLoading(false);
      refetch();
    },
  });

  const { mutate: triggerMatch } = useTriggerMatching({
    onSuccess: () => {
      setRematchLoading(false);
      refetch();
    },
  });

  const { mutate: withdraw, loading: withdrawLoading } = useWithdrawInterest({
    onSuccess: () => {
      setHasExpressedInterest(false);
      refetch();
    },
  });

  const { data: matchedProviders, loading: matchLoading } = useMatchedProviders(
    isOwner && isMatched ? task._id : null,
  );

  const cfg = STATUS_CFG[task.status];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[12px] text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-5 transition-colors">
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-6 lg:items-start">
        {/* ── Left panel ──────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-20 space-y-3 mb-6 lg:mb-0">
          {/* Task meta card */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
              <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                Task info
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.icon}
                {cfg.label}
              </span>

              {/* Dates + view count */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <CalendarDays size={11} className="shrink-0 text-stone-400" />
                  <span>Posted {fmtDate(task.createdAt)}</span>
                </div>
                {task.expiresAt && (
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <Clock size={11} className="shrink-0 text-stone-400" />
                    <span>Expires {fmtDate(task.expiresAt)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <Eye size={11} className="shrink-0 text-stone-400" />
                  <span>
                    {task.viewCount} view{task.viewCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Provider counts */}
              {(isMatched || isFloating) && (
                <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-300 font-medium pt-1 border-t border-stone-100 dark:border-stone-800">
                  <Users size={11} className="shrink-0 text-stone-400" />
                  {isMatched
                    ? `${task.matchedProviders?.length ?? 0} matched provider${(task.matchedProviders?.length ?? 0) !== 1 ? "s" : ""}`
                    : `${task.interestedProviders?.length ?? 0} interested provider${(task.interestedProviders?.length ?? 0) !== 1 ? "s" : ""}`}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <LocationSection locationContext={task.locationContext} />
        </div>

        {/* ── Right panel ─────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* Status banner */}
          <div
            className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${cfg.classes}`}>
            {cfg.accent && (
              <div
                className={`bg-linear-to-b ${cfg.accent} rounded-full shrink-0`}
                style={{ width: 3, alignSelf: "stretch" }}
              />
            )}
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.classes}`}>
              {cfg.icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{cfg.label}</p>
              <p className="text-[11px] opacity-70">{cfg.subtext}</p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* ── Action buttons ──────────────────────────────────────── */}
          {!isTerminal && (
            <div className="flex flex-wrap gap-2 mb-4">
              {isOwner ? (
                <>
                  {isMatched && (
                    <button
                      onClick={() => {
                        setFloatLoading(true);
                        makeFloat(task._id);
                      }}
                      disabled={floatLoading}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-400 text-[12px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors disabled:opacity-50">
                      {floatLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Radio size={13} />
                      )}
                      Open to all providers
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRematchLoading(true);
                      triggerMatch({ taskId: task._id });
                    }}
                    disabled={rematchLoading}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-[12px] font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                    {rematchLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RotateCcw size={13} />
                    )}
                    Re-match
                  </button>
                  <button
                    onClick={() => setShowCancel(true)}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Ban size={13} />
                    Cancel task
                  </button>
                </>
              ) : (
                // Provider CTAs — only meaningful on floating tasks
                isFloating &&
                (hasExpressedInterest ? (
                  <button
                    onClick={() => withdraw(task._id)}
                    disabled={withdrawLoading}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-[12px] font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                    {withdrawLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <X size={13} />
                    )}
                    Withdraw interest
                  </button>
                ) : (
                  <button
                    onClick={() => setShowInterest(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-[12px] font-semibold hover:bg-amber-500 dark:hover:bg-amber-500 transition-colors">
                    <Zap size={14} />
                    Express interest
                  </button>
                ))
              )}
            </div>
          )}

          <div className="space-y-3">
            {/* Task details */}
            <Section title="Task details">
              <p className="text-base font-extrabold text-stone-900 dark:text-stone-50 leading-snug mb-2">
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3">
                  {task.description}
                </p>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* Matched providers — client view, MATCHED status */}
            {isOwner && isMatched && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-white dark:bg-stone-900 overflow-hidden">
                <div className="px-5 py-3 border-b border-amber-100 dark:border-amber-800/30 flex items-center gap-2">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex-1">
                    Matched providers
                  </p>
                  {matchLoading && (
                    <Loader2
                      size={12}
                      className="animate-spin text-amber-400 shrink-0"
                    />
                  )}
                </div>
                <div className="px-5 py-4">
                  {matchLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-16 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : matchedProviders && matchedProviders.length > 0 ? (
                    <div className="space-y-2">
                      {matchedProviders.map((m) => (
                        <MatchedProviderCard
                          key={m.providerId._id}
                          match={m}
                          taskId={task._id}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-4">
                      No matched providers yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Interested providers — client view, FLOATING status */}
            {isOwner && isFloating && (
              <Section title="Interested providers">
                {(task.interestedProviders?.length ?? 0) > 0 ? (
                  <div className="space-y-1">
                    {task.interestedProviders!.map((ip) => (
                      <div
                        key={ip.providerId}
                        className="flex items-start gap-3 py-2.5 border-b border-stone-50 dark:border-stone-800 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 shrink-0">
                          <Users size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            Provider
                          </p>
                          {ip.message && (
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 italic mt-0.5 line-clamp-2">
                              &quot;{ip.message}&quot;
                            </p>
                          )}
                          <p className="text-[10px] text-stone-400 dark:text-stone-600 mt-0.5">
                            {fmtDateTime(ip.expressedAt)}
                          </p>
                        </div>
                        <Link
                          href={`/requests/provider/${ip.providerId}?taskId=${task._id}&source=task_interest`}
                          className="shrink-0 flex items-center gap-1 h-7 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:text-amber-400 transition-colors">
                          Request
                          <ChevronRight size={10} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 py-2">
                    No providers have expressed interest yet. Check back soon.
                  </p>
                )}
              </Section>
            )}

            {/* Interest confirmed notice — provider view */}
            {!isOwner && isFloating && hasExpressedInterest && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/10 px-5 py-4 flex items-center gap-3">
                <CheckCircle2
                  size={16}
                  className="text-emerald-500 dark:text-emerald-400 shrink-0"
                />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  You&apos;ve expressed interest. The client may reach out to
                  you.
                </p>
              </div>
            )}

            {/* Timeline */}
            <Section title="Timeline">
              <Row label="Posted">{fmtDateTime(task.createdAt)}</Row>
              <Row label="Last updated">{fmtDateTime(task.updatedAt)}</Row>
              {task.expiresAt && (
                <Row label="Expires">{fmtDateTime(task.expiresAt)}</Row>
              )}
              {task.matchingAttemptedAt && (
                <Row label="Matched at">
                  {fmtDateTime(task.matchingAttemptedAt)}
                </Row>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showCancel && (
        <CancelDialog
          taskId={task._id}
          onClose={() => setShowCancel(false)}
          onCancelled={() => {
            setShowCancel(false);
            refetch();
          }}
        />
      )}
      {showInterest && (
        <InterestDialog
          taskId={task._id}
          onClose={() => setShowInterest(false)}
          onExpressed={() => {
            setHasExpressedInterest(true);
            setShowInterest(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const { data: task, loading, error, refetch } = useTaskById(taskId, {
    populate: true,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertCircle size={24} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {error ?? "Task not found"}
          </p>
          <button
            onClick={refetch}
            className="text-[12px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <TaskDetail task={task} refetch={refetch} />;
}
