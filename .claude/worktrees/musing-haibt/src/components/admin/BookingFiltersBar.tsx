"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal, Download } from "lucide-react";
import type {
  BookingListParams,
  BookingStatus,
  PaymentStatus,
} from "@/types/booking/booking.types";
import {
  ALL_BOOKING_STATUSES,
  ALL_PAYMENT_STATUSES,
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "./constants";
import { exportBookingsToCsv, type BookingRowData } from "./helpers";

// `search` is UI-only — not in BookingListParams.
export interface BookingFilters
  extends Pick<
    BookingListParams,
    "status" | "paymentStatus" | "limit" | "skip" | "includeDeleted"
  > {
  search?: string;
  sortBy?: "createdAt" | "scheduledDate" | "updatedAt";
  sortOrder?: "asc" | "desc";
  overdueOnly?: boolean;
}

interface BookingFiltersBarProps {
  filters: BookingFilters;
  onChange: (f: BookingFilters) => void;
  /** Pass current visible bookings to enable CSV export */
  exportData?: BookingRowData[];
}

export function BookingFiltersBar({
  filters,
  onChange,
  exportData,
}: BookingFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActive = !!(
    filters.status ||
    filters.paymentStatus ||
    filters.search ||
    filters.includeDeleted ||
    filters.overdueOnly ||
    filters.sortBy
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: localSearch || undefined, skip: 0 });
  };

  const handleClear = () => {
    setLocalSearch("");
    onChange({ limit: filters.limit ?? 20, skip: 0 });
    setShowAdvanced(false);
  };

  const handleExport = () => {
    if (!exportData?.length) return;
    const datestamp = new Date().toISOString().slice(0, 10);
    exportBookingsToCsv(exportData, `bookings-${datestamp}.csv`);
  };

  return (
    <div className="border-b bg-muted/30">
      {/* ── Primary Row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center p-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search booking #, client, provider, service…"
            className="flex-1 h-8 text-sm"
          />
          <Button type="submit" size="icon" variant="outline" className="h-8 w-8">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              status: v === "all" ? undefined : (v as BookingStatus),
              skip: 0,
            })
          }
        >
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_BOOKING_STATUSES.map((v) => (
              <SelectItem key={v} value={v}>
                {BOOKING_STATUS_CONFIG[v].icon} {BOOKING_STATUS_CONFIG[v].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment */}
        <Select
          value={filters.paymentStatus ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              paymentStatus: v === "all" ? undefined : (v as PaymentStatus),
              skip: 0,
            })
          }
        >
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {ALL_PAYMENT_STATUSES.map((v) => (
              <SelectItem key={v} value={v}>
                {PAYMENT_STATUS_CONFIG[v].icon} {PAYMENT_STATUS_CONFIG[v].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Page size */}
        <Select
          value={String(filters.limit ?? 20)}
          onValueChange={(v) =>
            onChange({ ...filters, limit: Number(v), skip: 0 })
          }
        >
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced toggle */}
        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          className="h-8"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {hasActive && (
            <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block" />
          )}
        </Button>

        {/* Export */}
        {exportData && exportData.length > 0 && (
          <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        )}

        {/* Clear */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Advanced Row ─────────────────────────────────────────────────────── */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-2 items-center px-3 pb-3 border-t pt-3 bg-muted/20">
          {/* Include deleted */}
          <Select
            value={filters.includeDeleted ? "true" : "false"}
            onValueChange={(v) =>
              onChange({ ...filters, includeDeleted: v === "true", skip: 0 })
            }
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Active Only</SelectItem>
              <SelectItem value="true">Include Deleted</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort by */}
          <Select
            value={filters.sortBy ?? "createdAt"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                sortBy: v as BookingFilters["sortBy"],
                skip: 0,
              })
            }
          >
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="Sort by…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Sort: Created At</SelectItem>
              <SelectItem value="scheduledDate">Sort: Scheduled Date</SelectItem>
              <SelectItem value="updatedAt">Sort: Last Updated</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort order */}
          <Select
            value={filters.sortOrder ?? "desc"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                sortOrder: v as "asc" | "desc",
                skip: 0,
              })
            }
          >
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Overdue only */}
          <Button
            variant={filters.overdueOnly ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-sm"
            onClick={() =>
              onChange({ ...filters, overdueOnly: !filters.overdueOnly, skip: 0 })
            }
          >
            ⚠️ Overdue Only
          </Button>
        </div>
      )}
    </div>
  );
}
