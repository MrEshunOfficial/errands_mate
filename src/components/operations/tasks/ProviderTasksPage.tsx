"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Tag,
  Clock,
  AlertTriangle,
  ChevronDown,
  Loader2,
  AlertCircle,
  Inbox,
  X,
  HandshakeIcon,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  useFloatingTasks,
  useMatchedTasksForProvider,
  useTasksWithMyInterest,
  useExpressInterest,
  useWithdrawInterest,
} from "@/hooks/tasks/useTasks";
import { useMyProviderProfile } from "@/hooks/profiles/useProviderProfile";
import { Task, TaskPriority, resolveTaskLocation } from "@/types/task.types";

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<
  TaskPriority,
  { label: string; classes: string; dot: string }
> = {
  [TaskPriority.LOW]: {
    label: "Low",
    classes: "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    classes: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent",
    classes: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-500 animate-pulse",
  },
};

// ─── Ghana regions ────────────────────────────────────────────────────────────

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Oti",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Western North",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtExpiry(iso?: string): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { label: "Expired", urgent: true };
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return { label: `${hours}h left`, urgent: hours < 6 };
  const days = Math.floor(hours / 24);
  return { label: `${days}d left`, urgent: false };
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string }) {
  const cfg =
    priority && priority in PRIORITY_CFG
      ? PRIORITY_CFG[priority as TaskPriority]
      : null;
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Express Interest dialog ──────────────────────────────────────────────────

function ExpressInterestDialog({
  task,
  onClose,
  onDone,
}: {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}) {
  const [message, setMessage] = useState("");
  const { mutate: express, loading, error } = useExpressInterest({
    onSuccess: () => { onDone(); onClose(); },
  });

  const taskLoc = resolveTaskLocation(task.locationContext);

  const friendlyError = error?.toLowerCase().includes("profile")
    ? "Your provider profile isn't set up yet. Please complete your profile before expressing interest."
    : error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <HandshakeIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Express Interest</h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 rounded-lg p-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 block">
              Pitch message <span className="font-normal opacity-60">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Briefly explain why you're a good fit — skills, availability, approach…"
              rows={4}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Task summary</p>
            {taskLoc.ghanaPostGPS && (
              <p className="text-[11px] text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <MapPin size={10} className="shrink-0" />
                {taskLoc.ghanaPostGPS}
                {taskLoc.nearbyLandmark && ` · ${taskLoc.nearbyLandmark}`}
              </p>
            )}
            {taskLoc.resolvedAddress && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-[18px]">
                {taskLoc.resolvedAddress}
              </p>
            )}
            {task.interestedProviders && task.interestedProviders.length > 0 && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Eye size={10} className="shrink-0" />
                {task.interestedProviders.length} other provider{task.interestedProviders.length !== 1 ? "s" : ""} interested
              </p>
            )}
          </div>

          {friendlyError && (
            <div className="space-y-1">
              <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />{friendlyError}
              </p>
              {error?.toLowerCase().includes("profile") && (
                <Link
                  href="/profile"
                  className="ml-[18px] text-xs font-semibold text-red-600 dark:text-red-400 underline underline-offset-2">
                  Set up your profile →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => express({ taskId: task._id, message: message.trim() || undefined })}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <HandshakeIcon size={13} />}
            Express interest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw confirm dialog ──────────────────────────────────────────────────

function WithdrawDialog({
  task,
  onClose,
  onDone,
}: {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}) {
  const { mutate: withdraw, loading, error } = useWithdrawInterest({
    onSuccess: () => { onDone(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <RotateCcw size={15} className="text-red-600 dark:text-red-400" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">Withdraw interest?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
              You&apos;ll be removed from &ldquo;{task.title}&rdquo;. You can re-apply if it&apos;s still open.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="ml-auto text-stone-400 hover:text-stone-600 rounded-lg p-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
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
            Keep it
          </button>
          <button
            onClick={() => withdraw(task._id)}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  mode,
  onExpress,
  onWithdraw,
}: {
  task: Task;
  mode: "available" | "matched" | "applied";
  onExpress: (t: Task) => void;
  onWithdraw: (t: Task) => void;
}) {
  const expiry = fmtExpiry(task.expiresAt);
  const interestCount = task.interestedProviders?.length ?? 0;
  const taskLoc = resolveTaskLocation(task.locationContext);

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-600 transition-all">
      {/* Priority accent strip */}
      {task.tags?.includes("urgent") || false ? (
        <div className="h-0.5 bg-linear-to-r from-red-400 to-rose-400" />
      ) : (
        <div className="h-0.5 bg-linear-to-r from-stone-200 to-stone-100 dark:from-stone-700 dark:to-stone-800" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">#{shortId(task._id)}</span>
              {mode === "matched" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50">
                  <Zap size={9} /> Matched
                </span>
              )}
              {mode === "applied" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
                  <CheckCircle2 size={9} /> Applied
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug line-clamp-2">
              {task.title}
            </h3>
          </div>

          {expiry && (
            <span className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
              expiry.urgent
                ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50"
                : "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
            }`}>
              <Clock size={9} />
              {expiry.label}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          {taskLoc.ghanaPostGPS && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <MapPin size={10} />
              {taskLoc.ghanaPostGPS}
              {taskLoc.resolvedAddress ? (
                <span className="text-stone-400 dark:text-stone-500"> · {taskLoc.resolvedAddress}</span>
              ) : taskLoc.nearbyLandmark ? (
                <span className="text-stone-400 dark:text-stone-500"> · {taskLoc.nearbyLandmark}</span>
              ) : null}
            </span>
          )}
          {interestCount > 0 && mode !== "applied" && (
            <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
              <Eye size={10} />
              {interestCount} interested
            </span>
          )}
          {task.viewCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
              <ArrowUpRight size={10} />
              {task.viewCount} view{task.viewCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
              >
                <Tag size={8} />
                {tag}
              </span>
            ))}
            {task.tags.length > 5 && (
              <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center">
                +{task.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mode === "applied" ? (
              <button
                onClick={() => onWithdraw(task)}
                className="h-8 px-3 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                Withdraw
              </button>
            ) : (
              <button
                onClick={() => onExpress(task)}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <HandshakeIcon size={12} />
                Express interest
              </button>
            )}
          </div>

          <Link
            href={`/tasks/${task._id}`}
            className="ml-auto flex items-center gap-1 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:text-amber-400 transition-colors">
            <Eye size={12} />
            View details
          </Link>

          {expiry?.urgent && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
              <AlertTriangle size={10} />
              Closing soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabId }) {
  const copy: Record<TabId, { title: string; body: string }> = {
    available: {
      title: "No open tasks right now",
      body: "New floating tasks will appear here as clients post them. Check back soon.",
    },
    matched: {
      title: "No matched tasks yet",
      body: "The system matches tasks to your services and location. Make sure your profile and services are up to date.",
    },
    applied: {
      title: "No applications yet",
      body: "Tasks you express interest in will appear here so you can track and withdraw them.",
    },
  };
  const { title, body } = copy[tab];
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-stone-400 dark:text-stone-500" />
      </div>
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{title}</p>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-60 leading-relaxed">{body}</p>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = "available" | "matched" | "applied";

const TABS: { id: TabId; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "matched", label: "Matched for Me" },
  { id: "applied", label: "My Applications" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderTasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("available");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [showRegionMenu, setShowRegionMenu] = useState(false);

  const [expressTarget, setExpressTarget] = useState<Task | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Task | null>(null);

  const { data: myProfile, loading: myProfileLoading } = useMyProviderProfile();
  const profileReady = !myProfileLoading && !!myProfile;

  const floatingParams = region ? { region } : undefined;

  const {
    data: floating,
    loading: floatingLoading,
    error: floatingError,
    refetch: refetchFloating,
  } = useFloatingTasks(floatingParams);

  const {
    data: matched,
    loading: matchedLoading,
    error: matchedError,
    refetch: refetchMatched,
  } = useMatchedTasksForProvider();

  const {
    data: applied,
    loading: appliedLoading,
    error: appliedError,
    refetch: refetchApplied,
  } = useTasksWithMyInterest();

  const refetchAll = () => {
    refetchFloating();
    refetchMatched();
    refetchApplied();
  };

  // Filter by search query (client-side on title + description + tags)
  const filterBySearch = (tasks: Task[] | null) => {
    if (!tasks) return [];
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  };

  const visibleTasks: Task[] =
    activeTab === "available"
      ? filterBySearch(floating)
      : activeTab === "matched"
      ? filterBySearch(matched)
      : filterBySearch(applied);

  const isLoading =
    activeTab === "available"
      ? floatingLoading
      : activeTab === "matched"
      ? matchedLoading
      : appliedLoading;

  const error =
    activeTab === "available"
      ? floatingError
      : activeTab === "matched"
      ? matchedError
      : appliedError;

  const refetchCurrent =
    activeTab === "available"
      ? refetchFloating
      : activeTab === "matched"
      ? refetchMatched
      : refetchApplied;

  const counts = {
    available: floating?.length ?? 0,
    matched: matched?.length ?? 0,
    applied: applied?.length ?? 0,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
          Available Tasks
        </h1>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
          Browse open tasks and express interest to get hired
        </p>
      </div>

      {/* Profile incomplete banner */}
      {!myProfileLoading && !myProfile && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Provider profile not set up
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              You need a provider profile to express interest in tasks.{" "}
              <Link href="/profile" className="font-semibold underline underline-offset-2">
                Complete your profile →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-5 pb-1">
        {TABS.map((tab) => {
          const count = counts[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
                isActive
                  ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
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

      {/* Search + Region filter (available tab only) */}
      {activeTab !== "applied" && (
        <div className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
            />
          </div>

          {activeTab === "available" && (
            <div className="relative">
              <button
                onClick={() => setShowRegionMenu((p) => !p)}
                className="h-9 px-3 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <MapPin size={12} />
                {region || "All regions"}
                <ChevronDown size={12} className={`transition-transform ${showRegionMenu ? "rotate-180" : ""}`} />
              </button>

              {showRegionMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setRegion(""); setShowRegionMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      !region
                        ? "text-stone-900 dark:text-stone-50 bg-stone-100 dark:bg-stone-800"
                        : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                    }`}
                  >
                    All regions
                  </button>
                  {GHANA_REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRegion(r); setShowRegionMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        region === r
                          ? "text-stone-900 dark:text-stone-50 bg-stone-100 dark:bg-stone-800"
                          : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {search && (
            <button
              onClick={() => setSearch("")}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Applied tab search */}
      {activeTab === "applied" && (
        <div className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applications…"
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

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
            onClick={refetchCurrent}
            className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && visibleTasks.length === 0 && (
        <EmptyState tab={activeTab} />
      )}

      {!isLoading && !error && visibleTasks.length > 0 && (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              mode={activeTab === "applied" ? "applied" : activeTab === "matched" ? "matched" : "available"}
              onExpress={profileReady ? setExpressTarget : () => { window.location.href = "/profile"; }}
              onWithdraw={setWithdrawTarget}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {expressTarget && (
        <ExpressInterestDialog
          task={expressTarget}
          onClose={() => setExpressTarget(null)}
          onDone={refetchAll}
        />
      )}
      {withdrawTarget && (
        <WithdrawDialog
          task={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onDone={refetchAll}
        />
      )}
    </div>
  );
}
