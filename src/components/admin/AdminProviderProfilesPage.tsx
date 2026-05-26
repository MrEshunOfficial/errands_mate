"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  Star,
  Search,
  RefreshCw,
  ShieldCheck,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAllProviders,
  useAdminProviderActions,
  useProviderStats,
} from "@/hooks/profiles/useProviderProfile";
import type { ProviderProfile } from "@/types/provider.profile.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Available", label: "Available" },
  { value: "Booked", label: "Booked" },
  { value: "closed", label: "Closed" },
  { value: "requested", label: "Requested" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Available:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    Booked:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    closed:
      "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
    requested:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] ?? "bg-stone-100 text-stone-600"}`}
    >
      {status}
    </span>
  );
}

// ─── Provider Row ─────────────────────────────────────────────────────────────

function ProviderRow({
  provider,
  onRefetch,
}: {
  provider: ProviderProfile;
  onRefetch: () => void;
}) {
  const { verifyAddress, verifyAddressState, adminDeleteProvider, adminDeleteProviderState, adminRestoreProvider, adminRestoreProviderState } =
    useAdminProviderActions(provider._id, {
      onSuccess: () => {
        toast.success("Action completed");
        onRefetch();
      },
    });

  const isDeleted = !!provider.isDeleted;
  const locationLabel =
    provider.locationData?.city
      ? `${provider.locationData.city}${provider.locationData.region ? `, ${provider.locationData.region}` : ""}`
      : "—";

  const rating = provider.ratingStats;
  const actioning =
    verifyAddressState.loading ||
    adminDeleteProviderState.loading ||
    adminRestoreProviderState.loading;

  const handleVerify = async () => {
    await verifyAddress();
    if (verifyAddressState.error) toast.error(verifyAddressState.error);
  };

  const handleDelete = async () => {
    if (!confirm("Soft-delete this provider profile?")) return;
    await adminDeleteProvider();
    if (adminDeleteProviderState.error) toast.error(adminDeleteProviderState.error);
  };

  const handleRestore = async () => {
    await adminRestoreProvider();
    if (adminRestoreProviderState.error) toast.error(adminRestoreProviderState.error);
  };

  return (
    <tr className={`border-b border-stone-100 dark:border-stone-800 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/30 ${isDeleted ? "opacity-60" : ""}`}>
      {/* Provider */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
            <Users size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 leading-tight">
              {provider.businessName ?? "Unnamed Provider"}
            </p>
            <p className="text-[11px] text-stone-400 font-mono">
              {provider._id.slice(-8)}
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={provider.status} />
        {isDeleted && (
          <span className="ml-1.5 text-[10px] font-semibold text-red-500 uppercase">
            deleted
          </span>
        )}
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          <MapPin size={12} className="shrink-0" />
          <span>{locationLabel}</span>
        </div>
        {provider.locationData?.ghanaPostGPS && (
          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
            {provider.locationData.ghanaPostGPS}
          </p>
        )}
      </td>

      {/* Address Verified */}
      <td className="px-4 py-3">
        {provider.isAddressVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={12} />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-stone-400">
            <XCircle size={12} />
            Unverified
          </span>
        )}
      </td>

      {/* Availability */}
      <td className="px-4 py-3">
        {provider.isAlwaysAvailable ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <CheckCircle size={12} />
            Always
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <Clock size={12} />
            Scheduled
          </span>
        )}
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        {rating && rating.count > 0 ? (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              {rating.average.toFixed(1)}
            </span>
            <span className="text-[11px] text-stone-400">({rating.count})</span>
          </div>
        ) : (
          <span className="text-xs text-stone-400">No ratings</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/providers/${provider._id}`}
            target="_blank"
            title="View public profile"
            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <ExternalLink size={14} />
          </Link>

          {!isDeleted && !provider.isAddressVerified && (
            <button
              onClick={handleVerify}
              disabled={actioning}
              title="Verify address"
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-40"
            >
              <ShieldCheck size={14} />
            </button>
          )}

          {isDeleted ? (
            <button
              onClick={handleRestore}
              disabled={actioning}
              title="Restore profile"
              className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-40"
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={actioning}
              title="Soft-delete profile"
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProviderProfilesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);

  const { data: stats } = useProviderStats();
  const { data, loading, error, refetch } = useAllProviders({
    limit: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    includeDeleted,
  });

  const providers = data?.providerProfiles ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = providers;
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.businessName?.toLowerCase().includes(q) ||
          p._id.toLowerCase().includes(q) ||
          p.locationData?.city?.toLowerCase().includes(q) ||
          p.locationData?.region?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [providers, statusFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              Provider Profiles
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manage provider verification, status, and visibility
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total Providers"
            value={stats.totalProviders ?? 0}
            accent="border-stone-200 dark:border-stone-700/50 text-stone-900 dark:text-stone-50"
          />
          <StatCard
            label="Active"
            value={stats.activeProviders ?? 0}
            accent="border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10"
          />
          <StatCard
            label="Deleted"
            value={stats.deletedProviders ?? 0}
            accent="border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-900/10"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Search by name, city, region, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(0); }}
            className="rounded"
          />
          Include deleted
        </label>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading providers…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-2">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">No providers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/50">
                  {["Provider", "Status", "Location", "Address", "Availability", "Rating", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((p) => (
                  <ProviderRow key={p._id} provider={p} onRefetch={refetch} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
          <p>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
            {total} providers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
