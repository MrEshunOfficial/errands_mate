"use client";

// components/homepage/provider/ProviderStats.tsx

import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
// Mirrors the shape returned by useProviderDashboard().dashboard.
// Extend as the API response evolves.

export interface ProviderDashboardData {
  completedBookings?: number;
  activeBookings?: number;
  matchedTasks?: number;
  totalEarnings?: number;
  taskOpportunities?: {
    matched?: number;
    floating?: number;
    newThisWeek?: number;
  };
}

interface StatCardProps {
  value: string | number;
  label: string;
  gradient: string;
  border: string;
  textColor: string;
}

function StatCard({ value, label, gradient, border, textColor }: StatCardProps) {
  return (
    <div className={`bg-linear-to-br ${gradient} p-4 rounded-xl border ${border}`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-sm mt-0.5 ${textColor} opacity-80`}>{label}</p>
    </div>
  );
}

interface ProviderStatsProps {
  dashboard: ProviderDashboardData | null | undefined;
  loading: boolean;
}

export default function ProviderStats({ dashboard, loading }: ProviderStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  if (!dashboard) return null;

  const stats: StatCardProps[] = [
    {
      value: dashboard.completedBookings ?? 0,
      label: "Completed Tasks",
      gradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      border: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-900 dark:text-blue-100",
    },
    {
      value: dashboard.activeBookings ?? 0,
      label: "Active Bookings",
      gradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      border: "border-green-200 dark:border-green-800",
      textColor: "text-green-900 dark:text-green-100",
    },
    {
      value: dashboard.matchedTasks ?? 0,
      label: "Matched Tasks",
      gradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      border: "border-purple-200 dark:border-purple-800",
      textColor: "text-purple-900 dark:text-purple-100",
    },
    {
      value: `GHS ${(dashboard.totalEarnings ?? 0).toFixed(2)}`,
      label: "Total Earnings",
      gradient: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
      border: "border-amber-200 dark:border-amber-800",
      textColor: "text-amber-900 dark:text-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
