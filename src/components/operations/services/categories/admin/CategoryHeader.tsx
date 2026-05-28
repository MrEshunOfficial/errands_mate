"use client";

// ─── CategoryHeader ───────────────────────────────────────────────────────────
import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import type {
  BulkAction,
  BulkOption,
  FilterStatus,
} from "./category-panel.types";

// ─── BulkActionBar ────────────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  options,
  onAction,
  onClear,
}: {
  selectedCount: number;
  options: BulkOption[];
  onAction: (a: BulkAction) => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
      <span className="text-xs font-semibold text-primary">
        {selectedCount} selected
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options
          .filter((o) => o.show)
          .map(({ action, label, destructive }) => (
            <Button
              key={action}
              size="sm"
              variant={destructive ? "destructive" : "outline"}
              className="h-7 text-xs"
              onClick={() => onAction(action)}>
              {label}
            </Button>
          ))}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={onClear}>
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── CategoryHeader ────────────────────────────────────────────────────────────

export interface CategoryHeaderProps {
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageReset: () => void;
  selectedIds: string[];
  bulkOptions: BulkOption[];
  onBulkAction: (action: BulkAction) => void;
  onClearSelection: () => void;
  onNewCategory: () => void;
}

export function CategoryHeader({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onPageReset,
  selectedIds,
  bulkOptions,
  onBulkAction,
  onClearSelection,
  onNewCategory,
}: CategoryHeaderProps) {
  const handleFilterChange = (status: FilterStatus) => {
    onFilterChange(status);
    onPageReset();
  };

  const handleSearchChange = (q: string) => {
    onSearchChange(q);
    onPageReset();
  };

  return (
    <div className="rounded-xl border p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          <Badge variant="outline" className="p-2 text-xs shrink-0">
            Filter By:
          </Badge>
          {(["active", "inactive", "deleted"] as FilterStatus[]).map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(s)}
              className="h-8 px-3 text-xs">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        <Button size="sm" className="shrink-0 gap-1.5" onClick={onNewCategory}>
          <Plus className="size-3.5" />
          <span className="hidden xs:inline">New Category</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        options={bulkOptions}
        onAction={onBulkAction}
        onClear={onClearSelection}
      />
    </div>
  );
}
