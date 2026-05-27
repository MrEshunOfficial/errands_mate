"use client";

import type { BookingStats } from "@/types/booking/booking.types";
import {
  ClipboardList,
  Play,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  CheckCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { StatCard, AdminStatStripSkeleton } from "./BookingStatCard";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CARDS = [
  {
    label: "Total",
    getValue: (s: BookingStats) => s.total,
    icon: ClipboardList,
    accent: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    label: "Confirmed",
    getValue: (s: BookingStats) => s.CONFIRMED,
    icon: CheckCircle2,
    accent: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    label: "In Progress",
    getValue: (s: BookingStats) => s.IN_PROGRESS,
    icon: Play,
    accent: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    label: "Awaiting Review",
    getValue: (s: BookingStats) => s.AWAITING_VALIDATION,
    icon: Eye,
    accent: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    label: "Disputed",
    getValue: (s: BookingStats) => s.DISPUTED,
    icon: AlertTriangle,
    accent: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  {
    label: "Rebuttal",
    getValue: (s: BookingStats) => s.REBUTTAL_SUBMITTED,
    icon: ClipboardList,
    accent: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
] as const;

const PAYMENT_CARDS = [
  {
    label: "Validated",
    getValue: (s: BookingStats) => s.VALIDATED,
    icon: CheckCheck,
    accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    label: "Completed",
    getValue: (s: BookingStats) => s.COMPLETED,
    icon: CheckCircle2,
    accent: "bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
  },
  {
    label: "Cancelled",
    getValue: (s: BookingStats) => s.CANCELLED,
    icon: XCircle,
    accent: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
  {
    label: "Resolved",
    getValue: (s: BookingStats) => s.RESOLVED,
    icon: CheckCheck,
    accent: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    label: "Open Disputes",
    getValue: (s: BookingStats) => s.openDisputes,
    icon: AlertTriangle,
    accent: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  {
    label: "Rebuttals",
    getValue: (s: BookingStats) => s.pendingRebuttals,
    icon: Eye,
    accent: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
] as const;

// ─── Derived health metrics ───────────────────────────────────────────────────

interface HealthMetricProps {
  stats: BookingStats;
}

function HealthMetrics({ stats }: HealthMetricProps) {
  const total = stats.total || 1;
  const completionRate = Math.round(((stats.COMPLETED ?? 0) / total) * 100);
  const disputeRate = Math.round(
    (((stats.DISPUTED ?? 0) + (stats.REBUTTAL_SUBMITTED ?? 0)) / total) * 100,
  );
  const resolvedRate = Math.round(((stats.RESOLVED ?? 0) / total) * 100);

  const activeCount =
    (stats.CONFIRMED ?? 0) +
    (stats.IN_PROGRESS ?? 0) +
    (stats.AWAITING_VALIDATION ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono uppercase tracking-wide">
            Completion Rate
          </p>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {completionRate}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30">
        <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
        <div>
          <p className="text-[10px] text-red-700 dark:text-red-400 font-mono uppercase tracking-wide">
            Dispute Rate
          </p>
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {disputeRate}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30">
        <CheckCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <div>
          <p className="text-[10px] text-blue-700 dark:text-blue-400 font-mono uppercase tracking-wide">
            Resolved Rate
          </p>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
            {resolvedRate}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
        <Activity className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono uppercase tracking-wide">
            Active Now
          </p>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
            {activeCount}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Attention banner ─────────────────────────────────────────────────────────

function AttentionBanner({ stats }: { stats: BookingStats }) {
  const disputed = (stats.DISPUTED ?? 0) + (stats.REBUTTAL_SUBMITTED ?? 0);
  const pendingValidation = stats.AWAITING_VALIDATION ?? 0;
  const openDisputes = stats.openDisputes ?? 0;

  const issues: string[] = [];
  if (openDisputes > 0) issues.push(`${openDisputes} open dispute${openDisputes !== 1 ? "s" : ""} need resolution`);
  else if (disputed > 0) issues.push(`${disputed} booking${disputed !== 1 ? "s" : ""} in dispute`);
  if (pendingValidation > 0) issues.push(`${pendingValidation} booking${pendingValidation !== 1 ? "s" : ""} awaiting validation`);

  if (issues.length === 0) return null;

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 text-xs">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
      <span>
        <span className="font-semibold">Admin attention needed: </span>
        {issues.join(" · ")}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BookingStatsGridProps {
  stats: BookingStats | null;
  loading: boolean;
}

export function BookingStatsGrid({ stats, loading }: BookingStatsGridProps) {
  if (loading) return <AdminStatStripSkeleton />;

  return (
    <div className="space-y-2">
      {stats && <AttentionBanner stats={stats} />}

      {/* Row 1 — status counts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUS_CARDS.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={stats ? (c.getValue(stats) ?? 0) : undefined}
            icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>

      {/* Row 2 — more status + payment counts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PAYMENT_CARDS.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={stats ? (c.getValue(stats) ?? 0) : undefined}
            icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>

      {/* Row 3 — derived health metrics */}
      {stats && <HealthMetrics stats={stats} />}
    </div>
  );
}
