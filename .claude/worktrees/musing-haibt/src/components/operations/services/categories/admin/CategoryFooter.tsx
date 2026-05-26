"use client";

// ─── CategoryFooter ───────────────────────────────────────────────────────────
import { RefreshCw, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { PAGE_SIZE_OPTIONS, type FilterStatus } from "./category-panel.types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export interface CategoryFooterProps {
  stats: CategoryStats;
  filterStatus: FilterStatus;
  totalItems: number;
  pageStart: number;
  pageEnd: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  safePage: number;
  totalPages: number;
  pageNumbers: (number | "...")[];
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

// ─── CategoryFooter ────────────────────────────────────────────────────────────

export function CategoryFooter({
  stats,
  filterStatus,
  totalItems,
  pageStart,
  pageEnd,
  pageSize,
  onPageSizeChange,
  safePage,
  totalPages,
  pageNumbers,
  onPageChange,
  isLoading,
  onRefresh,
}: CategoryFooterProps) {
  const statItems = [
    { label: "Total", value: stats.total, className: "" },
    {
      label: "Active",
      value: stats.active,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      className: "text-yellow-600 dark:text-yellow-400",
    },
    ...(filterStatus === "deleted"
      ? [
          {
            label: "Deleted",
            value: stats.deleted,
            className: "text-red-600 dark:text-red-400",
          },
        ]
      : []),
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3">
      {/* Stats */}
      <div className="flex gap-5">
        {statItems.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-lg font-bold leading-none",
                s.className,
              )}>
              {s.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v));
              onPageChange(1);
            }}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Range indicator */}
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {totalItems === 0 ? "0" : `${pageStart}–${pageEnd}`} of {totalItems}
        </span>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}>
            <ChevronDown className="size-3.5 rotate-90" />
          </Button>

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === safePage ? "secondary" : "ghost"}
                size="icon"
                className="size-7 text-xs"
                onClick={() => onPageChange(p as number)}>
                {p}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}>
            <ChevronDown className="size-3.5 -rotate-90" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-1.5">
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
