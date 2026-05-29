"use client";

import { useState } from "react";
import {
  X,
  Check,
  Loader2,
  AlertCircle,
  CalendarDays,
  MapPin,
  ClipboardList,
  Radio,
  Search,
} from "lucide-react";
import { CalendarClock } from "lucide-react";
import {
  useRespondToRequest,
  useProposeSchedule,
} from "@/hooks/requests/useProviderRequest";
import { ProviderRequest, RequestSource } from "@/types/provider.request.types";
import { TaskPriority } from "@/types/task.types";

// ─── Local config / helpers ───────────────────────────────────────────────────

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: {
    label: "Low",
    color: "text-stone-400 dark:text-stone-500",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    color: "text-sky-500 dark:text-sky-400",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    color: "text-orange-500 dark:text-orange-400",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent!",
    color: "text-red-500 dark:text-red-400",
  },
};

const SOURCE_CFG: Record<RequestSource, { label: string; icon: React.ReactNode }> = {
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

function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface RespondDialogProps {
  request: ProviderRequest;
  onClose: () => void;
  onResponded: () => void;
}

export function RespondDialog({
  request,
  onClose,
  onResponded,
}: RespondDialogProps) {
  const [action, setAction] = useState<"accept" | "reject" | "propose" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");

  const {
    mutate: respond,
    loading: respondLoading,
    error: respondError,
  } = useRespondToRequest({
    onSuccess: () => {
      onResponded();
      onClose();
    },
  });

  const {
    mutate: propose,
    loading: proposeLoading,
    error: proposeError,
  } = useProposeSchedule({
    onSuccess: () => {
      onResponded();
      onClose();
    },
  });

  const loading = respondLoading || proposeLoading;
  const mutationError = proposeError ?? respondError;

  const canSubmit = (() => {
    if (!action) return false;
    if (action === "propose")
      return !!proposedDate && !!proposedStart && !!proposedEnd;
    return true;
  })();

  const handleSubmit = () => {
    if (!action) return;
    if (action === "propose") {
      propose({
        requestId: request._id,
        body: {
          preferredDate: proposedDate,
          timeSlot: { start: proposedStart, end: proposedEnd },
          message: message.trim() || undefined,
        },
      });
    } else {
      respond({
        requestId: request._id,
        body: { action, message: message.trim() || undefined },
      });
    }
  };

  const isFlexible =
    request.schedule?.flexibleDates === true ||
    !request.schedule?.preferredDate;

  const source = SOURCE_CFG[request.source];
  const priority = request.schedule?.priority
    ? PRIORITY_CFG[request.schedule.priority]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
            Respond to request
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Request summary */}
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50 p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-md px-1.5 py-0.5">
                {source.icon}
                {source.label}
              </span>
              {priority && (
                <span className={`text-[11px] font-semibold ${priority.color}`}>
                  {priority.label} priority
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {request.schedule?.preferredDate ? (
                <span className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400">
                  <CalendarDays size={10} />
                  {fmtDate(request.schedule.preferredDate)}
                  {request.schedule?.timeSlot?.start && (
                    <>
                      {" "}
                      · {request.schedule.timeSlot.start}
                      {request.schedule?.timeSlot?.end &&
                        ` – ${request.schedule.timeSlot.end}`}
                    </>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 italic">
                  <CalendarDays size={10} />
                  No date set by client
                </span>
              )}
              {request.serviceLocation?.ghanaPostGPS && (
                <span className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400">
                  <MapPin size={10} />
                  {request.serviceLocation.ghanaPostGPS}
                </span>
              )}
            </div>
            {request.clientMessage && (
              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
                {request.clientMessage}
              </p>
            )}
          </div>

          {/* Flexible-schedule notice */}
          {isFlexible && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800/40">
              <CalendarClock size={13} className="text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-snug">
                This request has no fixed schedule. Propose a date &amp; time
                before accepting so the booking is properly time-bound.
              </p>
            </div>
          )}

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isFlexible}
              onClick={() => !isFlexible && setAction("accept")}
              title={isFlexible ? "A concrete schedule is required before accepting. Use 'Propose a schedule' below." : undefined}
              className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                isFlexible
                  ? "border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 bg-stone-50 dark:bg-stone-800/40 cursor-not-allowed"
                  : action === "accept"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              }`}>
              <Check size={14} />
              Accept
            </button>
            <button
              type="button"
              onClick={() => setAction("reject")}
              className={`h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                action === "reject"
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}>
              <X size={14} />
              Decline
            </button>
          </div>

          {/* Propose reschedule — primary action for flexible requests */}
          <button
            type="button"
            onClick={() => setAction("propose")}
            className={`w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
              action === "propose"
                ? "bg-sky-600 border-sky-600 text-white"
                : isFlexible
                  ? "border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/10 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/20"
                  : "border-sky-300 dark:border-sky-700/50 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
            }`}>
            <CalendarClock size={14} />
            {isFlexible ? "Propose a schedule (required)" : "Propose a different schedule"}
          </button>

          {/* Propose schedule inputs */}
          {action === "propose" && (
            <div className="space-y-2.5 rounded-xl border border-sky-200 dark:border-sky-800/50 bg-sky-50/50 dark:bg-sky-900/10 p-3">
              <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                Your proposed date &amp; time
              </p>
              <div className="space-y-2">
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={proposedStart}
                      onChange={(e) => setProposedStart(e.target.value)}
                      className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">
                      End time
                    </label>
                    <input
                      type="time"
                      value={proposedEnd}
                      onChange={(e) => setProposedEnd(e.target.value)}
                      className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {action && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                action === "accept"
                  ? "Add a message to the client (optional)"
                  : action === "propose"
                    ? "Explain the proposed change (optional)"
                    : "Let the client know why (optional)"
              }
              rows={3}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          )}
        </div>

        {/* Error */}
        {mutationError && (
          <div className="mx-5 mb-1 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 px-3 py-2.5">
            <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 leading-snug">
              {mutationError}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`flex-1 h-10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              !canSubmit
                ? "bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed"
                : action === "accept"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : action === "reject"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-sky-600 hover:bg-sky-700 text-white"
            }`}>
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : action === "accept" ? (
              <>
                <Check size={13} /> Confirm accept
              </>
            ) : action === "reject" ? (
              <>
                <X size={13} /> Confirm decline
              </>
            ) : action === "propose" ? (
              <>
                <CalendarClock size={13} /> Send proposal
              </>
            ) : (
              "Choose an action"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
