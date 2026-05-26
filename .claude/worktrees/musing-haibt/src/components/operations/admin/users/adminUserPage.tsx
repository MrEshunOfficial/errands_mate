// pages/admin/users/AdminUsersPage.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { User, DeletionReviewItem } from "@/types/user.types";
import {
  Search,
  Filter,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  X,
  Users,
} from "lucide-react";
import { UserTable } from "./UserTable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAccountDeletion } from "@/hooks/auth/useAccDeletion";
import { FilterPanel } from "./FilterPannel";
import { UserDetailsModal } from "./UserDeatilsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  status: string;
  role: string;
}

const DEFAULT_FILTERS: FilterState = { search: "", status: "all", role: "all" };

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Deletion review queue
  const [reviewItems, setReviewItems] = useState<DeletionReviewItem[]>([]);
  const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);
  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);

  // ── Build API params ───────────────────────────────────────────────────────

  const apiParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      limit: pageSize,
    };
    if (filters.search) params.search = filters.search;
    // "all" means no filter — backend returns every user including deleted
    if (filters.status !== "all") params.status = filters.status;
    if (filters.role !== "all") params.role = filters.role;
    return params;
  }, [currentPage, pageSize, filters]);

  // ── Hook ──────────────────────────────────────────────────────────────────

  const {
    users,
    pagination,
    listLoading,
    listError,
    refetch,
    clearListError,
    isLoading: deletionLoading,
    error: deletionError,
    getAdminReviewQueue,
    retryDeletion,
    clearError: clearDeletionError,
  } = useAccountDeletion(apiParams, { autoLoad: true });

  // Fetch failed-deletion review queue once on mount
  useEffect(() => {
    let mounted = true;
    getAdminReviewQueue().then((res) => {
      if (mounted && res?.items?.length) setReviewItems(res.items);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetryDeletion = async (eventId: string) => {
    clearDeletionError();
    setRetryingEventId(eventId);
    try {
      const result = await retryDeletion(eventId);
      if (result) {
        setReviewItems((prev) =>
          prev.filter((item) => item.eventId !== eventId),
        );
      }
    } finally {
      setRetryingEventId(null);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasActiveFilters = filters.status !== "all" || filters.role !== "all";
  const showReviewBanner = !reviewBannerDismissed && reviewItems.length > 0;
  const isViewingDeleted = filters.status === "deleted";

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const renderDeletedModeBanner = () => {
    if (!isViewingDeleted) return null;
    return (
      <div className="mb-3 flex items-center gap-2.5 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
        <Trash2 className="w-4 h-4 shrink-0" />
        <span className="font-medium">Viewing deleted accounts.</span>
        <span className="text-red-500 dark:text-red-400">
          Click any row to restore or permanently remove a user.
        </span>
        <button
          onClick={() => handleFilterChange("status", "all")}
          className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          aria-label="Clear filter">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderReviewBanner = () => {
    if (!showReviewBanner) return null;
    return (
      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg shrink-0">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
                {reviewItems.length} Failed Deletion
                {reviewItems.length > 1 ? "s" : ""} Need Review
              </h3>
              <button
                onClick={() => setReviewBannerDismissed(true)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
                aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
              The following deletion pipelines failed and require manual retry.
            </p>

            {deletionError && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 text-xs rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{deletionError}</span>
                <button onClick={clearDeletionError} aria-label="Dismiss error">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              {reviewItems.map((item) => {
                const isRetrying =
                  retryingEventId === item.eventId && deletionLoading;
                return (
                  <div
                    key={item.eventId}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800/60">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        User: <span className="font-mono">{item.userId}</span>
                      </p>
                      {item.failureReason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.failureReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.retryCount !== undefined
                          ? `Retried ${item.retryCount}×`
                          : ""}
                        {item.failedAt
                          ? ` · Failed ${new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(new Date(item.failedAt))}`
                          : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRetryDeletion(item.eventId)}
                      disabled={deletionLoading}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isRetrying ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {isRetrying ? "Retrying…" : "Retry"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          isViewingDeleted
            ? "bg-red-50 dark:bg-red-900/20"
            : "bg-gray-100 dark:bg-gray-800"
        }`}>
        {isViewingDeleted ? (
          <Trash2 className="w-10 h-10 text-red-400 dark:text-red-500" />
        ) : (
          <UserPlus className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {isViewingDeleted ? "No deleted accounts" : "No users found"}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
        {isViewingDeleted
          ? "There are no soft-deleted accounts matching your current filters."
          : filters.search || hasActiveFilters
            ? "Try adjusting your filters to see more results"
            : "There are no users in the system yet"}
      </p>
      {(filters.search || hasActiveFilters) && (
        <button
          onClick={() => {
            setFilters(DEFAULT_FILTERS);
            setCurrentPage(1);
          }}
          className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          Clear filters
        </button>
      )}
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load users
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
        {listError ?? "An error occurred while loading users"}
      </p>
      <button
        onClick={() => {
          clearListError();
          refetch();
        }}
        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );

  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;

    const { page, pages } = pagination;
    const showingStart = (page - 1) * pageSize + 1;
    const showingEnd = Math.min(page * pageSize, pagination.total);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{showingStart}</span> to{" "}
          <span className="font-medium">{showingEnd}</span> of{" "}
          <span className="font-medium">{pagination.total}</span>{" "}
          {isViewingDeleted ? "deleted " : ""}users
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              let pageNum: number;
              if (pages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= pages - 2) pageNum = pages - 4 + i;
              else pageNum = page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-10 h-10 px-3 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-2 gap-2">
        <div className="flex-1 flex flex-col items-start justify-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isViewingDeleted
              ? "Reviewing deleted accounts — restore or permanently remove"
              : "Manage system users, roles, and permissions"}
          </p>
        </div>

        {/* ── Search ── */}
        <div className="flex-1 relative flex items-center justify-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <div className="relative">
            <Button
              onClick={() => refetch()}
              disabled={listLoading}
              size="icon"
              className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors inline-flex items-center gap-2 disabled:opacity-50">
              <RefreshCw
                className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`}
              />
            </Button>
            {showReviewBanner && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {(filters.status !== "all" ? 1 : 0) +
                      (filters.role !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 border-none shadow-xl"
              align="end">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={() => {
                  setFilters({ ...DEFAULT_FILTERS, search: filters.search });
                  setCurrentPage(1);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Banners ── */}
      <div className="px-2 pt-2 space-y-2">
        {renderDeletedModeBanner()}
        {renderReviewBanner()}
      </div>

      {/* ── Users count summary ── */}
      {pagination && !listLoading && (
        <div className="px-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {pagination.total}
              </span>{" "}
              {isViewingDeleted ? "deleted account" : "user"}
              {pagination.total !== 1 ? "s" : ""}
              {hasActiveFilters || filters.search
                ? " matching filters"
                : " total"}
            </span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="w-full mt-2">
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-2xl ${
            isViewingDeleted ? "ring-1 ring-red-200 dark:ring-red-900/50" : ""
          }`}>
          {listLoading && !users ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : listError ? (
            renderErrorState()
          ) : !users || users.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <UserTable
                users={users}
                onUserClick={(user) => setSelectedUser(user)}
              />
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* ── User Details Modal ── */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}
