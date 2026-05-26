// =============================================================================
// service-ui-primitives.tsx
// Shared design tokens + primitive components for service/provider UI
// =============================================================================

import React from "react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

export const CARD_BASE =
  "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

export const SECTION_LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500";

// ---------------------------------------------------------------------------
// Badge variants
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | "green"
  | "blue"
  | "violet"
  | "amber"
  | "red"
  | "gray";

export const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
  blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800",
  violet:
    "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-800",
  amber:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800",
  red: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800",
  gray: "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${CARD_BASE} p-5 sm:p-6 ${className}`}>{children}</div>
  );
}

export function CardHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h2>
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-gray-100 dark:bg-gray-800" />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={`${SECTION_LABEL} mb-3`}>{children}</p>;
}

export function TrustBadge({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  variant: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${BADGE_STYLES[variant]}`}>
      <span className="w-3 h-3 flex items-center justify-center">{icon}</span>
      {label}
    </span>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5">
      <p className={`${SECTION_LABEL} mb-0.5`}>{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 wrap-break-word">
        {value}
      </p>
    </div>
  );
}
