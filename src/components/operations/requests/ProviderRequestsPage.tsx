"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Star,
  ClipboardList,
  Radio,
  Search,
  CalendarDays,
  CalendarClock,
  MapPin,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  History,
  Sparkles,
  SendHorizonal,
  CalendarCheck,
} from "lucide-react";
import {
  useMyRequestsAsProvider,
  useMyPendingRequests,
} from "@/hooks/requests/useProviderRequest";
import { RespondDialog } from "./RespondDialog";
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
  [RequestStatus.RESCHEDULED]: {
    label: "Reschedule Proposed",
    icon: <CalendarClock size={11} />,
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
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
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={11} />,
    classes:
      "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500",
    accent: "from-violet-400 to-purple-400",
  },
};

const SOURCE_CFG: Record<RequestSource, { label: string; icon: React.ReactNode }> = {
  [RequestSource.TASK_MATCH]: { label: "Task Match", icon: <ClipboardList size={10} /> },
  [RequestSource.TASK_INTEREST]: { label: "Task Interest", icon: <Radio size={10} /> },
  [RequestSource.SERVICE_BROWSE]: { label: "Service Browse", icon: <Search size={10} /> },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: { label: "Low", color: "text-stone-400 dark:text-stone-500" },
  [TaskPriority.MEDIUM]: { label: "Medium", color: "text-sky-500 dark:text-sky-400" },
  [TaskPriority.HIGH]: { label: "High", color: "text-orange-500 dark:text-orange-400" },
  [TaskPriority.URGENT]: { label: "Urgent!", color: "text-red-500 dark:text-red-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
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

// ─── Request card (provider view) ─────────────────────────────────────────────

function RequestCard({
  request,
  showActions,
  onRespond,
}: {
  request: ProviderRequest;
  showActions: boolean;
  onRespond: (req: ProviderRequest) => void;
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

  return (
    <div className="group rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden transition-all hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-600">
      {cfg.accent && (
        <div className={`h-0.5 bg-linear-to-r ${cfg.accent}`} />
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={request.status} />
              <SourceBadge source={request.source} />
              {request.source === RequestSource.TASK_INTEREST && (
                request.convertedToBookingId ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
                    <CalendarCheck size={9} /> Task Booked
                  </span>
                ) : (request.status === RequestStatus.PENDING || request.status === RequestStatus.RESCHEDULED) ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50">
                    <SendHorizonal size={9} /> Task Requested
                  </span>
                ) : null
              )}
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

        {/* Meta */}
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
              {request.schedule?.timeSlot?.start && (
                <> · {request.schedule.timeSlot.start}
                {request.schedule?.timeSlot?.end && ` – ${request.schedule.timeSlot.end}`}</>
              )}
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

        {/* Expiry notice */}
        {request.status === RequestStatus.PENDING && request.expiresAt && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3">
            <Clock size={10} className="inline mr-1" />
            Expires {fmtDate(request.expiresAt)} at {fmtTime(request.expiresAt)}
          </p>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          {showActions && request.status === RequestStatus.PENDING ? (
            <button
              onClick={() => onRespond(request)}
              className="h-8 px-4 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-[11px] font-semibold hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} />
              Respond
            </button>
          ) : (
            <div />
          )}
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

function EmptyState({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
        {isPending ? (
          <Inbox size={24} className="text-stone-400 dark:text-stone-500" />
        ) : (
          <History size={24} className="text-stone-400 dark:text-stone-500" />
        )}
      </div>
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
        {isPending ? "No pending requests" : "No requests yet"}
      </p>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
        {isPending
          ? "Requests from clients will appear here when they select you."
          : "Your full request history will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "pending" | "all";

export default function ProviderRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [respondingTo, setRespondingTo] = useState<ProviderRequest | null>(null);

  const {
    data: pending,
    loading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useMyPendingRequests();

  const {
    data: all,
    loading: allLoading,
    error: allError,
    refetch: refetchAll,
  } = useMyRequestsAsProvider();

  const pendingCount = pending?.length ?? 0;
  const isLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const error = activeTab === "pending" ? pendingError : allError;
  const items = activeTab === "pending" ? pending : all;

  function handleResponded() {
    refetchPending();
    refetchAll();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Inbox size={18} className="text-stone-400" />
            Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Service requests from clients
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Inbox size={12} />
          Action required
          {pendingCount > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "pending"
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-stone-900"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <History size={12} />
          All history
          {all && all.length > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "all"
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-stone-900"
                  : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400"
              }`}
            >
              {all.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={activeTab === "pending" ? refetchPending : refetchAll}
            className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (!items || items.length === 0) && (
        <EmptyState isPending={activeTab === "pending"} />
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              showActions={activeTab === "pending"}
              onRespond={setRespondingTo}
            />
          ))}
        </div>
      )}

      {/* Respond dialog */}
      {respondingTo && (
        <RespondDialog
          request={respondingTo}
          onClose={() => setRespondingTo(null)}
          onResponded={handleResponded}
        />
      )}
    </div>
  );
}
