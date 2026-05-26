"use client";

import React, { useState, useMemo, useEffect, useRef, JSX } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  SlidersHorizontal,
  AlertCircle,
  Tag,
  ArrowUpRight,
  ChevronRight,
  Home,
  RefreshCw,
  Package,
  FolderOpen,
  Folder,
  TreePine,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useActiveCategories,
  useTopLevelCategories,
  useAllTags,
  type Category,
} from "@/hooks/services/categories/useServiceCategory";

// =============================================================================
// Types
// =============================================================================

type SortOption = "recent" | "name-az" | "name-za";

interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  onlyTopLevel: boolean;
  sortBy: SortOption;
}

// =============================================================================
// Constants
// =============================================================================

const ITEMS_PER_PAGE = 12;

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  selectedTags: [],
  onlyTopLevel: false,
  sortBy: "recent",
};

// =============================================================================
// Helpers
// =============================================================================

function activeFilterCount(f: FilterState): number {
  let n = 0;
  n += f.selectedTags.length;
  if (f.onlyTopLevel) n++;
  if (f.sortBy !== "recent") n++;
  return n;
}

// =============================================================================
// Skeleton
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden animate-pulse">
      <div className="h-32 bg-stone-100 dark:bg-stone-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-stone-200 dark:bg-stone-700 rounded-full" />
        <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="h-3 w-4/5 bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 bg-stone-100 dark:bg-stone-800 rounded-full" />
          <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Category Card
// =============================================================================

function CategoryCard({
  category,
  onView,
}: {
  category: Category;
  onView: (cat: Category) => void;
}) {
  const isSubcategory = Boolean(category.parentCategoryId);
  const hasCover = Boolean(category.catCoverId?.url);

  return (
    <div
      onClick={() => onView(category)}
      className="group relative flex flex-col rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600/60 hover:shadow-lg hover:shadow-stone-100/80 dark:hover:shadow-stone-950/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Top accent on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Cover */}
      <div className="relative h-32 bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 overflow-hidden shrink-0">
        {hasCover ? (
          <Image
            src={category.catCoverId!.url}
            alt={category.catName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isSubcategory ? (
              <Folder
                size={28}
                className="text-amber-200 dark:text-stone-600"
              />
            ) : (
              <FolderOpen
                size={28}
                className="text-amber-200 dark:text-stone-600"
              />
            )}
          </div>
        )}

        {isSubcategory && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/90 dark:bg-stone-900/90 text-stone-500 dark:text-stone-400 border border-stone-200/80 dark:border-stone-700/80 rounded-full px-2 py-0.5 backdrop-blur-sm">
              <TreePine size={8} />
              Sub
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div>
          <p className="text-sm font-bold text-stone-900 dark:text-stone-50 line-clamp-1 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {category.catName}
          </p>
          {category.catDesc && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {category.catDesc}
            </p>
          )}
        </div>

        {category.tags && category.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {category.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
            {category.tags.length > 3 && (
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                +{category.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-stone-50 dark:border-stone-800 flex items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            <span>Explore</span>
            <ArrowUpRight
              size={12}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Filter Sheet
// =============================================================================

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2.5">
      {children}
    </p>
  );
}

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  allTags,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  allTags: string[];
}) {
  const count = activeFilterCount(filters);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-xs p-0 flex flex-col bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
        <SheetHeader className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-stone-900 dark:text-stone-50">
              Filters
            </SheetTitle>
            {count > 0 && (
              <button
                onClick={onReset}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Reset all ({count})
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-stone-400 dark:text-stone-500">
            Narrow down categories by tags, level, and sort order.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Category level */}
          <div>
            <FilterLabel>Category level</FilterLabel>
            <div className="flex flex-col gap-1.5">
              {[
                { value: false, label: "All categories" },
                { value: true, label: "Top-level only" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => onChange({ onlyTopLevel: opt.value })}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                    filters.onlyTopLevel === opt.value
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                  }`}>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                      filters.onlyTopLevel === opt.value
                        ? "border-amber-500 bg-amber-500"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <FilterLabel>Tags</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {allTags.slice(0, 24).map((tag) => {
                  const active = filters.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        onChange({
                          selectedTags: active
                            ? filters.selectedTags.filter((t) => t !== tag)
                            : [...filters.selectedTags, tag],
                        })
                      }
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                        active
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300"
                      }`}>
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <FilterLabel>Sort by</FilterLabel>
            <div className="flex flex-col gap-1.5">
              {[
                { value: "recent" as const, label: "Most recent" },
                { value: "name-az" as const, label: "Name A–Z" },
                { value: "name-za" as const, label: "Name Z–A" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ sortBy: opt.value })}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                    filters.sortBy === opt.value
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                  }`}>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                      filters.sortBy === opt.value
                        ? "border-amber-500 bg-amber-500"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-bold hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all">
            Apply Filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// Pagination
// =============================================================================

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (page <= 3) return i + 1;
      if (page >= totalPages - 2) return totalPages - 4 + i;
      return page - 2 + i;
    },
  );

  const btnBase =
    "h-10 rounded-xl font-medium transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
  const btnInactive =
    "w-10 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700";
  const btnActive = "w-10 bg-amber-500 text-white shadow-md";
  const btnNav =
    "px-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm";

  return (
    <div className="flex justify-center items-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`${btnBase} ${btnNav}`}>
        Previous
      </button>
      {pageNumbers.map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={`${btnBase} ${page === n ? btnActive : btnInactive}`}>
          {n}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={`${btnBase} ${btnNav}`}>
        Next
      </button>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
        aria-label={`Remove ${label} filter`}>
        <X size={12} />
      </button>
    </span>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <FolderOpen size={22} className="text-stone-300 dark:text-stone-600" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
          {hasFilters
            ? "No categories match your filters"
            : "No categories yet"}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 max-w-52">
          {hasFilters
            ? "Try adjusting your search or removing some filters."
            : "Categories will appear here once they're created."}
        </p>
      </div>
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <X size={11} /> Clear filters
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function CategoryListPage(): JSX.Element {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState<number>(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroSearchRef = useRef<HTMLInputElement>(null);
  const stickySearchRef = useRef<HTMLInputElement>(null);

  // ── Scroll detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: allCategoriesData,
    isLoading,
    error,
    refetch,
  } = useActiveCategories();
  const { data: topLevelData } = useTopLevelCategories();
  const { data: tagsData } = useAllTags();

  const categories = useMemo<Category[]>(
    () => allCategoriesData ?? [],
    [allCategoriesData],
  );
  const allTags = useMemo<string[]>(() => tagsData ?? [], [tagsData]);

  // ── Filtering + sorting ────────────────────────────────────────────────────
  const filteredCategories = useMemo<Category[]>(() => {
    let result = [...categories];

    if (filters.onlyTopLevel) {
      const topIds = new Set((topLevelData ?? []).map((c) => c._id));
      result = result.filter((c) => topIds.has(c._id) || !c.parentCategoryId);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.catName.toLowerCase().includes(q) ||
          c.catDesc?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (filters.selectedTags.length > 0) {
      result = result.filter((c) =>
        filters.selectedTags.every((tag) => c.tags?.includes(tag)),
      );
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "name-az":
          return a.catName.localeCompare(b.catName);
        case "name-za":
          return b.catName.localeCompare(a.catName);
        default:
          return 0;
      }
    });

    return result;
  }, [categories, filters, topLevelData]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo<Category[]>(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, page]);

  const filterCount = activeFilterCount(filters);
  const hasFilters = !!filters.searchQuery || filterCount > 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleView = (cat: Category) => {
    router.push(
      cat.slug ? `/categories/${cat.slug}` : `/categories/d/${cat._id}`,
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="h-full overflow-y-auto bg-stone-50 dark:bg-stone-950">
      {/* ── Compact Sticky Bar ─────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}>
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-b border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                ref={stickySearchRef}
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                placeholder="Search categories…"
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => updateFilter("searchQuery", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setFilterSheetOpen(true)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                filterCount > 0
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
              }`}>
              <SlidersHorizontal size={13} />
              Filters
              {filterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
            <span className="hidden md:inline text-xs text-stone-400 dark:text-stone-500 shrink-0">
              {isLoading
                ? "…"
                : `${filteredCategories.length} categor${filteredCategories.length !== 1 ? "ies" : "y"}`}
            </span>
            <Link
              href="/services"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm">
              Services <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, #92400e 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-150 h-100 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-100 h-75 bg-orange-300/10 dark:bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between py-4 border-b border-stone-100/70 dark:border-stone-800/70">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/"
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors">
                    <Home size={12} /> Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                    <FolderOpen size={12} /> Categories
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Hero body */}
          <div className="py-8 md:py-10 space-y-6">
            <div className="space-y-5 max-w-2xl">
              <div>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-amber-400" />
                  Browse Categories
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-50 leading-[1.15] tracking-tight">
                  Explore service{" "}
                  <span className="relative inline-block">
                    <span className="text-amber-500">categories</span>
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/50 rounded-full" />
                  </span>
                  <br />
                  by topic
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 max-w-md leading-relaxed">
                  Browse all service categories organised by topic. Select one
                  to discover available services within it.
                </p>
              </div>

              {/* Stats */}
              {!isLoading && categories.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <FolderOpen size={13} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                        {categories.length}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        categories
                      </p>
                    </div>
                  </div>
                  {allTags.length > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                          <Tag size={13} className="text-sky-500" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                            {allTags.length}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            tags
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {topLevelData && topLevelData.length > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <TreePine size={13} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                            {topLevelData.length}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            top-level
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Search + filter bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    ref={heroSearchRef}
                    value={filters.searchQuery}
                    onChange={(e) =>
                      updateFilter("searchQuery", e.target.value)
                    }
                    placeholder="Search by name, description, or tag…"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 shadow-sm transition-all"
                  />
                  {filters.searchQuery && (
                    <button
                      onClick={() => updateFilter("searchQuery", "")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setFilterSheetOpen(true)}
                  className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all shadow-sm ${
                    filterCount > 0
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:border-stone-300"
                  }`}>
                  <SlidersHorizontal size={15} />
                  <span className="hidden sm:inline">Filters</span>
                  {filterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick tag pills */}
              {/* {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter("selectedTags", [])}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      filters.selectedTags.length === 0
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 bg-white dark:bg-stone-800/80"
                    }`}>
                    All
                  </button>
                  {allTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const active = filters.selectedTags.includes(tag);
                        updateFilter(
                          "selectedTags",
                          active
                            ? filters.selectedTags.filter((t) => t !== tag)
                            : [...filters.selectedTags, tag],
                        );
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        filters.selectedTags.includes(tag)
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 bg-white dark:bg-stone-800/80"
                      }`}>
                      #{tag}
                    </button>
                  ))}
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.onlyTopLevel && (
              <FilterChip
                label="Top-level only"
                onRemove={() => updateFilter("onlyTopLevel", false)}
              />
            )}
            {filters.selectedTags.map((tag) => (
              <FilterChip
                key={tag}
                label={`#${tag}`}
                onRemove={() =>
                  updateFilter(
                    "selectedTags",
                    filters.selectedTags.filter((t) => t !== tag),
                  )
                }
              />
            ))}
            {filters.sortBy !== "recent" && (
              <FilterChip
                label={`Sort: ${filters.sortBy}`}
                onRemove={() => updateFilter("sortBy", "recent")}
              />
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            {error.message}
            <button
              onClick={() => refetch()}
              className="ml-auto flex items-center gap-1 font-semibold hover:underline">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && <SkeletonGrid count={8} />}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {paginatedCategories.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearAllFilters} />
            ) : (
              <>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Package size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                          {hasFilters ? "Filtered Results" : "All Categories"}
                        </p>
                        <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
                          {filteredCategories.length}
                        </span>
                      </div>
                      {hasFilters && (
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          Showing {filteredCategories.length} of{" "}
                          {categories.length} categories
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedCategories.map((cat) => (
                      <CategoryCard
                        key={cat._id.toString()}
                        category={cat}
                        onView={handleView}
                      />
                    ))}
                  </div>
                </section>

                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}

                <p className="text-center text-xs text-stone-400 dark:text-stone-500 pb-4">
                  Showing{" "}
                  {Math.min(
                    (page - 1) * ITEMS_PER_PAGE + 1,
                    filteredCategories.length,
                  )}
                  –{Math.min(page * ITEMS_PER_PAGE, filteredCategories.length)}{" "}
                  of {filteredCategories.length} categories
                </p>
              </>
            )}
          </>
        )}
      </div>

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onChange={updateFilters}
        onReset={clearAllFilters}
        allTags={allTags}
      />
    </main>
  );
}
