"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Star,
  ClipboardList,
  Radio,
  Search,
  MapPin,
  MessageSquare,
  DollarSign,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  AlertTriangle,
  Tag,
  ExternalLink,
  CalendarClock,
  ThumbsUp,
  ThumbsDown,
  Phone,
  FileText,
  ChevronRight,
  Navigation,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useTaskById } from "@/hooks/tasks/useTasks";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useRequestById,
  useCancelRequest,
  useConfirmReschedule,
  useDeclineReschedule,
  useNegotiateSchedule,
} from "@/hooks/requests/useProviderRequest";
import { RespondDialog } from "./RespondDialog";
import {
  ProviderRequest,
  RequestStatus,
  RequestSource,
  RequestViewContext,
  RequestContextTaskLocation,
  RequestContextAttachment,
  RequestContextServiceDetails,
} from "@/types/provider.request.types";
import { TaskPriority } from "@/types/task.types";
import type { Task } from "@/types/task.types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  RequestStatus,
  {
    label: string;
    icon: React.ReactNode;
    classes: string;
    dot: string;
    accent?: string;
  }
> = {
  [RequestStatus.PENDING]: {
    label: "Pending",
    icon: <Clock size={12} />,
    classes:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
    accent: "from-amber-400 to-orange-400",
  },
  [RequestStatus.ACCEPTED]: {
    label: "Accepted",
    icon: <CheckCircle2 size={12} />,
    classes:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    accent: "from-emerald-400 to-teal-400",
  },
  [RequestStatus.REJECTED]: {
    label: "Rejected",
    icon: <XCircle size={12} />,
    classes:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-400",
  },
  [RequestStatus.EXPIRED]: {
    label: "Expired",
    icon: <Clock size={12} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <Ban size={12} />,
    classes:
      "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.RESCHEDULED]: {
    label: "Reschedule Proposed",
    icon: <CalendarClock size={12} />,
    classes:
      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500 animate-pulse",
    accent: "from-sky-400 to-blue-400",
  },
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    icon: <Star size={12} />,
    classes:
      "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50",
    dot: "bg-violet-500",
    accent: "from-violet-400 to-purple-400",
  },
};

const SOURCE_CFG: Record<
  RequestSource,
  {
    label: string;
    icon: React.ReactNode;
    providerDescription: string;
    clientDescription: string;
  }
> = {
  [RequestSource.TASK_MATCH]: {
    label: "Task Match",
    icon: <ClipboardList size={13} />,
    providerDescription:
      "This client selected you from their task's matched providers list.",
    clientDescription:
      "You selected this provider from your task's matched providers list.",
  },
  [RequestSource.TASK_INTEREST]: {
    label: "Task Interest",
    icon: <Radio size={13} />,
    providerDescription:
      "This client requested you after you expressed interest in their floating task.",
    clientDescription:
      "You requested this provider after they expressed interest in your task.",
  },
  [RequestSource.SERVICE_BROWSE]: {
    label: "Service Browse",
    icon: <Search size={13} />,
    providerDescription: "This client discovered you while browsing services.",
    clientDescription: "You discovered this provider while browsing services.",
  },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: {
    label: "Low",
    color: "text-stone-500 dark:text-stone-400",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    color: "text-sky-600 dark:text-sky-400",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent",
    color: "text-red-600 dark:text-red-400",
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

// ─── Service location section ─────────────────────────────────────────────────

function LocationSection({
  serviceLocation,
  taskLocation,
}: {
  serviceLocation?: { ghanaPostGPS?: string; nearbyLandmark?: string };
  taskLocation?: import("@/types/provider.request.types").RequestContextTaskLocation;
}) {
  const reg = taskLocation?.registeredLocation;
  const coords = reg?.gpsCoordinates ?? taskLocation?.gpsLocationAtPosting;
  const gps = reg?.ghanaPostGPS ?? serviceLocation?.ghanaPostGPS;
  const landmark = reg?.nearbyLandmark ?? serviceLocation?.nearbyLandmark;
  const addressParts = [
    reg?.locality,
    reg?.city,
    reg?.district,
    reg?.region,
  ].filter(Boolean);

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
    : gps
      ? `https://www.google.com/maps/search/${encodeURIComponent(gps + " Ghana")}`
      : null;

  const osmSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.006},${coords.latitude - 0.006},${coords.longitude + 0.006},${coords.latitude + 0.006}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`
    : null;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Service location
        </p>
      </div>

      {/* Map */}
      {osmSrc && (
        <div className="relative w-full h-44 bg-stone-100 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
          <iframe
            src={osmSrc}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
            title="Service location map"
          />
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {/* GPS code + landmark */}
        <div className="flex items-start gap-2.5">
          <MapPin
            size={14}
            className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div className="space-y-0.5 min-w-0">
            {gps && (
              <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-100">
                {gps}
              </p>
            )}
            {landmark && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {landmark}
              </p>
            )}
          </div>
        </div>

        {/* Full address */}
        {addressParts.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Navigation
              size={13}
              className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {addressParts.join(", ")}
            </p>
          </div>
        )}

        {/* Coordinates */}
        {coords && (
          <p className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
            {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
            {"accuracy" in coords &&
              (coords as { accuracy?: number }).accuracy && (
                <span className="ml-1.5 text-stone-300 dark:text-stone-600">
                  ±{Math.round((coords as { accuracy?: number }).accuracy!)}m
                </span>
              )}
          </p>
        )}

        {/* Google Maps link */}
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

// ─── Task details popover (provider view) ─────────────────────────────────────

function TaskDetailsPopover({
  taskId,
  taskAttachments,
}: {
  taskId: string;
  taskAttachments?: {
    _id: string;
    url: string;
    thumbnailUrl?: string;
    fileName?: string;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const handleOpen = useCallback((next: boolean) => {
    if (next) setFetchEnabled(true);
    setOpen(next);
  }, []);

  const { data: task, loading } = useTaskById(fetchEnabled ? taskId : null);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 mt-2 h-7 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
          <FileText size={11} />
          View task details
          <ChevronRight size={10} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-0 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FileText
              size={12}
              className="text-amber-600 dark:text-amber-400"
            />
          </div>
          <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
            Task details
          </p>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-stone-400" />
            </div>
          )}

          {!loading && task && (
            <div className="space-y-3">
              {/* Title */}
              <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug">
                {task.title}
              </p>

              {/* Description */}
              {task.description && (
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-4">
                  {task.description}
                </p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Location */}
              {task.locationContext?.ghanaPostGPS && (
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <MapPin size={11} className="shrink-0 text-stone-400" />
                  <span className="font-mono">
                    {task.locationContext.ghanaPostGPS}
                  </span>
                  {task.locationContext.nearbyLandmark && (
                    <span className="text-stone-400">
                      {" "}
                      · {task.locationContext.nearbyLandmark}
                    </span>
                  )}
                </div>
              )}

              {/* Attachments */}
              {taskAttachments && taskAttachments.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5">
                    Attachments
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {taskAttachments.map((att) => (
                      <Link
                        key={att._id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:opacity-80 transition-opacity">
                        <Image
                          src={att.thumbnailUrl ?? att.url}
                          alt={att.fileName ?? "attachment"}
                          fill
                          className="object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !task && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-4">
              Could not load task details.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Other party card ─────────────────────────────────────────────────────────

function OtherPartyCard({
  label,
  name,
  contact,
  pictureUrl,
}: {
  label: string;
  name?: string;
  contact?: string;
  pictureUrl?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
          {pictureUrl ? (
            <Image
              src={pictureUrl}
              alt={name ?? label}
              fill
              className="object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
            {name ?? "—"}
          </p>
          {contact && (
            <a
              href={`tel:${contact}`}
              className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mt-0.5">
              <Phone size={11} className="shrink-0" />
              {contact}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task side panel (provider left panel) ────────────────────────────────────

function TaskSidePanelCard({
  task,
  taskTitle,
  taskDescription,
  taskTags,
  taskLoading,
  taskLocation,
  taskAttachments,
}: {
  task: Task | null | undefined;
  taskTitle?: string;
  taskDescription?: string;
  taskTags?: string[];
  taskLoading: boolean;
  taskLocation?: RequestContextTaskLocation;
  taskAttachments?: RequestContextAttachment[];
}) {
  const reg = taskLocation?.registeredLocation;
  const locationLine = [reg?.ghanaPostGPS, reg?.nearbyLandmark]
    .filter(Boolean)
    .join(" · ");
  const title = task?.title ?? taskTitle;
  const description = task?.description ?? taskDescription;
  const tags = task?.tags?.length ? task.tags : taskTags;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200/60 dark:border-amber-700/30 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <FileText size={12} className="text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
          Task Details
        </span>
        {taskLoading && (
          <Loader2
            size={11}
            className="animate-spin text-amber-500 ml-auto shrink-0"
          />
        )}
      </div>
      <div className="p-4 space-y-3">
        {title && (
          <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug">
            {title}
          </p>
        )}
        {description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {description}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}
        {locationLine && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <MapPin size={11} className="text-stone-400 shrink-0" />
            <span className="font-mono">{locationLine}</span>
          </div>
        )}
        {taskAttachments && taskAttachments.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5">
              {taskAttachments.length} attachment
              {taskAttachments.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {taskAttachments.slice(0, 6).map((att) => (
                <Link
                  key={att._id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-amber-200 dark:border-amber-700/40 bg-amber-100 dark:bg-amber-900/30 hover:opacity-80 transition-opacity">
                  <Image
                    src={att.thumbnailUrl ?? att.url}
                    alt={att.fileName ?? "attachment"}
                    fill
                    className="object-cover"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Service side panel (client left panel) ───────────────────────────────────

function ServiceSidePanelCard({
  serviceDetails,
}: {
  serviceDetails: RequestContextServiceDetails;
}) {
  const pricingLabel: Record<string, string> = {
    fixed: "Fixed price",
    hourly: "Hourly rate",
    per_unit: "Per unit",
    negotiable: "Negotiable",
    free: "Free",
  };

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-700/40 bg-sky-50/60 dark:bg-sky-900/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-200/60 dark:border-sky-700/30 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
          <Sparkles size={12} className="text-sky-600 dark:text-sky-400" />
        </div>
        <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
          Requested Service
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug">
          {serviceDetails.name}
        </p>
        {serviceDetails.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {serviceDetails.description}
          </p>
        )}
        {(serviceDetails.pricingModel || serviceDetails.basePrice != null) && (
          <div className="flex items-center gap-2 flex-wrap">
            {serviceDetails.pricingModel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-700/40">
                {pricingLabel[serviceDetails.pricingModel] ?? serviceDetails.pricingModel}
              </span>
            )}
            {serviceDetails.basePrice != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                <DollarSign size={11} className="text-stone-400" />
                {serviceDetails.currency ?? "GHS"}{" "}
                {serviceDetails.basePrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

// ─── Cancel confirm ───────────────────────────────────────────────────────────

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
    onSuccess: onCancelled,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle
              size={16}
              className="text-red-600 dark:text-red-400"
            />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Cancel request?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              This will notify the provider and cannot be undone.
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
            onClick={() =>
              cancel({ requestId, reason: reason.trim() || undefined })
            }
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Ban size={13} />
            )}
            Cancel request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service details section ──────────────────────────────────────────────────

function ServiceDetailsSection({
  serviceDetails,
}: {
  serviceDetails: RequestContextServiceDetails;
}) {
  const pricingLabel: Record<string, string> = {
    fixed: "Fixed price",
    hourly: "Hourly rate",
    per_unit: "Per unit",
    negotiable: "Negotiable",
    free: "Free",
  };

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-700/40 bg-sky-50/60 dark:bg-sky-900/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-sky-200/60 dark:border-sky-700/30 flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
          <Sparkles size={11} className="text-sky-600 dark:text-sky-400" />
        </div>
        <p className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
          Requested service
        </p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug">
          {serviceDetails.name}
        </p>
        {serviceDetails.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {serviceDetails.description}
          </p>
        )}
        {(serviceDetails.pricingModel || serviceDetails.basePrice != null) && (
          <div className="flex items-center gap-2 flex-wrap">
            {serviceDetails.pricingModel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-700/40">
                {pricingLabel[serviceDetails.pricingModel] ?? serviceDetails.pricingModel}
              </span>
            )}
            {serviceDetails.basePrice != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                <DollarSign size={11} className="text-stone-400" />
                {serviceDetails.currency ?? "GHS"}{" "}
                {serviceDetails.basePrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Negotiate dialog (client counter-proposal) ───────────────────────────────

function NegotiateDialog({
  requestId,
  onClose,
  onNegotiated,
}: {
  requestId: string;
  onClose: () => void;
  onNegotiated: () => void;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");

  const { mutate: negotiate, loading, error } = useNegotiateSchedule({
    onSuccess: () => {
      onNegotiated();
      onClose();
    },
  });

  const canSubmit = !!date && !!startTime && !!endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CalendarClock size={14} className="text-amber-600 dark:text-amber-400" />
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Propose your schedule
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 rounded-lg p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            The provider&apos;s proposed schedule doesn&apos;t work for you? Suggest your own preferred date and time — the provider will review it.
          </p>

          <div className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-3">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Your preferred date &amp; time
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 block">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why (optional) — e.g. &quot;I have an appointment that morning&quot;"
            rows={2}
            className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() =>
              negotiate({
                requestId,
                body: {
                  preferredDate: date,
                  timeSlot: { start: startTime, end: endTime },
                  message: message.trim() || undefined,
                },
              })
            }
            disabled={!canSubmit || loading}
            className={`flex-1 h-10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              !canSubmit
                ? "bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}>
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <CalendarClock size={13} />
                Send counter-proposal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail body ──────────────────────────────────────────────────────────────

function RequestDetail({
  request,
  context,
}: {
  request: ProviderRequest;
  context?: RequestViewContext;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [showCancel, setShowCancel] = useState(false);
  const [showRespond, setShowRespond] = useState(false);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const { mutate: confirmReschedule, loading: confirmLoading } =
    useConfirmReschedule({
      onSuccess: () => router.refresh(),
    });
  const { mutate: declineReschedule, loading: declineLoading } =
    useDeclineReschedule({
      onSuccess: () => router.refresh(),
    });

  const isProvider = context?.viewer
    ? context.viewer === "provider"
    : !!user?.id && user.id === request.providerId;
  const otherParty = isProvider
    ? context?.clientDetails
    : context?.providerDetails;
  const otherPartyLabel = isProvider ? "Client" : "Provider";
  const otherPartyName = isProvider
    ? otherParty?.name
    : (otherParty?.businessName ?? otherParty?.name);

  const cfg = STATUS_CFG[request.status] ?? {
    label: String(request.status),
    icon: <Clock size={12} />,
    classes:
      "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  };
  const sourceCfg = SOURCE_CFG[request.source] ?? {
    label: String(request.source ?? "Unknown"),
    icon: <Search size={13} />,
    providerDescription: "Client sent this request.",
    clientDescription: "You sent this request.",
  };

  const isPending = request.status === RequestStatus.PENDING;
  const isAccepted = request.status === RequestStatus.ACCEPTED;
  const isRescheduleProposed = request.status === RequestStatus.RESCHEDULED;

  const { data: task, loading: taskLoading } = useTaskById(
    request.taskId ?? null,
  );

  const detailSections = (
    <div className="space-y-3">
      {/* Origin */}
      <Section title="Request origin">
        <div className="flex items-start gap-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 shrink-0">
            {sourceCfg.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mb-0.5">
              {sourceCfg.label}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {isProvider
                ? sourceCfg.providerDescription
                : sourceCfg.clientDescription}
            </p>
            {request.taskId && (
              <Link
                href={`/tasks/${request.taskId}`}
                className="inline-flex items-center gap-1.5 mt-2 h-7 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                <FileText size={11} />
                View task
                <ChevronRight size={10} />
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* Service details — provider view only; client gets it in left panel */}
      {isProvider && context?.serviceDetails && (
        <ServiceDetailsSection serviceDetails={context.serviceDetails} />
      )}

      {/* Schedule */}
      <Section title="Schedule">
        <Row label="Priority">
          {request.schedule?.priority ? (
            <span
              className={`font-semibold ${PRIORITY_CFG[request.schedule.priority].color}`}>
              {PRIORITY_CFG[request.schedule.priority].label}
            </span>
          ) : (
            <span className="text-stone-400">—</span>
          )}
        </Row>
        <Row label="Preferred date">
          {request.schedule?.preferredDate ? (
            fmtDate(request.schedule.preferredDate)
          ) : (
            <span className="text-stone-400">Flexible / not set</span>
          )}
        </Row>
        <Row label="Time slot">
          {request.schedule?.timeSlot?.start ? (
            <>
              {request.schedule.timeSlot.start}
              {request.schedule.timeSlot.end &&
                ` – ${request.schedule.timeSlot.end}`}
            </>
          ) : (
            <span className="text-stone-400">Not specified</span>
          )}
        </Row>
        <Row label="Flexible">
          {request.schedule?.flexibleDates ? "Yes" : "No"}
        </Row>
      </Section>

      {/* Location */}
      <LocationSection
        serviceLocation={request.serviceLocation}
        taskLocation={context?.taskLocation}
      />

      {/* Message */}
      {request.clientMessage && (
        <Section title="Client message">
          <div className="flex items-start gap-2">
            <MessageSquare
              size={13}
              className="text-stone-400 mt-0.5 shrink-0"
            />
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {request.clientMessage}
            </p>
          </div>
        </Section>
      )}

      {/* Budget */}
      {request.estimatedBudget && (
        <Section title="Estimated budget">
          <Row label="Range">
            <span className="flex items-center gap-1">
              <DollarSign size={11} className="text-stone-400" />
              {request.estimatedBudget.currency}{" "}
              {request.estimatedBudget.min ?? "—"}
              {request.estimatedBudget.min &&
                request.estimatedBudget.max &&
                " – "}
              {request.estimatedBudget.max && request.estimatedBudget.max}
            </span>
          </Row>
        </Section>
      )}

      {/* Provider response */}
      {request.providerResponse && (
        <Section title="Provider response">
          <Row label="Action">
            {request.status === RequestStatus.REJECTED ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                <XCircle size={12} /> Declined
              </span>
            ) : request.providerProposedSchedule ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                <CalendarClock size={12} /> Proposed reschedule
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} /> Accepted
              </span>
            )}
          </Row>
          {request.providerProposedSchedule && (
            <>
              <Row label="Proposed date">
                {fmtDate(request.providerProposedSchedule.preferredDate)}
              </Row>
              {request.providerProposedSchedule.timeSlot?.start && (
                <Row label="Proposed time">
                  {request.providerProposedSchedule.timeSlot.start}
                  {request.providerProposedSchedule.timeSlot.end &&
                    ` – ${request.providerProposedSchedule.timeSlot.end}`}
                </Row>
              )}
            </>
          )}
          {request.providerResponse.message && (
            <Row label="Message">
              <span className="italic">
                &quot;{request.providerResponse.message}&quot;
              </span>
            </Row>
          )}
          <Row label="Responded at">
            {fmtDateTime(request.providerResponse.respondedAt)}
          </Row>
        </Section>
      )}

      {/* Cancellation */}
      {request.status === RequestStatus.CANCELLED && (
        <Section title="Cancellation">
          {request.cancellationReason && (
            <Row label="Reason">{request.cancellationReason}</Row>
          )}
          {request.cancelledAt && (
            <Row label="Cancelled at">{fmtDateTime(request.cancelledAt)}</Row>
          )}
          {request.cancelledBy && <Row label="By">{request.cancelledBy}</Row>}
        </Section>
      )}

      {/* Timestamps */}
      <Section title="Timeline">
        <Row label="Submitted">{fmtDateTime(request.createdAt)}</Row>
        {request.expiresAt && (
          <Row label="Expires at">{fmtDateTime(request.expiresAt)}</Row>
        )}
        {request.convertedAt && (
          <Row label="Converted">{fmtDateTime(request.convertedAt)}</Row>
        )}
      </Section>
    </div>
  );

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
        {/* ── Left panel (both client and provider) ─────────────── */}
        <div className="lg:sticky lg:top-20 space-y-3 mb-6 lg:mb-0">
          {isProvider ? (
            <>
              {request.taskId && (
                <TaskSidePanelCard
                  task={task}
                  taskTitle={context?.taskTitle ?? request.taskTitle}
                  taskDescription={context?.taskDescription}
                  taskTags={context?.taskTags}
                  taskLoading={taskLoading}
                  taskLocation={context?.taskLocation}
                  taskAttachments={context?.taskAttachments}
                />
              )}
              {otherParty && (
                <OtherPartyCard
                  label={otherPartyLabel}
                  name={otherPartyName}
                  contact={otherParty.mainContact}
                  pictureUrl={
                    otherParty.profilePicture?.thumbnailUrl ??
                    otherParty.profilePicture?.url
                  }
                />
              )}
            </>
          ) : (
            <>
              {/* Service card (SERVICE_BROWSE) */}
              {context?.serviceDetails && (
                <ServiceSidePanelCard serviceDetails={context.serviceDetails} />
              )}
              {/* Task card (TASK_MATCH / TASK_INTEREST) */}
              {(request.taskId || context?.taskTitle) && (
                <TaskSidePanelCard
                  task={null}
                  taskTitle={context?.taskTitle ?? request.taskTitle}
                  taskDescription={context?.taskDescription}
                  taskTags={context?.taskTags}
                  taskLoading={false}
                  taskLocation={context?.taskLocation}
                  taskAttachments={context?.taskAttachments}
                />
              )}
              {/* Provider info */}
              {otherParty && (
                <OtherPartyCard
                  label="Provider"
                  name={otherPartyName}
                  contact={otherParty.mainContact}
                  pictureUrl={
                    otherParty.profilePicture?.thumbnailUrl ??
                    otherParty.profilePicture?.url
                  }
                />
              )}
            </>
          )}
        </div>

        {/* ── Right panel (or full width for client) ─────────────── */}
        <div className="min-w-0">
          {/* Status banner */}
          <div
            className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${cfg.classes}`}>
            {cfg.accent && (
              <div
                className={`w-1 self-stretch rounded-full bg-linear-to-b ${cfg.accent} -ml-4 mr-1`}
                style={{
                  marginTop: -16,
                  marginBottom: -16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  width: 3,
                }}
              />
            )}
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.classes}`}>
              {cfg.icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{cfg.label}</p>
              <p className="text-[11px] opacity-70">
                {request.status === RequestStatus.PENDING &&
                  "Awaiting provider response"}
                {request.status === RequestStatus.ACCEPTED &&
                  "Provider accepted — booking created"}
                {request.status === RequestStatus.REJECTED &&
                  "Provider declined this request"}
                {request.status === RequestStatus.CANCELLED &&
                  "Request was cancelled"}
                {request.status === RequestStatus.EXPIRED &&
                  "Request expired without a response"}
                {request.status === RequestStatus.RESCHEDULED &&
                  "Provider proposed a new schedule"}
                {request.status === RequestStatus.COMPLETED &&
                  "Service completed"}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-2 mb-4">
              {isProvider ? (
                <button
                  onClick={() => setShowRespond(true)}
                  className="flex-1 h-10 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-[12px] font-semibold hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
                  <Sparkles size={14} />
                  Respond to request
                </button>
              ) : (
                <button
                  onClick={() => setShowCancel(true)}
                  className="h-10 px-4 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <Ban size={14} />
                  Cancel request
                </button>
              )}
            </div>
          )}

          {/* Provider waiting notice (reschedule proposed — provider view) */}
          {isRescheduleProposed && isProvider && (
            <div className="rounded-2xl border border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-900/10 p-4 mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                <CalendarClock
                  size={14}
                  className="text-sky-600 dark:text-sky-400"
                />
              </span>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                Waiting for the client to confirm your proposed schedule.
              </p>
            </div>
          )}

          {/* Client reschedule actions — enhanced */}
          {isRescheduleProposed && !isProvider && (
            <div className="rounded-2xl border-2 border-sky-300 dark:border-sky-600/50 bg-sky-50 dark:bg-sky-900/10 overflow-hidden mb-4">
              {/* Header with "Action Required" badge */}
              <div className="px-4 py-3 bg-sky-100/80 dark:bg-sky-900/30 border-b border-sky-200 dark:border-sky-700/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-sky-200 dark:bg-sky-800/60 flex items-center justify-center shrink-0">
                    <CalendarClock size={13} className="text-sky-600 dark:text-sky-400" />
                  </span>
                  <p className="text-sm font-bold text-sky-800 dark:text-sky-200">
                    Provider proposed a new schedule
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 animate-pulse">
                  <AlertCircle size={9} />
                  Action required
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Schedule comparison */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/60 p-3">
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5">
                      Your original
                    </p>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {request.schedule?.preferredDate
                        ? fmtDate(request.schedule.preferredDate)
                        : "Flexible"}
                    </p>
                    {request.schedule?.timeSlot?.start && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {request.schedule.timeSlot.start}
                        {request.schedule.timeSlot.end &&
                          ` – ${request.schedule.timeSlot.end}`}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-sky-200 dark:border-sky-700/40 bg-sky-50 dark:bg-sky-900/20 p-3">
                    <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide mb-1.5">
                      Provider proposes
                    </p>
                    {request.providerProposedSchedule && (
                      <>
                        <p className="text-xs font-semibold text-sky-800 dark:text-sky-200">
                          {fmtDate(request.providerProposedSchedule.preferredDate)}
                        </p>
                        {request.providerProposedSchedule.timeSlot?.start && (
                          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">
                            {request.providerProposedSchedule.timeSlot.start}
                            {request.providerProposedSchedule.timeSlot.end &&
                              ` – ${request.providerProposedSchedule.timeSlot.end}`}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Provider's message */}
                {request.providerProposedSchedule?.message && (
                  <div className="rounded-xl border border-sky-200 dark:border-sky-700/40 bg-white dark:bg-stone-900/50 px-3 py-2.5 flex items-start gap-2">
                    <MessageSquare
                      size={12}
                      className="text-sky-500 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-stone-600 dark:text-stone-300 italic leading-relaxed">
                      &quot;{request.providerProposedSchedule.message}&quot;
                    </p>
                  </div>
                )}

                {/* Primary actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => declineReschedule({ requestId: request._id })}
                    disabled={confirmLoading || declineLoading}
                    className="h-10 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {declineLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ThumbsDown size={13} />
                    )}
                    Decline
                  </button>
                  <button
                    onClick={() => confirmReschedule({ requestId: request._id })}
                    disabled={confirmLoading || declineLoading}
                    className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {confirmLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ThumbsUp size={13} />
                    )}
                    Accept schedule
                  </button>
                </div>

                {/* Renegotiate */}
                <div className="pt-3 border-t border-sky-200 dark:border-sky-700/40 space-y-2">
                  <p className="text-[11px] text-sky-600 dark:text-sky-500">
                    Neither date works? Propose your own preferred time instead.
                  </p>
                  <button
                    onClick={() => setShowNegotiate(true)}
                    disabled={confirmLoading || declineLoading}
                    className="w-full h-9 rounded-xl border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 text-[12px] font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <CalendarClock size={13} />
                    Renegotiate schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAccepted && request.convertedToBookingId && (
            <Link
              href={`/bookings/${request.convertedToBookingId}`}
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors mb-4">
              <CheckCircle2 size={14} />
              View booking
              <ExternalLink size={12} />
            </Link>
          )}

          {detailSections}
        </div>
      </div>

      {/* Dialogs */}
      {showCancel && (
        <CancelDialog
          requestId={request._id}
          onClose={() => setShowCancel(false)}
          onCancelled={() => {
            setShowCancel(false);
            router.refresh();
          }}
        />
      )}
      {showRespond && (
        <RespondDialog
          request={request}
          onClose={() => setShowRespond(false)}
          onResponded={() => {
            setShowRespond(false);
            router.refresh();
          }}
        />
      )}
      {showNegotiate && (
        <NegotiateDialog
          requestId={request._id}
          onClose={() => setShowNegotiate(false)}
          onNegotiated={() => {
            setShowNegotiate(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = params?.id;

  const { data, loading, error, refetch } = useRequestById(requestId);
  const request = data?.request;
  const context = data?.context;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertCircle size={24} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {error ?? "Request not found"}
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

  return <RequestDetail request={request} context={context} />;
}
