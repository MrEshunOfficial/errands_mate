"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Briefcase,
  Users,
  ClipboardList,
  LayoutGrid,
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useBookingStats } from "@/hooks/booking/useBookings";
import { useProviderStats } from "@/hooks/profiles/useProviderProfile";
import { useAdminTaskStats } from "@/hooks/tasks/useTasks";
import { useServiceStats } from "@/hooks/services/useServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function pct(part?: number, total?: number): string {
  if (!part || !total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          {label}
        </p>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={13} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 mt-1">{sub}</p>
      )}
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
    <div>
      <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Stat Row (horizontal bar) ────────────────────────────────────────────────

function StatBar({
  label,
  value,
  total,
  color,
  hexColor,
}: {
  label: string;
  value?: number;
  total?: number;
  color?: string;
  hexColor?: string;
}) {
  const ratio = value && total ? Math.min(value / total, 1) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-24 sm:w-36 shrink-0 text-xs text-stone-600 dark:text-stone-400 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color ?? ""}`}
          style={{
            width: `${ratio * 100}%`,
            ...(hexColor ? { backgroundColor: hexColor } : {}),
          }}
        />
      </div>
      <span className="w-10 sm:w-12 text-right text-xs font-semibold text-stone-700 dark:text-stone-300 tabular-nums">
        {fmt(value)}
      </span>
      <span className="hidden sm:block w-10 text-right text-[11px] text-stone-400 dark:text-stone-500">
        {pct(value, total)}
      </span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse bg-stone-100 dark:bg-stone-800 rounded-xl ${className}`}
    />
  );
}

// ─── Recharts tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-stone-700 dark:text-stone-200 mb-1">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="text-stone-500 dark:text-stone-400">
          {p.name}:{" "}
          <span className="font-bold text-stone-800 dark:text-stone-100">
            {p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Booking status colours ───────────────────────────────────────────────────

const BOOKING_STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  AWAITING_VALIDATION: "#8b5cf6",
  VALIDATED: "#10b981",
  DISPUTED: "#ef4444",
  REBUTTAL_SUBMITTED: "#f97316",
  COMPLETED: "#14b8a6",
  RESOLVED: "#6366f1",
  CANCELLED: "#9ca3af",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  DEPOSIT_PAID: "#60a5fa",
  PARTIALLY_PAID: "#fb923c",
  PAID: "#34d399",
  REFUNDED: "#a78bfa",
  FAILED: "#f87171",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const {
    data: bookingStats,
    loading: bookingLoading,
    refetch: refetchBookings,
  } = useBookingStats();
  const {
    data: providerStats,
    loading: providerLoading,
    refetch: refetchProviders,
  } = useProviderStats();
  const {
    data: taskStats,
    loading: taskLoading,
    refetch: refetchTasks,
  } = useAdminTaskStats();
  const {
    data: serviceStats,
    isLoading: serviceLoading,
    refetch: refetchServices,
  } = useServiceStats();

  const loading =
    bookingLoading || providerLoading || taskLoading || serviceLoading;

  const refetchAll = () => {
    refetchBookings();
    refetchProviders();
    refetchTasks();
    refetchServices();
  };

  const BOOKING_STATUS_KEYS = [
    "CONFIRMED",
    "IN_PROGRESS",
    "AWAITING_VALIDATION",
    "VALIDATED",
    "DISPUTED",
    "REBUTTAL_SUBMITTED",
    "COMPLETED",
    "RESOLVED",
    "CANCELLED",
  ] as const;

  // Booking status chart data — built from flat stats fields
  const bookingStatusData = bookingStats
    ? BOOKING_STATUS_KEYS.map((status) => ({
        name: status.replace(/_/g, " "),
        value: bookingStats[status] ?? 0,
        color: BOOKING_STATUS_COLORS[status] ?? "#9ca3af",
      }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
    : [];

  // Payment status — not currently returned by the stats endpoint
  const paymentStatusData: { name: string; value: number; color: string }[] = [];

  // Task funnel data
  const taskFunnelData = taskStats
    ? [
        { name: "Total", value: taskStats.total, color: "#3b82f6" },
        { name: "Matched", value: taskStats.matched, color: "#10b981" },
        { name: "Pending", value: taskStats.pending, color: "#f59e0b" },
        { name: "Floating", value: taskStats.floating, color: "#8b5cf6" },
        { name: "Cancelled", value: taskStats.cancelled, color: "#9ca3af" },
        { name: "Expired", value: taskStats.expired, color: "#f87171" },
      ]
    : [];

  // // Service status data
  // const serviceData = serviceStats
  //   ? [
  //       { name: "Active", value: serviceStats.active, color: "#10b981" },
  //       { name: "Pending", value: serviceStats.pending, color: "#f59e0b" },
  //       { name: "Rejected", value: serviceStats.rejected, color: "#ef4444" },
  //       { name: "Suspended", value: serviceStats.suspended, color: "#9ca3af" },
  //     ].filter((d) => d.value > 0)
  //   : [];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp
              size={18}
              className="text-blue-600 dark:text-blue-400 shrink-0"
            />
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
              Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Platform-wide performance overview
          </p>
        </div>
        <button
          onClick={refetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-50 shrink-0">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {bookingLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Bookings"
              value={fmt(bookingStats?.total)}
              sub={`${fmt(bookingStats?.COMPLETED)} completed`}
              icon={Briefcase}
              accent="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            />
            <KpiCard
              label="Revenue"
              value="—"
              sub="from completed bookings"
              icon={DollarSign}
              accent="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
            />
          </>
        )}
        {providerLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <KpiCard
            label="Providers"
            value={fmt(providerStats?.totalProviders)}
            sub={`${fmt(providerStats?.activeProviders)} active`}
            icon={Users}
            accent="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
          />
        )}
        {taskLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <KpiCard
            label="Tasks Posted"
            value={fmt(taskStats?.total)}
            sub={`${taskStats?.matchingSuccessRate != null ? Math.round(taskStats.matchingSuccessRate) : "—"}% match rate`}
            icon={ClipboardList}
            accent="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
          />
        )}
      </div>

      {/* Booking stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Booking status bar chart */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4">
            Bookings by Status
          </p>
          {bookingLoading ? (
            <Skeleton className="h-48" />
          ) : bookingStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={bookingStatusData}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="value" radius={4} name="Bookings">
                  {bookingStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment status pie chart */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4">
            Payment Status Distribution
          </p>
          {bookingLoading ? (
            <Skeleton className="h-48" />
          ) : paymentStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}>
                  {paymentStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-[11px] text-stone-600 dark:text-stone-400">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Booking quick stats */}
      {!bookingLoading && bookingStats && (
        <Section title="Booking breakdown">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-stone-100 dark:border-stone-800">
              {[
                {
                  label: "Active",
                  value:
                    (bookingStats.CONFIRMED ?? 0) +
                    (bookingStats.IN_PROGRESS ?? 0) +
                    (bookingStats.AWAITING_VALIDATION ?? 0),
                  icon: Clock,
                  color: "text-sky-600 dark:text-sky-400",
                },
                {
                  label: "Disputed",
                  value:
                    (bookingStats.DISPUTED ?? 0) +
                    (bookingStats.REBUTTAL_SUBMITTED ?? 0),
                  icon: AlertTriangle,
                  color: "text-red-600 dark:text-red-400",
                },
                {
                  label: "Completed",
                  value: bookingStats.COMPLETED ?? 0,
                  icon: CheckCircle,
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Cancelled",
                  value: bookingStats.CANCELLED ?? 0,
                  icon: XCircle,
                  color: "text-stone-500 dark:text-stone-400",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={16} className={color} />
                  <div>
                    <p className="text-lg font-bold text-stone-900 dark:text-stone-50 tabular-nums">
                      {fmt(value)}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {BOOKING_STATUS_KEYS.filter(
                (status) => (bookingStats[status] ?? 0) > 0,
              )
                .sort(
                  (a, b) =>
                    (bookingStats[b] ?? 0) - (bookingStats[a] ?? 0),
                )
                .map((status) => (
                  <StatBar
                    key={status}
                    label={status.replace(/_/g, " ")}
                    value={bookingStats[status] ?? 0}
                    total={bookingStats.total}
                    hexColor={BOOKING_STATUS_COLORS[status] ?? "#9ca3af"}
                  />
                ))}
            </div>
          </div>
        </Section>
      )}

      {/* Tasks + Services side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task funnel */}
        <Section title="Tasks">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
            {taskLoading ? (
              <Skeleton className="h-40" />
            ) : !taskStats ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No task data
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-amber-500" />
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      Task funnel
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {taskStats.matchingSuccessRate != null
                      ? `${Math.round(taskStats.matchingSuccessRate)}% match rate`
                      : ""}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={taskFunnelData}
                    margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar dataKey="value" radius={4} name="Tasks">
                      {taskFunnelData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </Section>

        {/* Services */}
        <Section title="Services">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
            {serviceLoading ? (
              <Skeleton className="h-40" />
            ) : !serviceStats ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No service data
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid size={15} className="text-indigo-500" />
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                    Service catalog · {fmt(serviceStats.total)} total
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      label: "Active",
                      value: serviceStats.active,
                      bar: "bg-emerald-500",
                    },
                    {
                      label: "Pending approval",
                      value: serviceStats.pending,
                      bar: "bg-amber-400",
                    },
                    {
                      label: "Rejected",
                      value: serviceStats.rejected,
                      bar: "bg-red-400",
                    },
                    {
                      label: "Suspended",
                      value: serviceStats.suspended,
                      bar: "bg-stone-400",
                    },
                    {
                      label: "Deleted",
                      value: serviceStats.deleted,
                      bar: "bg-stone-300 dark:bg-stone-600",
                    },
                  ].map(({ label, value, bar }) => (
                    <StatBar
                      key={label}
                      label={label}
                      value={value}
                      total={serviceStats.total}
                      color={bar}
                    />
                  ))}
                </div>
                {serviceStats.pending > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={11} />
                      {serviceStats.pending} service
                      {serviceStats.pending !== 1 ? "s" : ""} awaiting approval
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>
      </div>

      {/* Provider stats */}
      {!providerLoading && providerStats && (
        <Section title="Providers">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 p-3 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                {
                  label: "Total",
                  value: providerStats.totalProviders,
                  accent: "text-stone-900 dark:text-stone-50",
                },
                {
                  label: "Active",
                  value: providerStats.activeProviders,
                  accent: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Deleted",
                  value: providerStats.deletedProviders,
                  accent: "text-red-500 dark:text-red-400",
                },
              ].map(({ label, value, accent }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl font-bold tabular-nums ${accent}`}>
                    {fmt(value)}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <StatBar
                label="Active"
                value={providerStats.activeProviders}
                total={providerStats.totalProviders}
                color="bg-emerald-500"
              />
              <StatBar
                label="Deleted"
                value={providerStats.deletedProviders}
                total={providerStats.totalProviders}
                color="bg-red-400"
              />
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
