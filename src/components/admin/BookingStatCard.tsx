import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Shared by client, provider, and admin dashboards.
// `value` accepts number | string | undefined — undefined renders as "—".

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: React.ElementType;
  accent: string;
  /** Show a skeleton instead of value (admin passes per-card loading state) */
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/60 bg-card hover:border-border transition-colors min-w-0">
      <div className={`p-1.5 rounded-lg shrink-0 ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground truncate leading-none mb-0.5">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-3.5 w-6 mt-0.5" />
        ) : (
          <p className="text-sm font-bold text-foreground tabular-nums leading-none">
            {value ?? 0}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatSkeletonItem() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/60">
      <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-3.5 w-6" />
      </div>
    </div>
  );
}

/** 6-card skeleton for client / provider dashboard */
export function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatSkeletonItem key={i} />
      ))}
    </div>
  );
}

/** 12-card skeleton for admin dashboard */
export function AdminStatStripSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeletonItem key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeletonItem key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── SkeletonCard — booking list rows ────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="flex justify-between pt-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}
