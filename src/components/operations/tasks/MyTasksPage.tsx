"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Plus,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Radio,
  Loader2,
  ChevronRight,
  CalendarDays,
  Hourglass,
  RotateCcw,
  Trash2,
  MapPin,
  Star,
  X,
  ArrowUpRight,
  BadgeCheck,
  Mail,
  Phone,
  Navigation,
  Building2,
} from "lucide-react";
import { ProviderStatus } from "@/types/provider.profile.types";
import { useMyTasks, useMatchedProviders, useTriggerMatching, useUpdateTask, useDeleteTask } from "@/hooks/tasks/useTasks";
import { toast } from "sonner";
import { Task, TaskStatus, MatchingSummary } from "@/types/task.types";
import type { Service } from "@/types/services/service.types";
import { profilePictureAPI } from "@/lib/api/files/profile/profile-picture.api";
import {
  EnrichedMatch,
  MatchedProvidersDrawer,
  fetchProviderProfile,
  getInitials,
  type ProviderSummary,
} from "./forms/MatchedProvidersDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// ─── Interested Provider Card (drawer) ───────────────────────────────────────

function InterestedProviderDrawerCard({
  entry,
  onRequest,
}: {
  entry: { providerId: string; expressedAt: string; message?: string };
  onRequest: (providerId: string) => void;
}) {
  const [profile, setProfile] = useState<ProviderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchProviderProfile(entry.providerId).then((p) => {
      if (!cancelled) { setProfile(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entry.providerId]);

  const name = profile?.businessName ?? (loading ? null : "Unknown Provider");
  const initials = getInitials(profile?.businessName);
  const locationParts = [
    profile?.locationData?.locality,
    profile?.locationData?.city,
    profile?.locationData?.region,
  ].filter(Boolean).slice(0, 2).join(", ");
  const rating = profile?.ratingStats;
  const phone = profile?.contactInfo?.mainContact;
  const email = profile?.contactInfo?.businessEmail;
  const addressVerified = profile?.isAddressVerified ?? profile?.locationData?.isAddressVerified;
  const isBooked = profile?.status === ProviderStatus.Booked;
  const isClosed = profile?.status === ProviderStatus.Closed;

  const namedServices = (profile?.serviceOfferings ?? [])
    .filter((s): s is Service => typeof s === "object" && Boolean((s as Service).title))
    .slice(0, 3);
  const extraServiceCount = (profile?.serviceOfferings?.length ?? 0) - namedServices.length;

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-stone-100 dark:bg-stone-800 rounded-full" />
            <div className="h-2.5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
          </div>
          <div className="w-16 h-8 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors hover:border-stone-300 dark:hover:border-stone-700">
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-200/60 dark:ring-stone-700 flex items-center justify-center text-sm font-semibold text-stone-500 dark:text-stone-300 overflow-hidden shrink-0">
          {profile?.profilePictureUrl ? (
            <Image
              src={profile.profilePictureThumbnailUrl ?? profile.profilePictureUrl}
              alt={name ?? "Provider"}
              fill
              className="object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-tight">
              {name}
            </p>
            {addressVerified && (
              <BadgeCheck size={13} className="text-emerald-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-x-2.5 gap-y-1 mt-1 flex-wrap text-xs text-stone-500 dark:text-stone-400">
            {locationParts && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{locationParts}</span>
              </span>
            )}
            {(rating?.count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />
                <span className="font-medium text-stone-700 dark:text-stone-200">
                  {rating!.average.toFixed(1)}
                </span>
                <span className="text-stone-400 dark:text-stone-500">
                  ({rating!.count})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Request CTA */}
        <button
          onClick={() => onRequest(entry.providerId)}
          disabled={isClosed}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-colors">
          <ArrowUpRight size={12} />
          {isClosed ? "Unavailable" : "Request"}
        </button>
      </div>

      {/* Availability / status signals */}
      {(isBooked || isClosed || profile?.isAlwaysAvailable) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] font-medium">
          {isBooked && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Currently booked
            </span>
          )}
          {isClosed && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              Closed
            </span>
          )}
          {profile?.isAlwaysAvailable && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Clock size={11} />
              Always available
            </span>
          )}
        </div>
      )}

      {/* Services */}
      {namedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {namedServices.map((s, i) => (
            <span
              key={i}
              className="text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-md px-2 py-0.5">
              {(s as Service).title}
            </span>
          ))}
          {extraServiceCount > 0 && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500 px-1 py-0.5">
              +{extraServiceCount} more
            </span>
          )}
        </div>
      )}

      {/* Pitch message */}
      {entry.message && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic leading-relaxed">
            &ldquo;{entry.message}&rdquo;
          </p>
        </div>
      )}

      {/* Contact + profile link */}
      {(phone || email) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              <Phone size={12} className="shrink-0" />
              {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors min-w-0">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      )}

      <Link
        href={`/providers/${entry.providerId}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mt-3">
        <Building2 size={11} />
        View full profile
        <ChevronRight size={11} />
      </Link>
    </div>
  );
}

// ─── Interested Providers Sheet ───────────────────────────────────────────────

function InterestedProvidersSheet({
  task,
  visible,
  onClose,
  onRequest,
}: {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onRequest: (providerId: string) => void;
}) {
  const providers = task?.interestedProviders ?? [];

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col bg-stone-50 dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-0 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 transition-colors">
            <X size={15} />
          </button>

          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Floating task
            </p>
          </div>

          <SheetTitle className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight pr-8">
            Interested Providers
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate max-w-[calc(100%-2rem)]">
            &quot;{task?.title}&quot;
          </SheetDescription>

          {providers.length > 0 && (
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-2">
              {providers.length} provider{providers.length !== 1 ? "s" : ""} expressed interest
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
              <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Radio size={20} className="text-stone-400 dark:text-stone-500" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                  No interest yet
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-60">
                  Your task is live and visible to nearby providers. You&apos;ll see
                  them here when they express interest.
                </p>
              </div>
            </div>
          ) : (
            providers.map((entry) => (
              <InterestedProviderDrawerCard
                key={entry.providerId}
                entry={entry}
                onRequest={onRequest}
              />
            ))
          )}
        </div>

        <div className="px-4 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-colors">
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; classes: string; dot: string }
> = {
  [TaskStatus.PENDING]: {
    label: "Pending",
    icon: <Hourglass size={11} />,
    classes:
      "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  [TaskStatus.MATCHED]: {
    label: "Matched",
    icon: <CheckCircle2 size={11} />,
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500",
  },
  [TaskStatus.FLOATING]: {
    label: "Floating",
    icon: <Radio size={11} />,
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle size={11} />,
    classes:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-400",
  },
  [TaskStatus.EXPIRED]: {
    label: "Expired",
    icon: <Clock size={11} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[TaskStatus.PENDING];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onViewProviders,
  onViewInterested,
  onRematch,
  onDelete,
  rematching,
}: {
  task: Task;
  onViewProviders: (task: Task) => void;
  onViewInterested: (task: Task) => void;
  onRematch: (task: Task) => void;
  onDelete: (task: Task) => void;
  rematching: boolean;
}) {
  const canViewProviders =
    task.status === TaskStatus.MATCHED || task.status === TaskStatus.FLOATING;
  const isTerminal =
    task.status === TaskStatus.CANCELLED || task.status === TaskStatus.EXPIRED;
  const matchCount = task.matchedProviders?.length ?? 0;
  const interestCount = task.interestedProviders?.length ?? 0;

  const providerCount =
    task.status === TaskStatus.MATCHED
      ? matchCount
      : task.status === TaskStatus.FLOATING
        ? interestCount
        : null;

  return (
    <tr className="group border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40">
      {/* Title + description */}
      <td className="py-3.5 pl-5 pr-3 align-top">
        <Link
          href={`/tasks/${task._id}`}
          className="text-sm font-semibold text-stone-900 dark:text-stone-50 leading-snug mb-0.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
          {task.title}
        </Link>
        {task.description && (
          <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1 leading-relaxed">
            {task.description}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
        <StatusBadge status={task.status} />
        {task.status === TaskStatus.PENDING && (
          <p className="flex items-center gap-1 mt-1 text-[10px] text-stone-400 dark:text-stone-500">
            <Loader2 size={9} className="animate-spin" />
            Matching…
          </p>
        )}
      </td>

      {/* Providers */}
      <td className="py-3.5 px-3 align-middle hidden sm:table-cell whitespace-nowrap">
        {providerCount !== null ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-300">
            <Users size={12} className="text-stone-400" />
            {providerCount}
          </span>
        ) : (
          <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
        )}
      </td>

      {/* Date */}
      <td className="py-3.5 px-3 align-middle hidden sm:table-cell whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
          <CalendarDays size={11} />
          {formatDate(task.createdAt)}
        </span>
      </td>

      {/* Action */}
      <td className="py-3.5 pl-3 pr-5 align-middle text-right whitespace-nowrap">
        {canViewProviders ? (
          <div className="flex items-center justify-end gap-2">
            {task.status === TaskStatus.MATCHED && (
              <button
                type="button"
                onClick={() => onRematch(task)}
                disabled={rematching}
                title="Re-match providers"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {rematching ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
              </button>
            )}
            {task.status === TaskStatus.FLOATING && interestCount > 0 ? (
              <button
                type="button"
                onClick={() => onViewInterested(task)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl px-3 py-1.5 transition-all duration-150">
                <Radio size={12} />
                {interestCount} interested
                <ChevronRight size={11} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewProviders(task)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-stone-900 dark:bg-stone-700 hover:bg-amber-500 dark:hover:bg-amber-500 rounded-xl px-3 py-1.5 transition-all duration-150">
                <Users size={12} />
                Providers
                <ChevronRight size={11} />
              </button>
            )}
          </div>
        ) : isTerminal ? (
          <button
            type="button"
            onClick={() => onDelete(task)}
            title="Delete task"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-red-300 dark:hover:border-red-700/50 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        ) : (
          <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100 dark:border-stone-800 animate-pulse">
      <td className="py-4 pl-5 pr-3">
        <div className="h-3.5 w-48 bg-stone-200 dark:bg-stone-700 rounded mb-1.5" />
        <div className="h-2.5 w-64 bg-stone-100 dark:bg-stone-800 rounded" />
      </td>
      <td className="py-4 px-3">
        <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
      </td>
      <td className="py-4 px-3 hidden sm:table-cell">
        <div className="h-3.5 w-8 bg-stone-100 dark:bg-stone-800 rounded" />
      </td>
      <td className="py-4 px-3 hidden sm:table-cell">
        <div className="h-3.5 w-20 bg-stone-100 dark:bg-stone-800 rounded" />
      </td>
      <td className="py-4 pl-3 pr-5">
        <div className="h-7 w-24 bg-stone-100 dark:bg-stone-800 rounded-xl ml-auto" />
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isPast }: { isPast?: boolean }) {
  return (
    <tr>
      <td colSpan={5}>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <ClipboardList
              size={22}
              className="text-stone-300 dark:text-stone-600"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200">
              {isPast ? "No past tasks" : "No active tasks"}
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs leading-relaxed">
              {isPast
                ? "Completed, cancelled, or expired tasks will appear here."
                : "Post a task and we'll match you with the best nearby providers."}
            </p>
          </div>
          {!isPast && (
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all shadow-sm shadow-amber-900/20">
              <Plus size={13} />
              Post a Task
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Task Table ───────────────────────────────────────────────────────────────

function TaskTable({
  tasks,
  loading,
  isPast,
  onViewProviders,
  onViewInterested,
  onRematch,
  onDelete,
  rematchingTaskId,
}: {
  tasks: Task[];
  loading: boolean;
  isPast?: boolean;
  onViewProviders: (task: Task) => void;
  onViewInterested: (task: Task) => void;
  onRematch: (task: Task) => void;
  onDelete: (task: Task) => void;
  rematchingTaskId: string | null;
}) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-stone-100 dark:border-stone-800">
          <th className="py-3 pl-5 pr-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Task
          </th>
          <th className="py-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 whitespace-nowrap">
            Status
          </th>
          <th className="py-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 hidden sm:table-cell whitespace-nowrap">
            Providers
          </th>
          <th className="py-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 hidden sm:table-cell whitespace-nowrap">
            Created
          </th>
          <th className="py-3 pl-3 pr-5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {!loading && tasks.length === 0 && <EmptyState isPast={isPast} />}
        {!loading &&
          tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              onViewProviders={onViewProviders}
              onViewInterested={onViewInterested}
              onRematch={onRematch}
              onDelete={onDelete}
              rematching={rematchingTaskId === task._id}
            />
          ))}
      </tbody>
    </table>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = "active" | "past";

function Tabs({
  active,
  onChange,
  activeCount,
  pastCount,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  activeCount: number;
  pastCount: number;
}) {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "active", label: "Active", count: activeCount },
    { id: "past", label: "Past", count: pastCount },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-stone-100 dark:border-stone-800 px-4 sm:px-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-2 px-3 py-3 text-xs font-semibold transition-colors ${
            active === tab.id
              ? "text-stone-900 dark:text-stone-50"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          }`}>
          {tab.label}
          {tab.count > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                active === tab.id
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500"
              }`}>
              {tab.count}
            </span>
          )}
          {/* Active indicator */}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const router = useRouter();

  const { data: tasks, loading, error, refetch } = useMyTasks();
  const [activeTab, setActiveTab] = useState<TabId>("active");

  // ── Interested providers sheet state ──────────────────────────────────────
  const [interestTask, setInterestTask] = useState<Task | null>(null);
  const [interestSheetOpen, setInterestSheetOpen] = useState(false);

  // ── Providers drawer state ─────────────────────────────────────────────────
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [enrichedMatches, setEnrichedMatches] = useState<EnrichedMatch[]>([]);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | undefined>(undefined);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [drawerRematching, setDrawerRematching] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [rematchingTaskId, setRematchingTaskId] = useState<string | null>(null);

  // ── Delete state ───────────────────────────────────────────────────────────
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);
  const { mutate: deleteTask, loading: deleting } = useDeleteTask({
    onSuccess: () => {
      setConfirmDeleteTask(null);
      refetch();
    },
  });

  const { mutate: triggerMatch } = useTriggerMatching();
  const { mutate: updateTask } = useUpdateTask();

  const { data: matchData, loading: matchLoading, refetch: refetchProviders } = useMatchedProviders(
    drawerOpen ? (activeTask?._id ?? null) : null,
  );

  const baseEnrichedMatches = useMemo<EnrichedMatch[]>(() => {
    if (!matchData?.length) return [];
    return matchData.map((m) => {
      const p = m.providerId;
      return {
        ...m,
        providerId: p._id,
        profile: {
          _id: p._id,
          businessName: p.businessName,
          contactInfo: p.profile?.contactInfo
            ? {
                mainContact: p.profile.contactInfo.mainContact ?? null,
                businessEmail: p.profile.contactInfo.businessEmail ?? null,
              }
            : null,
          locationData: p.locationData,
          serviceOfferings: (p.serviceOfferings ?? []) as unknown as Service[],
        },
        profileLoading: false,
      };
    });
  }, [matchData]);

  useEffect(() => {
    setEnrichedMatches(baseEnrichedMatches);
  }, [baseEnrichedMatches]);

  useEffect(() => {
    if (!matchData?.length) return;
    let cancelled = false;
    matchData.forEach((m, i) => {
      const userId = m.providerId.profile?.userId?._id;
      if (!userId) return;
      profilePictureAPI
        .getPublicRecord(userId)
        .then((file) => {
          if (cancelled || !file?.url) return;
          setEnrichedMatches((prev) => {
            const next = [...prev];
            if (!next[i]?.profile) return prev;
            next[i] = {
              ...next[i],
              profile: {
                ...next[i].profile!,
                profilePictureUrl: file.url,
                profilePictureThumbnailUrl: file.thumbnailUrl ?? null,
              },
            };
            return next;
          });
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [matchData]);

  function openDrawer(task: Task) {
    setActiveTask(task);
    setEnrichedMatches([]);
    // Seed the summary from the task's persisted matching fields so the
    // proximity-only banner shows immediately, without re-running matching.
    // A fresh re-match (refresh/edit) overwrites this with a live summary.
    setMatchingSummary(
      task.matchOutcome
        ? {
            strategy: task.matchingCriteria?.useLocationOnly
              ? "location-only"
              : "intelligent",
            matchOutcome: task.matchOutcome,
            totalMatches: task.matchedProviders?.length ?? 0,
            averageMatchScore: 0,
            searchTermsUsed: task.matchingCriteria?.searchTerms ?? [],
            radiusUsedKm: task.matchingCriteria?.radiusUsedKm ?? 0,
            locationSourceUsed: task.matchingCriteria?.locationSourceUsed,
          }
        : undefined,
    );
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setActiveTask(null);
    setRequestingId(null);
  }

  function openInterestSheet(task: Task) {
    setInterestTask(task);
    setInterestSheetOpen(true);
  }

  function closeInterestSheet() {
    setInterestSheetOpen(false);
    setInterestTask(null);
  }

  function handleInterestRequest(providerId: string) {
    if (!interestTask) return;
    closeInterestSheet();
    router.push(
      `/requests/provider/${providerId}?taskId=${interestTask._id}&source=task_interest`,
    );
  }

  function handleRequest(providerId: string) {
    if (!activeTask) return;
    setRequestingId(providerId);
    closeDrawer();
    const source =
      activeTask.status === TaskStatus.FLOATING ? "task_interest" : "task_match";
    router.push(
      `/requests/provider/${providerId}?taskId=${activeTask._id}&source=${source}`,
    );
  }

  async function handleRematch(task: Task) {
    setRematchingTaskId(task._id);
    try {
      const res = await triggerMatch({ taskId: task._id });
      if (!res) {
        toast.warning("Re-match failed. Please try again.");
        return;
      }
      const count = (res.matchedProviders ?? res.task?.matchedProviders ?? []).length;
      toast.success(
        count === 0
          ? "No providers matched right now."
          : `${count} provider${count !== 1 ? "s" : ""} matched!`,
      );
      refetch();
    } finally {
      setRematchingTaskId(null);
    }
  }

  async function handleDrawerRefresh() {
    if (!activeTask) return;
    setDrawerRematching(true);
    try {
      const res = await triggerMatch({ taskId: activeTask._id });
      if (res?.matchingSummary) setMatchingSummary(res.matchingSummary);
      refetchProviders();
    } finally {
      setDrawerRematching(false);
    }
  }

  async function handleDrawerEdit(data: { title: string; description: string; category?: string }) {
    if (!activeTask) return;
    setEditSaving(true);
    try {
      const res = await updateTask({
        taskId: activeTask._id,
        body: { title: data.title, description: data.description, category: data.category },
      });
      if (!res) {
        toast.error("Failed to update task. Please try again.");
        return;
      }
      setActiveTask((t) => t ? { ...t, title: data.title, description: data.description, category: data.category ?? t.category } : t);
      toast.success("Task updated! Re-matching providers…");
      const matchRes = await triggerMatch({ taskId: activeTask._id });
      if (matchRes?.matchingSummary) setMatchingSummary(matchRes.matchingSummary);
      refetchProviders();
      refetch();
    } finally {
      setEditSaving(false);
    }
  }

  const taskList = tasks ?? [];
  const activeTasks = taskList.filter(
    (t) => t.status !== TaskStatus.CANCELLED && t.status !== TaskStatus.EXPIRED,
  );
  const pastTasks = taskList.filter(
    (t) => t.status === TaskStatus.CANCELLED || t.status === TaskStatus.EXPIRED,
  );

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
            My Tasks
          </h1>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all shadow-sm shadow-amber-900/20 shrink-0">
            <Plus size={14} />
            New Task
          </Link>
        </div>

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                Failed to load tasks
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              <RotateCcw size={12} />
              Try again
            </button>
          </div>
        )}

        {/* Tabbed table */}
        {!error && (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
            <Tabs
              active={activeTab}
              onChange={setActiveTab}
              activeCount={activeTasks.length}
              pastCount={pastTasks.length}
            />
            <TaskTable
              tasks={activeTab === "active" ? activeTasks : pastTasks}
              loading={loading}
              isPast={activeTab === "past"}
              onViewProviders={openDrawer}
              onViewInterested={openInterestSheet}
              onRematch={handleRematch}
              onDelete={(task) => setConfirmDeleteTask(task)}
              rematchingTaskId={rematchingTaskId}
            />
          </div>
        )}
      </div>

      {/* Matched Providers Drawer */}
      <MatchedProvidersDrawer
        visible={drawerOpen}
        providers={enrichedMatches}
        summary={matchingSummary}
        matchLoading={matchLoading || drawerRematching}
        taskTitle={activeTask?.title ?? ""}
        taskDescription={activeTask?.description ?? ""}
        taskCategory={activeTask?.category}
        onClose={closeDrawer}
        onRequest={handleRequest}
        requestingId={requestingId}
        onRefresh={handleDrawerRefresh}
        onEditTask={handleDrawerEdit}
        editSaving={editSaving}
      />

      {/* Interested Providers Sheet */}
      <InterestedProvidersSheet
        task={interestTask}
        visible={interestSheetOpen}
        onClose={closeInterestSheet}
        onRequest={handleInterestRequest}
      />

      {/* Delete confirmation dialog */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
            <div className="flex items-start gap-2.5 mb-4">
              <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-red-600 dark:text-red-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
                  Delete task?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                  &ldquo;{confirmDeleteTask.title}&rdquo; will be permanently removed from your history.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteTask(null)}
                disabled={deleting}
                className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                Keep it
              </button>
              <button
                onClick={() => deleteTask(confirmDeleteTask._id)}
                disabled={deleting}
                className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}