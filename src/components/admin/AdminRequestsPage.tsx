"use client";

import { useState, useMemo } from "react";
import { useProviderRequests } from "@/hooks/requests/useProviderRequest";
import { ProviderRequest, RequestStatus, RequestSource } from "@/types/provider.request.types";
import {
  RefreshCw,
  Search,
  AlertCircle,
  Loader2,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<RequestStatus, { label: string; classes: string; dot: string }> = {
  [RequestStatus.PENDING]: {
    label: "Pending",
    classes: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
    dot: "bg-amber-500 animate-pulse",
  },
  [RequestStatus.ACCEPTED]: {
    label: "Accepted",
    classes: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
    dot: "bg-emerald-500",
  },
  [RequestStatus.REJECTED]: {
    label: "Rejected",
    classes: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
    dot: "bg-red-500",
  },
  [RequestStatus.RESCHEDULED]: {
    label: "Rescheduled",
    classes: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
    dot: "bg-sky-500",
  },
  [RequestStatus.EXPIRED]: {
    label: "Expired",
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  [RequestStatus.CANCELLED]: {
    label: "Cancelled",
    classes: "text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
    dot: "bg-stone-300 dark:bg-stone-600",
  },
  [RequestStatus.COMPLETED]: {
    label: "Completed",
    classes: "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/50",
    dot: "bg-teal-500",
  },
};

const SOURCE_LABEL: Record<RequestSource, string> = {
  [RequestSource.TASK_MATCH]: "Task Match",
  [RequestSource.TASK_INTEREST]: "Task Interest",
  [RequestSource.SERVICE_BROWSE]: "Service Browse",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PopulatedUser = { _id: string; name?: string; email?: string };
type MaybePopulated = string | PopulatedUser | null | undefined;

function getId(val: MaybePopulated): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  return val._id ?? null;
}

function getDisplayName(val: MaybePopulated): string {
  if (!val) return "—";
  if (typeof val === "object") return val.name ?? val.email ?? val._id.slice(-8).toUpperCase();
  return val.slice(-8).toUpperCase();
}

function matchesTerm(val: MaybePopulated, term: string): boolean {
  if (!val) return false;
  if (typeof val === "object") {
    return (
      val._id.toLowerCase().includes(term) ||
      (val.name?.toLowerCase().includes(term) ?? false) ||
      (val.email?.toLowerCase().includes(term) ?? false)
    );
  }
  return val.toLowerCase().includes(term);
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{value}</p>
      </div>
    </div>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────

function RequestRow({ req }: { req: ProviderRequest }) {
  const cfg = STATUS_CFG[req.status] ?? STATUS_CFG[RequestStatus.PENDING];

  return (
    <tr className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
          {req._id.slice(-8).toUpperCase()}
        </p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
          {SOURCE_LABEL[req.source] ?? req.source}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-stone-700 dark:text-stone-300">
          {getDisplayName(req.clientId as MaybePopulated)}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-stone-700 dark:text-stone-300">
          {getDisplayName(req.providerId as MaybePopulated)}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {req.schedule?.preferredDate ? fmtDate(req.schedule.preferredDate) : "Flexible"}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-stone-400 dark:text-stone-500">{fmtDate(req.createdAt)}</p>
      </td>
      <td className="px-4 py-3">
        {req.convertedToBookingId && (
          <Link
            href={`/admin/bookings/${req.convertedToBookingId}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <ExternalLink size={11} />
            Booking
          </Link>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | RequestStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: RequestStatus.PENDING, label: "Pending" },
  { value: RequestStatus.ACCEPTED, label: "Accepted" },
  { value: RequestStatus.REJECTED, label: "Rejected" },
  { value: RequestStatus.RESCHEDULED, label: "Rescheduled" },
  { value: RequestStatus.CANCELLED, label: "Cancelled" },
  { value: RequestStatus.EXPIRED, label: "Expired" },
  { value: RequestStatus.COMPLETED, label: "Completed" },
];

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, loading, error, refetch } = useProviderRequests();

  const requests: ProviderRequest[] = useMemo(() => {
    const list = data?.requests ?? [];
    let result = [...list];

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (r) =>
          r._id.toLowerCase().includes(term) ||
          matchesTerm(r.clientId as MaybePopulated, term) ||
          matchesTerm(r.providerId as MaybePopulated, term) ||
          r.taskTitle?.toLowerCase().includes(term) ||
          r.clientMessage?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [data, statusFilter, search]);

  const stats = useMemo(() => {
    const all = data?.requests ?? [];
    return {
      total: all.length,
      pending: all.filter((r) => r.status === RequestStatus.PENDING).length,
      accepted: all.filter((r) => r.status === RequestStatus.ACCEPTED).length,
      rejected: all.filter((r) => r.status === RequestStatus.REJECTED).length,
    };
  }, [data]);

  return (
    <div className="h-full bg-transparent">
      {/* Header */}
      <div className="border-b backdrop-blur-3xl sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold">Request Management</h1>
            <p className="text-xs text-muted-foreground">
              Admin · All service requests across the platform
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} icon={Send} accent="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accent="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300" />
          <StatCard label="Accepted" value={stats.accepted} icon={CheckCircle2} accent="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client, provider, task…"
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-stone-400" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2.5 m-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => refetch()}
                className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <Inbox size={24} className="text-stone-400 dark:text-stone-500" />
              </div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                No requests found
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No service requests have been created yet"}
              </p>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Provider</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Preferred Date</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <RequestRow key={req._id} req={req} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
            Showing {requests.length} of {data?.requests?.length ?? 0} requests
          </p>
        )}
      </div>
    </div>
  );
}
