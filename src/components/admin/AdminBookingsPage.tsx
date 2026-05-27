"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart2 } from "lucide-react";

import {
  useAllBookings,
  useBookingStats,
  useActiveBookings,
  usePendingValidationBookings,
  useDisputedBookings,
} from "@/hooks/booking/useBookings";
import type { BookingListResponse } from "@/types/booking/booking.types";

import { BookingStatsGrid } from "./BookingStatsGrid";
import { BookingFiltersBar, type BookingFilters } from "./BookingFiltersBar";
import { BookingTable, BookingPagination } from "./BookingTable";
import type { BookingRowData } from "./helpers";
import {
  getClientName,
  getProviderName,
  getServiceTitle,
  isOverdue,
  getUrgencyScore,
  sumRevenue,
  formatPrice,
} from "./helpers";
import { BookingDetailPanel } from "./BookingDetailPanel";

// ─── View Tabs ────────────────────────────────────────────────────────────────

type ActiveView = "all" | "active" | "disputed" | "pending_validation";

const VIEW_TABS: { key: ActiveView; label: string; urgent?: boolean }[] = [
  { key: "all", label: "All Bookings" },
  { key: "active", label: "Active" },
  { key: "disputed", label: "Disputed", urgent: true },
  { key: "pending_validation", label: "Pending Review" },
];

const EMPTY_MESSAGES: Record<ActiveView, string> = {
  all: "No bookings match the current filters.",
  active: "No active bookings at the moment.",
  disputed: "No disputed bookings. ✅",
  pending_validation: "No bookings awaiting validation.",
};

// ─── Revenue strip ────────────────────────────────────────────────────────────

function RevenueStrip({
  bookings,
  currency,
}: {
  bookings: BookingRowData[];
  currency?: string;
}) {
  const overdue = bookings.filter(isOverdue);
  const total = sumRevenue(bookings);

  if (!bookings.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-muted/20 border-b text-xs text-muted-foreground">
      <BarChart2 className="h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-semibold text-foreground">{bookings.length}</span>{" "}
        booking{bookings.length !== 1 ? "s" : ""} shown
      </span>
      <span className="text-border">·</span>
      <span>
        Est. revenue:{" "}
        <span className="font-semibold text-foreground">
          {formatPrice(total, currency ?? "GHS")}
        </span>
      </span>
      {overdue.length > 0 && (
        <>
          <span className="text-border">·</span>
          <span className="text-amber-600 font-semibold">
            ⚠ {overdue.length} overdue
          </span>
        </>
      )}
    </div>
  );
}

// ─── Extract helper ───────────────────────────────────────────────────────────

function extractList(data: BookingListResponse | null): {
  bookings: BookingRowData[];
  total: number;
} {
  return {
    bookings: (data?.bookings ?? []) as BookingRowData[],
    total: data?.total ?? 0,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const [activeView, setActiveView] = useState<ActiveView>("all");
  const [filters, setFilters] = useState<BookingFilters>({
    limit: 20,
    skip: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statsState = useBookingStats();

  // ── Queries ────────────────────────────────────────────────────────────────
  const pageParams = { limit: filters.limit ?? 20, skip: filters.skip ?? 0 };

  const allBookingsState = useAllBookings(
    {
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      includeDeleted: filters.includeDeleted,
      limit: filters.limit ?? 20,
      skip: filters.skip ?? 0,
    },
    { enabled: activeView === "all" },
  );

  const activeBookingsState = useActiveBookings(pageParams, {
    enabled: activeView === "active",
  });

  const disputedState = useDisputedBookings(pageParams, {
    enabled: activeView === "disputed",
    pollInterval: 30_000, // auto-refresh disputed every 30s
  });

  const pendingValidationState = usePendingValidationBookings(pageParams, {
    enabled: activeView === "pending_validation",
    pollInterval: 60_000,
  });

  // ── Current view ───────────────────────────────────────────────────────────
  const currentState = {
    all: allBookingsState,
    active: activeBookingsState,
    disputed: disputedState,
    pending_validation: pendingValidationState,
  }[activeView];

  const { bookings: rawBookings, total } = extractList(
    currentState.data as BookingListResponse | null,
  );

  // ── Client-side filtering & sorting ───────────────────────────────────────
  const bookings = useMemo<BookingRowData[]>(() => {
    let result = [...rawBookings];

    // Text search
    const term = filters.search?.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (b) =>
          b.bookingNumber?.toLowerCase().includes(term) ||
          getClientName(b).toLowerCase().includes(term) ||
          getProviderName(b).toLowerCase().includes(term) ||
          getServiceTitle(b).toLowerCase().includes(term),
      );
    }

    // Overdue filter
    if (filters.overdueOnly) {
      result = result.filter(isOverdue);
    }

    // Sort
    if (filters.sortBy) {
      const key = filters.sortBy;
      const asc = filters.sortOrder === "asc";
      result.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[key] as string | undefined;
        const bv = (b as unknown as Record<string, unknown>)[key] as string | undefined;
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        return asc
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      });
    }

    // Disputed / pending tabs: sort by urgency
    if (activeView === "disputed" || activeView === "pending_validation") {
      result.sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
    }

    return result;
  }, [rawBookings, filters, activeView]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRefetch = () => {
    currentState.refetch();
    statsState.refetch();
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    setFilters((f) => ({ ...f, skip: 0 }));
    setSelectedBookingId(null);
  };

  const handleSelect = (b: BookingRowData) => {
    setSelectedBookingId(String(b._id));
  };

  // ── Derive tab counts from stats ───────────────────────────────────────────
  const stats = statsState.data;
  const disputedCount = stats
    ? (stats.DISPUTED ?? 0) + (stats.REBUTTAL_SUBMITTED ?? 0)
    : null;

  return (
    <div className="h-full bg-transparent">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="border-b backdrop-blur-3xl sticky top-0 z-10">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">Booking Management</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Admin · Full control over all platform bookings
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefetch} className="shrink-0">
            <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <BookingStatsGrid
          stats={statsState.data}
          loading={statsState.loading}
        />

        {/* ── Table Card ─────────────────────────────────────────────────── */}
        <Card className="overflow-hidden bg-transparent">
          {/* View Tabs */}
          <div className="border-b overflow-x-auto">
            <div className="flex gap-0 px-2 min-w-max">
              {VIEW_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleViewChange(t.key)}
                  className={`relative px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeView === t.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {/* Badge for disputed count */}
                  {t.key === "disputed" &&
                    disputedCount != null &&
                    disputedCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {disputedCount}
                      </span>
                    )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters — only on "all" tab */}
          {activeView === "all" && (
            <BookingFiltersBar
              filters={filters}
              onChange={setFilters}
              exportData={bookings}
            />
          )}

          {/* Revenue strip */}
          <RevenueStrip bookings={bookings} />

          {/* Table */}
          <div className="overflow-auto max-h-[40vh] sm:max-h-[calc(100vh-420px)] bg-transparent">
            <BookingTable
              bookings={bookings}
              selectedId={selectedBookingId}
              loading={currentState.loading}
              error={currentState.error}
              emptyMessage={EMPTY_MESSAGES[activeView]}
              onSelect={handleSelect}
              onRetry={currentState.refetch}
            />
          </div>

          {/* Pagination */}
          {!currentState.loading && !currentState.error && total > 0 && (
            <BookingPagination
              skip={filters.skip ?? 0}
              limit={filters.limit ?? 20}
              total={total}
              onChange={(skip) => setFilters((f) => ({ ...f, skip }))}
            />
          )}
        </Card>
      </div>

      {/* ── Detail Panel ───────────────────────────────────────────────────── */}
      {selectedBookingId && (
        <BookingDetailPanel
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefetch={() => {
            handleRefetch();
            setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
}
