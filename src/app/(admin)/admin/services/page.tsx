"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Home,
  Shield,
  Briefcase,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Eye,
  Edit,
  Search,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  Loader2,
  RefreshCw,
  Activity,
  Archive,
} from "lucide-react";
import {
  useAllServices,
  usePendingServices,
  useServiceStats,
  useApproveService,
  useRejectService,
  useDeleteService,
  useRestoreService,
  usePermanentlyDeleteService,
  useBulkUpdateServices,
  useUpdateService,
} from "@/hooks/services/useServices";
import { ServiceWithVirtuals } from "@/types/services/service.types";
import Link from "next/link";
import Image from "next/image";

// =============================================================================
// Constants
// =============================================================================

const PAGE_LIMIT = 20;

// =============================================================================
// Types
// =============================================================================

type SingleActionType =
  | "approve"
  | "reject"
  | "delete"
  | "restore"
  | "permanent-delete"
  | "activate"
  | "deactivate";

type BulkActionType = "bulk-activate" | "bulk-deactivate" | "bulk-delete";
type ActionType = SingleActionType | BulkActionType | null;
type StatusTab = "active" | "pending" | "inactive" | "deleted";

// =============================================================================
// Helpers
// =============================================================================

function getCoverImage(service: ServiceWithVirtuals): string | undefined {
  if (!service.coverImage) return undefined;
  if (typeof service.coverImage === "object") {
    return (service.coverImage as unknown as { thumbnailUrl?: string })
      .thumbnailUrl;
  }
  return undefined;
}

function formatPrice(service: ServiceWithVirtuals): string {
  const p = service.servicePricing;
  if (!p) return "—";
  if (p.pricingModel === "free") return "Free";
  if (p.pricingModel === "negotiable") return "Negotiable";
  const price = p.basePrice ?? p.tiers?.[0]?.basePrice;
  if (price === undefined) return "—";
  return `${p.currency} ${price.toFixed(2)}`;
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============================================================================
// StatusBadge
// =============================================================================

function StatusBadge({ service }: { service: ServiceWithVirtuals }) {
  if (service.isDeleted)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25">
        <Trash2 className="w-3 h-3" />
        Deleted
      </span>
    );

  if (service.isRejected)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25">
        <Ban className="w-3 h-3" />
        Rejected
      </span>
    );

  if (service.isPending)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25">
        <Clock className="w-3 h-3" />
        Pending Review
      </span>
    );

  if (service.isActive)
    return service.approvedBy ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25">
        <CheckCircle className="w-3 h-3" />
        Active · Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/25">
        <CheckCircle className="w-3 h-3" />
        Active · Unverified
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/25">
      <ToggleLeft className="w-3 h-3" />
      Inactive
    </span>
  );
}

// =============================================================================
// StatsBar
// =============================================================================

function StatsBar() {
  const { data, isLoading } = useServiceStats();
  const s = (data as unknown as { stats?: Record<string, number> })?.stats;

  const items = [
    {
      label: "Total",
      value: s?.totalServices ?? "—",
      icon: Briefcase,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-500/10",
    },
    {
      label: "Active",
      value: s?.activeServices ?? "—",
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Pending",
      value: s?.pendingApproval ?? "—",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Deleted",
      value: s?.deletedServices ?? "—",
      icon: Archive,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      label: "Rejected",
      value: s?.rejectedServices ?? "—",
      icon: Ban,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 shadow-sm dark:shadow-none">
          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${bg}`}>
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500 truncate">
              {label}
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {isLoading ? (
                <span className="inline-block w-8 h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ConfirmDialog  — bottom-sheet on mobile, centered modal on sm+
// =============================================================================

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning" | "primary" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  disabled,
  children,
}: ConfirmDialogProps) {
  const variantClass = {
    danger: "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500",
    warning: "bg-orange-600 hover:bg-orange-500 focus-visible:ring-orange-500",
    primary: "bg-teal-600 hover:bg-teal-500 focus-visible:ring-teal-500",
    neutral: "bg-zinc-600 hover:bg-zinc-500 focus-visible:ring-zinc-500",
  }[confirmVariant];

  const borderClass =
    confirmVariant === "danger"
      ? "border-red-300 dark:border-red-600/50"
      : "border-zinc-200 dark:border-zinc-700/80";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative w-full sm:max-w-md bg-white dark:bg-zinc-900 border-t sm:border sm:rounded-xl shadow-2xl ${borderClass} rounded-t-2xl sm:rounded-t-xl`}>
        {/* Drag handle – mobile only */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight pr-4">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mt-0.5 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
          {children}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 pb-5 sm:pb-5">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-semibold text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantClass}`}>
            {disabled && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Menu primitives
// =============================================================================

function MenuSection({ title }: { title: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase select-none">
      {title}
    </p>
  );
}

const menuItemVariants = {
  default:
    "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60",
  success:
    "text-emerald-600 dark:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/60",
  warning:
    "text-orange-600 dark:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/60",
  danger:
    "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10",
  muted:
    "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/60",
} as const;

type MenuItemVariant = keyof typeof menuItemVariants;

function MenuItem({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: MenuItemVariant;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-sm transition-colors ${menuItemVariants[variant]}`}>
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      {label}
    </button>
  );
}

// =============================================================================
// ActionsDropdown — fixed-position popover
// =============================================================================

interface ActionsDropdownProps {
  service: ServiceWithVirtuals;
  onAction: (action: SingleActionType, service: ServiceWithVirtuals) => void;
}

function ActionsDropdown({ service, onAction }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.right;

    setPopoverStyle({
      position: "fixed",
      top: spaceBelow < 300 ? Math.max(8, rect.top - 300) : rect.bottom + 4,
      left:
        spaceRight < popoverWidth
          ? Math.max(8, rect.right - popoverWidth)
          : rect.left,
      width: popoverWidth,
      zIndex: 9999,
    });
  }, []);

  const toggleOpen = useCallback(() => {
    if (!open) updatePosition();
    setOpen((v) => !v);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger = (action: SingleActionType) => {
    onAction(action, service);
    setOpen(false);
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1 text-zinc-700 dark:text-zinc-300">
      <MenuSection title="Navigate" />
      <MenuItem
        icon={Eye}
        label="View Live"
        onClick={() => {
          window.open(`/services/${service.slug}`, "_blank");
          setOpen(false);
        }}
      />
      <MenuItem
        icon={Edit}
        label="Edit Service"
        onClick={() => {
          window.open(`/admin/service/${service._id}/edit`, "_blank");
          setOpen(false);
        }}
      />

      {service.isDeleted && (
        <>
          <div className="border-t border-zinc-100 dark:border-zinc-700/60 my-1" />
          <MenuSection title="Recovery" />
          <MenuItem
            icon={RotateCcw}
            label="Restore"
            onClick={() => trigger("restore")}
            variant="success"
          />
          <MenuItem
            icon={AlertTriangle}
            label="Permanently Delete"
            onClick={() => trigger("permanent-delete")}
            variant="danger"
          />
        </>
      )}

      {!service.isDeleted && (
        <>
          <div className="border-t border-zinc-100 dark:border-zinc-700/60 my-1" />
          {service.isPending && (
            <>
              <MenuSection title="Moderation" />
              <MenuItem
                icon={CheckCircle}
                label="Approve"
                onClick={() => trigger("approve")}
                variant="success"
              />
              <MenuItem
                icon={XCircle}
                label="Reject with Reason"
                onClick={() => trigger("reject")}
                variant="warning"
              />
            </>
          )}
          {service.isActive && !service.approvedBy && (
            <>
              <MenuSection title="Moderation" />
              <MenuItem
                icon={CheckCircle}
                label="Approve (Verify)"
                onClick={() => trigger("approve")}
                variant="success"
              />
              <MenuItem
                icon={XCircle}
                label="Reject with Reason"
                onClick={() => trigger("reject")}
                variant="warning"
              />
            </>
          )}
          {service.isApproved && (
            <>
              <MenuSection title="Visibility" />
              {service.isActive ? (
                <MenuItem
                  icon={ToggleLeft}
                  label="Deactivate"
                  onClick={() => trigger("deactivate")}
                  variant="muted"
                />
              ) : (
                <MenuItem
                  icon={ToggleRight}
                  label="Activate"
                  onClick={() => trigger("activate")}
                  variant="success"
                />
              )}
            </>
          )}
          {service.isRejected && (
            <>
              <MenuSection title="Moderation" />
              <MenuItem
                icon={CheckCircle}
                label="Approve"
                onClick={() => trigger("approve")}
                variant="success"
              />
            </>
          )}
          <div className="border-t border-zinc-100 dark:border-zinc-700/60 my-1" />
          <MenuSection title="Danger" />
          <MenuItem
            icon={Trash2}
            label="Delete"
            onClick={() => trigger("delete")}
            variant="danger"
          />
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        aria-label="Service actions"
        aria-expanded={open}
        className="p-2 sm:p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(popoverContent, document.body)
        : null}
    </>
  );
}

// =============================================================================
// BulkToolbar
// =============================================================================

interface BulkToolbarProps {
  count: number;
  statusTab: StatusTab;
  allSelectedActive: boolean;
  allSelectedInactive: boolean;
  onAction: (action: BulkActionType) => void;
  onClear: () => void;
}

function BulkToolbar({
  count,
  statusTab,
  allSelectedActive,
  allSelectedInactive,
  onAction,
  onClear,
}: BulkToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-950/60 border-b border-teal-200 dark:border-teal-800/50 flex-wrap">
      <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
        {count} selected
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {statusTab !== "deleted" && !allSelectedActive && (
          <button
            onClick={() => onAction("bulk-activate")}
            className="px-3 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors">
            Activate
          </button>
        )}
        {statusTab !== "deleted" && !allSelectedInactive && (
          <button
            onClick={() => onAction("bulk-deactivate")}
            className="px-3 py-1 text-xs font-semibold bg-zinc-500 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 text-white rounded-md transition-colors">
            Deactivate
          </button>
        )}
        {statusTab !== "deleted" && (
          <button
            onClick={() => onAction("bulk-delete")}
            className="px-3 py-1 text-xs font-semibold bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors">
            Delete
          </button>
        )}
      </div>
      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        <X className="w-3 h-3" />
        Clear
      </button>
    </div>
  );
}

// =============================================================================
// EmptyState
// =============================================================================

function EmptyState({
  tab,
  hasSearch,
}: {
  tab: StatusTab;
  hasSearch: boolean;
}) {
  const message = hasSearch
    ? "No services match your search."
    : tab === "deleted"
      ? "No deleted services found."
      : tab === "inactive"
        ? "No inactive services found."
        : tab === "pending"
          ? "No services pending approval — all caught up."
          : "No active services found.";

  const Icon =
    tab === "deleted"
      ? Archive
      : tab === "inactive"
        ? ToggleLeft
        : tab === "pending"
          ? Clock
          : Briefcase;

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">{message}</p>
    </div>
  );
}

// =============================================================================
// Pagination
// =============================================================================

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-500 tabular-nums order-2 sm:order-1">
        {from}–{to} of {total} services
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-zinc-400 dark:text-zinc-600 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-7 h-7 px-1 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-teal-600 text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}>
                {p}
              </button>
            ),
          )}
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ServiceCard — mobile card view
// =============================================================================

function ServiceCard({
  service,
  isSelected,
  onToggleSelect,
  onAction,
}: {
  service: ServiceWithVirtuals;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onAction: (action: SingleActionType, service: ServiceWithVirtuals) => void;
}) {
  const sid = service._id.toString();
  const coverImg = getCoverImage(service);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 transition-colors ${
        isSelected
          ? "bg-teal-50 dark:bg-teal-950/30"
          : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/20"
      }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggleSelect(sid)}
        aria-label={`Select ${service.title}`}
        className="mt-0.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-teal-500" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>

      {/* Thumbnail */}
      {coverImg ? (
        <Image
          src={coverImg}
          alt={service.title}
          width={44}
          height={44}
          className="w-11 h-11 rounded-lg object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-700">
          <Briefcase className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200 truncate">
              {service.title}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
              /{service.slug}
            </p>
          </div>
          <ActionsDropdown service={service} onAction={onAction} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StatusBadge service={service} />

          {/* Category */}
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 truncate max-w-[120px]">
            {typeof service.categoryId === "object"
              ? ((service.categoryId as unknown as { catName?: string })
                  .catName ?? "Uncategorized")
              : "Category"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
            {formatPrice(service)}
          </span>
          {service.providerEarnings != null && (
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold tabular-nums">
              Earnings: {service.servicePricing?.currency}{" "}
              {service.providerEarnings.toFixed(2)}
            </span>
          )}
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
            {formatDate(service.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function AdminServicesPage() {
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetService, setTargetService] =
    useState<ServiceWithVirtuals | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleTabChange = useCallback((tab: StatusTab) => {
    setStatusTab(tab);
    setPage(1);
    setSelectedIds(new Set());
    setSearchTerm("");
    setActionType(null);
    setTargetService(null);
  }, []);

  const allServicesQuery = useAllServices({
    page,
    limit: PAGE_LIMIT,
    includeDeleted: statusTab === "deleted" ? true : undefined,
  });

  const { refetch: refetchPending } = usePendingServices({
    page,
    limit: PAGE_LIMIT,
  });
  const { data, isLoading, isError, refetch } = allServicesQuery;

  const services: ServiceWithVirtuals[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const { refetch: refetchStats } = useServiceStats();

  const { mutateAsync: approveService, isLoading: approving } =
    useApproveService();
  const { mutateAsync: rejectService, isLoading: rejecting } =
    useRejectService();
  const { mutateAsync: updateService, isLoading: updating } =
    useUpdateService();
  const { mutateAsync: deleteService, isLoading: deleting } =
    useDeleteService();
  const { mutateAsync: restoreService, isLoading: restoring } =
    useRestoreService();
  const {
    mutateAsync: permanentlyDeleteService,
    isLoading: permanentlyDeleting,
  } = usePermanentlyDeleteService();
  const { mutateAsync: bulkUpdateServices, isLoading: bulkUpdating } =
    useBulkUpdateServices();

  const isProcessing =
    approving ||
    rejecting ||
    updating ||
    deleting ||
    restoring ||
    permanentlyDeleting ||
    bulkUpdating;

  const refetchAll = useCallback(() => {
    refetch();
    refetchStats();
    refetchPending();
    setSelectedIds(new Set());
  }, [refetch, refetchStats, refetchPending]);

  const filteredServices = services
    .filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => {
      if (statusTab === "deleted") return s.isDeleted === true;
      if (statusTab === "active") return !s.isDeleted && s.isActive === true;
      if (statusTab === "pending")
        return (
          !s.isDeleted &&
          (s.isPending || (s.isActive === true && !s.approvedBy))
        );
      return !s.isDeleted && s.isActive !== true; // "inactive" tab
    });

  const allPageSelected =
    filteredServices.length > 0 &&
    filteredServices.every((s) => selectedIds.has(s._id.toString()));

  const selectedServices = filteredServices.filter((s) =>
    selectedIds.has(s._id.toString()),
  );
  const allSelectedActive =
    selectedServices.length > 0 &&
    selectedServices.every((s) => s.isActive === true);
  const allSelectedInactive =
    selectedServices.length > 0 &&
    selectedServices.every((s) => s.isActive !== true);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map((s) => s._id.toString())));
    }
  }, [allPageSelected, filteredServices]);

  const openSingleAction = useCallback(
    (action: SingleActionType, service: ServiceWithVirtuals) => {
      setTargetService(service);
      setActionType(action);
      setRejectionReason("");
    },
    [],
  );

  const openBulkAction = useCallback(
    (action: BulkActionType) => {
      if (selectedIds.size === 0) return;
      setActionType(action);
      setTargetService(null);
    },
    [selectedIds.size],
  );

  const closeDialog = useCallback(() => {
    setActionType(null);
    setTargetService(null);
    setRejectionReason("");
  }, []);

  const handleApprove = async () => {
    if (!targetService) return;
    try {
      await approveService(targetService._id.toString());
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleReject = async () => {
    if (!targetService || !rejectionReason.trim()) return;
    try {
      await rejectService(targetService._id.toString(), {
        reason: rejectionReason,
      });
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleActivate = async () => {
    if (!targetService) return;
    try {
      await updateService(targetService._id.toString(), { isActive: true });
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleDeactivate = async () => {
    if (!targetService) return;
    try {
      await updateService(targetService._id.toString(), { isActive: false });
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleDelete = async () => {
    if (!targetService) return;
    try {
      await deleteService(targetService._id.toString());
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleRestore = async () => {
    if (!targetService) return;
    try {
      await restoreService(targetService._id.toString());
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handlePermanentDelete = async () => {
    if (!targetService) return;
    try {
      await permanentlyDeleteService(targetService._id.toString());
      refetchAll();
      closeDialog();
    } catch {}
  };
  const handleBulkAction = async () => {
    const ids = Array.from(selectedIds);
    try {
      if (actionType === "bulk-activate")
        await bulkUpdateServices({ serviceIds: ids, updates: { isActive: true } });
      else if (actionType === "bulk-deactivate")
        await bulkUpdateServices({ serviceIds: ids, updates: { isActive: false } });
      else if (actionType === "bulk-delete")
        await Promise.all(ids.map((id) => deleteService(id)));
      refetchAll();
      closeDialog();
    } catch {}
  };

  const pendingCount = services.filter(
    (s) => !s.isDeleted && (s.isPending || (s.isActive === true && !s.approvedBy)),
  ).length;

  const tabs: {
    key: StatusTab;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { key: "active", label: "Active", shortLabel: "Active", icon: Activity },
    {
      key: "pending",
      label: "Pending Approval",
      shortLabel: "Pending",
      icon: Clock,
      badge: pendingCount,
    },
    {
      key: "inactive",
      label: "Inactive",
      shortLabel: "Inactive",
      icon: ToggleLeft,
    },
    { key: "deleted", label: "Deleted", shortLabel: "Deleted", icon: Archive },
  ];

  if (isLoading && !data) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading services…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950 text-center p-8">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="text-zinc-700 dark:text-zinc-300 font-medium">
          Failed to load services
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm sticky top-0 z-20">
        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 overflow-hidden">
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <Link
            href="/admin"
            className="flex items-center gap-1 sm:gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shrink-0">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="flex items-center gap-1 sm:gap-1.5 text-zinc-900 dark:text-zinc-200 font-medium truncate">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            Services
          </span>
        </nav>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
        <StatsBar />

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-xl overflow-hidden">
          {/* ── Panel header ───────────────────────────────────────────────── */}
          <div className="px-4 sm:px-5 pt-4 pb-0 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
            {/* Title + controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Service Management
                </h1>
                <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {total.toLocaleString()} service{total !== 1 ? "s" : ""}{" "}
                  &middot; page {page} of {totalPages}
                </p>
              </div>

              {/* Search + refresh */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by title…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-7 py-2 sm:py-1.5 w-full sm:w-52 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => refetchAll()}
                  title="Refresh"
                  className="shrink-0 p-2 sm:p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-none">
              {tabs.map(({ key, label, shortLabel, icon: Icon, badge }) => {
                const isPendingTab = key === "pending";
                const isActive = statusTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? isPendingTab
                          ? "border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-teal-500 text-teal-600 dark:text-teal-400"
                        : "border-transparent text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {badge != null && badge > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bulk toolbar ── */}
          {selectedIds.size > 0 && (
            <BulkToolbar
              count={selectedIds.size}
              statusTab={statusTab}
              allSelectedActive={allSelectedActive}
              allSelectedInactive={allSelectedInactive}
              onAction={openBulkAction}
              onClear={() => setSelectedIds(new Set())}
            />
          )}

          {/* ── Loading spinner (data refresh) ── */}
          {isLoading && data && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && filteredServices.length === 0 && (
            <EmptyState tab={statusTab} hasSearch={Boolean(searchTerm)} />
          )}

          {/* ── Mobile card list (< md) ── */}
          {!isLoading && filteredServices.length > 0 && (
            <>
              {/* Mobile select-all bar */}
              <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <button
                  onClick={toggleSelectAll}
                  aria-label="Select all on this page"
                  className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  {allPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-teal-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Select all</span>
                </button>
                <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-600 tabular-nums">
                  {filteredServices.length} item
                  {filteredServices.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Card list — mobile only */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service._id.toString()}
                    service={service}
                    isSelected={selectedIds.has(service._id.toString())}
                    onToggleSelect={toggleSelect}
                    onAction={openSingleAction}
                  />
                ))}
              </div>

              {/* ── Desktop table (>= md) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                      <th className="w-10 px-4 py-2.5 text-left">
                        <button
                          onClick={toggleSelectAll}
                          aria-label="Select all"
                          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                          {allPageSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      {[
                        { label: "Service", width: "" },
                        { label: "Category", width: "w-32", hide: "hidden lg:table-cell" },
                        { label: "Status", width: "w-28" },
                        { label: "Price", width: "w-28", hide: "hidden lg:table-cell" },
                        { label: "Provider Earnings", width: "w-36", hide: "hidden xl:table-cell" },
                        { label: "Created", width: "w-28", hide: "hidden xl:table-cell" },
                        { label: "", width: "w-12" },
                      ].map(({ label, width, hide }) => (
                        <th
                          key={label || "actions"}
                          className={`px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase ${width} ${hide ?? ""}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredServices.map((service) => {
                      const sid = service._id.toString();
                      const isSelected = selectedIds.has(sid);
                      const coverImg = getCoverImage(service);

                      return (
                        <tr
                          key={sid}
                          className={`group transition-colors ${
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-950/30"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                          }`}>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleSelect(sid)}
                              aria-label={`Select ${service.title}`}
                              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-teal-500" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {coverImg ? (
                                <Image
                                  src={coverImg}
                                  alt={service.title}
                                  width={36}
                                  height={36}
                                  className="w-9 h-9 rounded-md object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-700">
                                  <Briefcase className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-zinc-900 dark:text-zinc-200 truncate max-w-45 lg:max-w-60">
                                  {service.title}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-45 lg:max-w-60 mt-0.5">
                                  /{service.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 truncate max-w-30">
                              {typeof service.categoryId === "object"
                                ? ((
                                    service.categoryId as unknown as {
                                      catName?: string;
                                    }
                                  ).catName ?? "Uncategorized")
                                : "Category"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge service={service} />
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                              {formatPrice(service)}
                            </span>
                          </td>
                          <td className="hidden xl:table-cell px-4 py-3">
                            {service.providerEarnings != null ? (
                              <span className="text-teal-600 dark:text-teal-400 font-semibold tabular-nums">
                                {service.servicePricing?.currency}{" "}
                                {service.providerEarnings.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-600">
                                —
                              </span>
                            )}
                          </td>
                          <td className="hidden xl:table-cell px-4 py-3">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                              {formatDate(service.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ActionsDropdown
                              service={service}
                              onAction={openSingleAction}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* Dialogs                                                             */}
      {/* ================================================================== */}

      {actionType === "approve" && targetService && (
        <ConfirmDialog
          title={
            targetService.isActive && !targetService.approvedBy
              ? "Verify Service"
              : "Approve Service"
          }
          description={
            targetService.isActive && !targetService.approvedBy
              ? `"${targetService.title}" is already live via auto-activation. Approving will add the verified badge visible to customers.`
              : `Approve "${targetService.title}"? It will become visible to all users immediately.`
          }
          confirmLabel={
            approving
              ? "Approving…"
              : targetService.isActive && !targetService.approvedBy
                ? "Verify Service"
                : "Approve Service"
          }
          confirmVariant="primary"
          onConfirm={handleApprove}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {actionType === "reject" && targetService && (
        <ConfirmDialog
          title="Reject Service"
          description={`Provide a reason for rejecting "${targetService.title}". This reason will be visible to the provider.`}
          confirmLabel={rejecting ? "Rejecting…" : "Reject Service"}
          confirmVariant="warning"
          onConfirm={handleReject}
          onCancel={closeDialog}
          disabled={isProcessing || !rejectionReason.trim()}>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter a clear, actionable reason…"
            rows={4}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none transition-colors"
          />
        </ConfirmDialog>
      )}

      {actionType === "activate" && targetService && (
        <ConfirmDialog
          title="Activate Service"
          description={`Activate "${targetService.title}"? It will become visible to users immediately.`}
          confirmLabel={updating ? "Activating…" : "Activate"}
          confirmVariant="primary"
          onConfirm={handleActivate}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {actionType === "deactivate" && targetService && (
        <ConfirmDialog
          title="Deactivate Service"
          description={`Deactivate "${targetService.title}"? It will be hidden from users but not deleted.`}
          confirmLabel={updating ? "Deactivating…" : "Deactivate"}
          confirmVariant="neutral"
          onConfirm={handleDeactivate}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {actionType === "delete" && targetService && (
        <ConfirmDialog
          title="Delete Service"
          description={`Delete "${targetService.title}"? This is a soft delete — it can be restored later from the Deleted tab.`}
          confirmLabel={deleting ? "Deleting…" : "Delete Service"}
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {actionType === "restore" && targetService && (
        <ConfirmDialog
          title="Restore Service"
          description={`Restore "${targetService.title}"? It will be moved back to the Active tab.`}
          confirmLabel={restoring ? "Restoring…" : "Restore Service"}
          confirmVariant="primary"
          onConfirm={handleRestore}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {actionType === "permanent-delete" && targetService && (
        <ConfirmDialog
          title="Permanently Delete"
          description={`This will irreversibly remove "${targetService.title}" from the database. This cannot be undone.`}
          confirmLabel={
            permanentlyDeleting ? "Deleting…" : "Yes, Delete Forever"
          }
          confirmVariant="danger"
          onConfirm={handlePermanentDelete}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}

      {(actionType === "bulk-activate" ||
        actionType === "bulk-deactivate" ||
        actionType === "bulk-delete") && (
        <ConfirmDialog
          title={
            actionType === "bulk-activate"
              ? `Activate ${selectedIds.size} Service${selectedIds.size !== 1 ? "s" : ""}`
              : actionType === "bulk-deactivate"
                ? `Deactivate ${selectedIds.size} Service${selectedIds.size !== 1 ? "s" : ""}`
                : `Delete ${selectedIds.size} Service${selectedIds.size !== 1 ? "s" : ""}`
          }
          description={`This action will affect all ${selectedIds.size} selected service${selectedIds.size !== 1 ? "s" : ""}. Are you sure you want to continue?`}
          confirmLabel={
            isProcessing
              ? "Processing…"
              : actionType === "bulk-delete"
                ? "Delete All Selected"
                : "Confirm"
          }
          confirmVariant={
            actionType === "bulk-delete"
              ? "danger"
              : actionType === "bulk-deactivate"
                ? "neutral"
                : "primary"
          }
          onConfirm={handleBulkAction}
          onCancel={closeDialog}
          disabled={isProcessing}
        />
      )}
    </main>
  );
}
