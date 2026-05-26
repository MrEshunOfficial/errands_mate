"use client";

import Link from "next/link";
import {
  Shield,
  Users,
  Briefcase,
  Send,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Activity,
} from "lucide-react";
import { useBookingStats } from "@/hooks/booking/useBookings";
import { useAdminOpenDisputes, useAdminPendingRebuttals } from "@/hooks/bookings/useCompletionAttempt";
import { useAuth } from "@/hooks/auth/useAuth";

// ─── Quick-link card ──────────────────────────────────────────────────────────

function QuickCard({
  href,
  icon: Icon,
  label,
  description,
  accent,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  accent: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-4 hover:shadow-md transition-all flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {label}
          </p>
          {badge != null && badge > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
      </div>
      <ArrowRight size={14} className="text-stone-400 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
    </Link>
  );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

function StatStrip({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useBookingStats();
  const { data: disputes } = useAdminOpenDisputes();
  const { data: rebuttals } = useAdminPendingRebuttals();

  const disputeCount = (disputes?.length ?? 0);
  const rebuttalCount = (rebuttals?.length ?? 0);
  const totalUrgent = disputeCount + rebuttalCount;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {user?.systemRole === "super_admin" ? "Super Admin" : "Admin"} · {user?.email}
          </p>
        </div>
        {totalUrgent > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 px-3 py-1.5 rounded-xl">
            <AlertTriangle size={13} />
            {totalUrgent} item{totalUrgent !== 1 ? "s" : ""} need attention
          </div>
        )}
      </div>

      {/* Booking stats strip */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatStrip
            label="Total Bookings"
            value={stats.total}
            accent="border-stone-200 dark:border-stone-700/50 text-stone-900 dark:text-stone-50"
          />
          <StatStrip
            label="Active"
            value={
              (stats.byStatus?.CONFIRMED ?? 0) +
              (stats.byStatus?.IN_PROGRESS ?? 0) +
              (stats.byStatus?.AWAITING_VALIDATION ?? 0)
            }
            accent="border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-900/10"
          />
          <StatStrip
            label="Disputed"
            value={(stats.byStatus?.DISPUTED ?? 0) + (stats.byStatus?.REBUTTAL_SUBMITTED ?? 0)}
            accent="border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-900/10"
          />
          <StatStrip
            label="Completed"
            value={stats.byStatus?.COMPLETED ?? 0}
            accent="border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10"
          />
        </div>
      )}

      {/* Activity prompt */}
      {totalUrgent > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-red-600 dark:text-red-400" />
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Immediate Attention Required</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {disputeCount > 0 && (
              <Link
                href="/admin/disputes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
              >
                <AlertTriangle size={12} />
                {disputeCount} open dispute{disputeCount !== 1 ? "s" : ""}
              </Link>
            )}
            {rebuttalCount > 0 && (
              <Link
                href="/admin/rebuttals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline"
              >
                <MessageSquare size={12} />
                {rebuttalCount} pending rebuttal{rebuttalCount !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
          Management
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickCard
            href="/admin/bookings"
            icon={Briefcase}
            label="Booking Management"
            description="View, filter, resolve and cancel all platform bookings"
            accent="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300"
          />
          <QuickCard
            href="/admin/service-requests"
            icon={Send}
            label="Request Management"
            description="All service requests across clients and providers"
            accent="bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300"
          />
          <QuickCard
            href="/admin/disputes"
            icon={AlertTriangle}
            label="Open Disputes"
            description="Disputed bookings awaiting provider rebuttal or admin resolution"
            accent="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300"
            badge={disputeCount}
          />
          <QuickCard
            href="/admin/rebuttals"
            icon={MessageSquare}
            label="Pending Rebuttals"
            description="Provider rebuttals that need admin review and final ruling"
            accent="bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300"
            badge={rebuttalCount}
          />
          <QuickCard
            href="/admin/users"
            icon={Users}
            label="User Management"
            description="Manage users, roles, and account deletion pipelines"
            accent="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300"
          />
          <QuickCard
            href="/admin/provider-profiles"
            icon={Users}
            label="Provider Profiles"
            description="Verify addresses, manage provider status and visibility"
            accent="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
          />
          <QuickCard
            href="/admin/services"
            icon={Briefcase}
            label="Service Catalog"
            description="Manage services and categories on the platform"
            accent="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
          />
        </div>
      </div>
    </div>
  );
}
