"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Star,
  ClipboardList,
  Radio,
  Search,
  CalendarDays,
  MapPin,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  Inbox,
  AlertTriangle,
  X,
  CalendarClock,
} from "lucide-react";
import {
  useMyRequestsAsClient,
  useCancelRequest,
} from "@/hooks/requests/useProviderRequest";
import {
  ProviderRequest,
  RequestStatus,
  RequestSource,
} from "@/types/provider.request.types";
import { TaskPriority } from "@/types/task.types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  RequestStatus,
  { label: string; icon: React.ReactNode; classes: string; dot: string; accent?: string }
> = {
  [RequestStatus.PENDING]: {
    label: "Pending",
    icon: <Clock size={11} />,
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
    accent: "from-amber-400 to-orange-400",
  },
  [RequestStatus.ACCEPTED]: {
    label: "Accepted",
    icon: <CheckCircle2 size={11} />,
    classes:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    accent: "from-emerald-400 to-teal-400",
  },
  [RequestStatus.REJECTED]: {
    label: "Rejected",
    icon: <XCircle size={11} />,
    classes:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-400",
  },
  [RequestStatus.EXPIRED]: {
    label: "Expired",
    icon: <Clock size={11} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={11} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.RESCHEDULED]: {
    label: "Reschedule Proposed",
    icon: <CalendarClock size={11} />,
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
  },
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={11} />,
    classes:
      "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500",
    accent: "from-violet-400 to-purple-400",
  },
};

const SOURCE_CFG: Record<
  RequestSource,
  { label: string; icon: React.ReactNode }
> = {
  [RequestSource.TASK_MATCH]: {
    label: "Task Match",
    icon: <ClipboardList size={10} />,
  },
  [RequestSource.TASK_INTEREST]: {
    label: "Task Interest",
    icon: <Radio size={10} />,
  },
  [RequestSource.SERVICE_BROWSE]: {
    label: "Service Browse",
    icon: <Search size={10} />,
  },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: { label: "Low", color: "text-stone-400 dark:text-stone-500" },
  [TaskPriority.MEDIUM]: { label: "Medium", color: "text-sky-500 dark:text-sky-400" },
  [TaskPriority.HIGH]: { label: "High", color: "text-orange-500 dark:text-orange-400" },
  [TaskPriority.URGENT]: { label: "Urgent!", color: "text-red-500 dark:text-red-400" },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = "all" | RequestStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: RequestStatus.PENDING, label: "Pending" },
  { id: RequestStatus.ACCEPTED, label: "Accepted" },
  { id: RequestStatus.RESCHEDULED, label: "Reschedule" },
  { id: RequestStatus.REJECTED, label: "Rejected" },
  { id: RequestStatus.CANCELLED, label: "Cancelled" },
  { id: RequestStatus.EXPIRED, label: "Expired" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortId(id: string | Record<string, unknown> | null | undefined): string {
  if (!id) return "—";
  if (typeof id === "object") {
    const raw = (id._id ?? id.id) as string | undefined;
    return raw ? raw.slice(-6).toUpperCase() : "—";
  }
  return id.slice(-6).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CFG[status] ?? {
    label: String(status),
    icon: <Clock size={11} />,
    classes:
      "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: RequestSource }) {
  const cfg = SOURCE_CFG[source];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-md px-1.5 py-0.5">
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Cancel confirm dialog ────────────────────────────────────────────────────

function CancelDialog({
  requestId,
  onClose,
  onCancelled,
}: {
  requestId: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const { mutate: cancel, loading } = useCancelRequest({
    onSuccess: () => {
      onCancelled();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Cancel request?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg p-1"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
          This will notify the provider and cannot be undone.
        </p>
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
            disabled={loading}
            className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={() => cancel({ requestId, reason: reason.trim() || undefined })}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
            Cancel request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onCancel,
}: {
  request: ProviderRequest;
  onCancel: (id: string) => void;
}) {
  const cfg = STATUS_CFG[request.status] ?? {
    label: String(request.status),
    icon: <Clock size={11} />,
    classes:
      "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  };
  const priority = request.schedule?.priority
    ? PRIORITY_CFG[request.schedule.priority]
    : null;
  const isPending = request.status === RequestStatus.PENDING;

  return (
    <div className="group rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden transition-all hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-600">
      {cfg.accent && (
        <div className={`h-0.5 bg-linear-to-r ${cfg.accent}`} />
      )}

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={request.status} />
              <SourceBadge source={request.source} />
            </div>
            {request.taskTitle && (
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                {request.taskTitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 shrink-0 mt-0.5">
            <CalendarDays size={11} />
            {fmtDate(request.createdAt)}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {priority && (
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${priority.color}`}>
              Priority: {priority.label}
            </span>
          )}
          {request.schedule?.preferredDate && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <CalendarDays size={10} />
              {fmtDate(request.schedule.preferredDate)}
            </span>
          )}
          {request.serviceLocation?.ghanaPostGPS && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <MapPin size={10} />
              {request.serviceLocation.ghanaPostGPS}
            </span>
          )}
          {request.estimatedBudget && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <DollarSign size={10} />
              {request.estimatedBudget.currency}{" "}
              {request.estimatedBudget.min && `${request.estimatedBudget.min}`}
              {request.estimatedBudget.min && request.estimatedBudget.max && " – "}
              {request.estimatedBudget.max && `${request.estimatedBudget.max}`}
            </span>
          )}
        </div>

        {/* Provider response (if any) */}
        {request.providerResponse?.message && (
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50 px-3 py-2 mb-3">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">
              Provider response
            </p>
            <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2">
              {request.providerResponse.message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPending && (
              <button
                onClick={() => onCancel(request._id)}
                className="h-8 px-3 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
              >
                <Ban size={12} />
                Cancel
              </button>
            )}
            {request.status === RequestStatus.ACCEPTED && request.convertedToBookingId && (
              <Link
                href={`/bookings/${request.convertedToBookingId}`}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} />
                View booking
              </Link>
            )}
          </div>
          <Link
            href={`/requests/${request._id}`}
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
        {filter === "all" ? "No requests yet" : `No ${filter.toLowerCase()} requests`}
      </p>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
        {filter === "all"
          ? "Browse providers or post a task to get started."
          : "Requests in this status will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientRequestsPage() {
  const { data: requests, loading, error, refetch } = useMyRequestsAsClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered =
    !requests
      ? []
      : activeFilter === "all"
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  const counts: Partial<Record<FilterTab, number>> = {};
  if (requests) {
    counts.all = requests.length;
    for (const r of requests) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Send size={18} className="text-stone-400" />
            My Requests
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Requests you&apos;ve sent to service providers
          </p>
        </div>
        {requests && requests.length > 0 && (
          <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500">
            {requests.length} total
          </span>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Filter requests by status" className="flex gap-1 overflow-x-auto hide-scrollbar mb-6 pb-1">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.id];
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
                isActive
                  ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-stone-900"
                      : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
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
          {filtered.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onCancel={setCancellingId}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancellingId && (
        <CancelDialog
          requestId={cancellingId}
          onClose={() => setCancellingId(null)}
          onCancelled={refetch}
        />
      )}
    </div>
  );
}
