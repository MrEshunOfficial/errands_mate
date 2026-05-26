"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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
import { getClientName, getProviderName, getServiceTitle } from "./helpers";
import { BookingDetailPanel } from "./BookingDetailPanel";

// ─── View Tabs ────────────────────────────────────────────────────────────────

type ActiveView = "all" | "active" | "disputed" | "pending_validation";

const VIEW_TABS: { key: ActiveView; label: string }[] = [
  { key: "all", label: "All Bookings" },
  { key: "active", label: "Active" },
  { key: "disputed", label: "Disputed" },
  { key: "pending_validation", label: "Pending Review" },
];

const EMPTY_MESSAGES: Record<ActiveView, string> = {
  all: "No bookings match the current filters.",
  active: "No active bookings at the moment.",
  disputed: "No disputed bookings.",
  pending_validation: "No bookings awaiting validation.",
};

// ─── Helper: extract BookingListResponse safely ───────────────────────────────

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
  });
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statsState = useBookingStats();

  // ── Parameterised queries ──────────────────────────────────────────────────
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
  });

  const pendingValidationState = usePendingValidationBookings(pageParams, {
    enabled: activeView === "pending_validation",
  });

  // ── Current view state ─────────────────────────────────────────────────────
  const currentState = {
    all: allBookingsState,
    active: activeBookingsState,
    disputed: disputedState,
    pending_validation: pendingValidationState,
  }[activeView];

  const { bookings: rawBookings, total } = extractList(
    currentState.data as BookingListResponse | null,
  );

  // ── Client-side search filter (search is not in BookingListParams) ─────────
  const bookings = useMemo<BookingRowData[]>(() => {
    const term = filters.search?.toLowerCase().trim();
    if (!term) return rawBookings;
    return rawBookings.filter(
      (b) =>
        b.bookingNumber?.toLowerCase().includes(term) ||
        getClientName(b).toLowerCase().includes(term) ||
        getProviderName(b).toLowerCase().includes(term) ||
        getServiceTitle(b).toLowerCase().includes(term),
    );
  }, [rawBookings, filters.search]);

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

  return (
    <div className="h-full bg-transparent">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="border-b backdrop-blur-3xl sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold">Booking Management</h1>
            <p className="text-xs text-muted-foreground">
              Admin · Full control over all platform bookings
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <BookingStatsGrid
          stats={statsState.data}
          loading={statsState.loading}
        />

        {/* ── Table Card ─────────────────────────────────────────────────── */}
        <Card className="overflow-hidden bg-transparent">
          {/* View Tabs */}
          <div className="border-b px-4">
            <div className="flex gap-1">
              {VIEW_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleViewChange(t.key)}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeView === t.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters — only shown on the "all" tab */}
          {activeView === "all" && (
            <BookingFiltersBar filters={filters} onChange={setFilters} />
          )}

          {/* Table */}
          <div className="overflow-auto max-h-[calc(100vh-420px)] bg-transparent">
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
