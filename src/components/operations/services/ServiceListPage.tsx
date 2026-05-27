"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  AlertCircle,
  Layers,
  Tag,
  ArrowUpRight,
  Home,
  RefreshCw,
  BadgeCheck,
  Shield,
  Star,
  Package,
  Share2,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ServiceWithVirtuals } from "@/types/services/service.types";
import { useActiveCategories } from "@/hooks/services/categories/useServiceCategory";
import { useActiveServices } from "@/hooks/services/useServices";
import { useClientPreference } from "@/hooks/profiles/useClientPreference";

// =============================================================================
// Types
// =============================================================================

type SortOption = "recent" | "title" | "price-low" | "price-high";

interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  selectedTags: string[];
  priceRange: { min: string; max: string };
  sortBy: SortOption;
}

// =============================================================================
// Constants
// =============================================================================

const ITEMS_PER_PAGE = 12;

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  selectedCategory: "",
  selectedTags: [],
  priceRange: { min: "", max: "" },
  sortBy: "recent",
};

// =============================================================================
// Helpers
// =============================================================================

function resolveCategoryName(
  categoryId: ServiceWithVirtuals["categoryId"],
): string | null {
  if (!categoryId || typeof categoryId === "string") return null;
  return (categoryId as unknown as { catName?: string }).catName ?? null;
}

function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.selectedCategory) n++;
  n += f.selectedTags.length;
  if (f.priceRange.min || f.priceRange.max) n++;
  if (f.sortBy !== "recent") n++;
  return n;
}

function resolveBasePrice(service: ServiceWithVirtuals): number {
  return (
    (
      service.servicePricing as
        | (typeof service.servicePricing & { serviceBasePrice?: number })
        | undefined
    )?.serviceBasePrice ??
    service.servicePricing?.basePrice ??
    0
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden animate-pulse">
      <div className="h-36 bg-stone-100 dark:bg-stone-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded-full" />
        <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="h-3 w-2/3 bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-stone-100 dark:bg-stone-800 rounded-full" />
          <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
        </div>
        <div className="h-8 w-full bg-stone-100 dark:bg-stone-800 rounded-xl mt-2" />
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
// FilterChip — declared at module level (not inside a render function)
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

// =============================================================================
// EmptyState — declared at module level
// =============================================================================

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
        <Search size={22} className="text-stone-300 dark:text-stone-600" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
          {hasFilters ? "No services match your filters" : "No services yet"}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 max-w-52">
          {hasFilters
            ? "Try adjusting your search or removing some filters."
            : "Services will appear here once they're published."}
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
// Service Card
// =============================================================================

interface PremiumServiceCardProps {
  service: ServiceWithVirtuals;
  onView: (id: string) => void;
  onShare: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}

function PremiumServiceCard({
  service,
  onView,
  onShare,
  onToggleFavorite,
  isFavorite,
}: PremiumServiceCardProps) {
  const sid = service._id.toString();
  const catName = resolveCategoryName(service.categoryId);
  const basePrice = resolveBasePrice(service);
  const currency = service.servicePricing?.currency ?? "USD";
  const pricingModel = service.servicePricing?.pricingModel;
  const hasTiers = service.hasTiers;

  const formattedPrice =
    pricingModel === "free"
      ? "Free"
      : pricingModel === "negotiable"
        ? "Negotiable"
        : basePrice > 0
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(basePrice)
          : null;

  const priceSuffix =
    pricingModel === "hourly"
      ? "/hr"
      : pricingModel === "per_unit"
        ? "/unit"
        : "";

  const coverUrl =
    typeof service.coverImage === "object" && service.coverImage
      ? ((service.coverImage as unknown as { url?: string }).url ?? "")
      : "";

  return (
    <div
      onClick={() => onView(sid)}
      className="group relative flex flex-col rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600/60 hover:shadow-lg hover:shadow-stone-100/80 dark:hover:shadow-stone-950/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Top accent for approved/active */}
      {service.isApproved && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-300" />
      )}

      {/* Cover image */}
      <div className="relative h-36 bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 overflow-hidden shrink-0">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={32} className="text-amber-200 dark:text-stone-600" />
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              void onShare(sid);
            }}
            className="w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-sm bg-white/90 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-300 hover:text-amber-500"
            aria-label="Share service">
            <Share2 size={11} />
          </button>

          {/* Favourite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(sid);
            }}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-sm ${
              isFavorite
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-white/90 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-300 hover:text-amber-500"
            }`}
            aria-label="Toggle favourite">
            <Star size={12} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Category chip */}
        {catName && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 rounded-full px-2 py-0.5 backdrop-blur-sm">
              <Layers size={8} />
              {catName}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div>
          <p className="text-sm font-bold text-stone-900 dark:text-stone-50 line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {service.title}
          </p>
          {service.description && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
            {service.tags.length > 3 && (
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                +{service.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        {(service.isApproved || hasTiers) && (
          <div className="flex flex-wrap gap-1.5">
            {service.isApproved && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-full px-2 py-0.5">
                <Shield size={8} /> Verified
              </span>
            )}
            {hasTiers && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/50 rounded-full px-2 py-0.5">
                <BadgeCheck size={8} /> Packages
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
          {formattedPrice ? (
            <div>
              <p className="text-base font-extrabold text-stone-900 dark:text-stone-50 leading-none">
                {formattedPrice}
                {priceSuffix && (
                  <span className="text-xs font-medium text-stone-400 ml-0.5">
                    {priceSuffix}
                  </span>
                )}
              </p>
              {pricingModel === "negotiable" && (
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                  Make an offer
                </p>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            <span>View</span>
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
// Section Divider
// =============================================================================

function SectionDivider({
  icon,
  title,
  count,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
            {title}
          </p>
          {count != null && (
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {subtitle}
          </p>
        )}
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
  categories,
  allTags,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  categories: { id: string; label: string }[];
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
            Narrow down services by category, tags, price, and sort order.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Category */}
          {categories.length > 0 && (
            <div>
              <FilterLabel>Category</FilterLabel>
              <select
                value={filters.selectedCategory}
                onChange={(e) => onChange({ selectedCategory: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400">
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price range */}
          <div>
            <FilterLabel>Price range</FilterLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange.min}
                onChange={(e) =>
                  onChange({
                    priceRange: { ...filters.priceRange, min: e.target.value },
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
              />
              <span className="text-stone-300 dark:text-stone-600 shrink-0">
                –
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange.max}
                onChange={(e) =>
                  onChange({
                    priceRange: { ...filters.priceRange, max: e.target.value },
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <FilterLabel>Tags</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {allTags.slice(0, 20).map((tag) => {
                  const active = filters.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onChange({
                          selectedTags: active
                            ? filters.selectedTags.filter((t) => t !== tag)
                            : [...filters.selectedTags, tag],
                        });
                      }}
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
              {(
                [
                  { value: "recent", label: "Most recent" },
                  { value: "title", label: "Name A–Z" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "price-high", label: "Price: High to Low" },
                ] as { value: SortOption; label: string }[]
              ).map((opt) => (
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
    "px-4 sm:px-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm";

  return (
    <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-10 flex-wrap">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`${btnBase} ${btnNav}`}>
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden px-1">‹</span>
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
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden px-1">›</span>
      </button>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function ServicesListPage(): React.ReactElement {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState<number>(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const { preference, addFavoriteService, removeFavoriteService } =
    useClientPreference();

  const favoriteIds = useMemo<string[]>(
    () =>
      (preference?.favoriteServices ?? []).map((entry) =>
        typeof entry === "string" ? entry : (entry._id?.toString() ?? ""),
      ),
    [preference?.favoriteServices],
  );

  // Refs
  const mainRef = useRef<HTMLElement>(null);
  const heroSearchRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: categoriesData } = useActiveCategories();
  const categories = useMemo(
    () =>
      (categoriesData ?? []).map((c) => ({
        id: c._id.toString(),
        label: c.catName,
      })),
    [categoriesData],
  );

  const {
    data: servicesPage,
    isLoading,
    error,
    refetch,
  } = useActiveServices({ limit: 1000 });

  const services = useMemo<ServiceWithVirtuals[]>(
    () => servicesPage?.items ?? [],
    [servicesPage],
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allTags = useMemo<string[]>(() => {
    const tagSet = new Set<string>();
    services.forEach((s) => s.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [services]);

  const filteredAndSortedServices = useMemo<ServiceWithVirtuals[]>(() => {
    if (!services.length) return [];
    let result = [...services];

    if (filters.selectedCategory) {
      result = result.filter((s) => {
        const catId =
          typeof s.categoryId === "string"
            ? s.categoryId
            : ((s.categoryId as unknown as { _id?: string })._id ?? "");
        return catId === filters.selectedCategory;
      });
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (filters.selectedTags.length > 0) {
      result = result.filter((s) =>
        filters.selectedTags.every((tag) => s.tags?.includes(tag)),
      );
    }

    if (filters.priceRange.min || filters.priceRange.max) {
      const min = filters.priceRange.min
        ? parseFloat(filters.priceRange.min)
        : 0;
      const max = filters.priceRange.max
        ? parseFloat(filters.priceRange.max)
        : Infinity;
      result = result.filter((s) => {
        const price = resolveBasePrice(s);
        return price >= min && price <= max;
      });
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "price-low":
          return resolveBasePrice(a) - resolveBasePrice(b);
        case "price-high":
          return resolveBasePrice(b) - resolveBasePrice(a);
        default:
          return 0;
      }
    });

    return result;
  }, [services, filters]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedServices.length / ITEMS_PER_PAGE),
  );

  const paginatedServices = useMemo<ServiceWithVirtuals[]>(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedServices, page]);

  const filterCount = activeFilterCount(filters);
  const hasFilters = !!filters.searchQuery || filterCount > 0;

  // ── Filter helpers ───────────────────────────────────────────────────────────
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const updateFilters = (patch: Partial<FilterState>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const clearAllFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleView = (id: string): void => {
    const service = services.find((s) => s._id.toString() === id);
    if (!service) return;
    router.push(
      service.slug ? `/services/${service.slug}` : `/services/d1/${id}`,
    );
  };

  const handleShare = async (id: string): Promise<void> => {
    const service = services.find((s) => s._id.toString() === id);
    if (!service) return;
    const url = `${window.location.origin}/services/${service.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: service.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Share cancelled or clipboard failed — fail silently
    }
  };

  const handleToggleFavorite = (id: string): void => {
    const action = favoriteIds.includes(id)
      ? removeFavoriteService(id)
      : addFavoriteService(id);
    action.then((ok) => {
      if (!ok) toast.error("Could not update saved services. Please try again.");
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main
      ref={mainRef}
      className="h-full overflow-y-auto bg-stone-50 dark:bg-stone-950">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, #92400e 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-96 h-72 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-56 bg-orange-300/10 dark:bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-8">
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
                    <Package size={12} /> Services
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Hero body */}
          <div className="py-6 md:py-10 space-y-5 sm:space-y-6">
            <div className="space-y-4 sm:space-y-5 max-w-2xl">
              {/* Heading */}
              <div>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-amber-400" />
                  Browse Services
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-50 leading-[1.15] tracking-tight">
                  Discover{" "}
                  <span className="relative inline-block">
                    <span className="text-amber-500">professional</span>
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/50 rounded-full" />
                  </span>{" "}
                  services
                  <br className="hidden sm:block" /> built for you
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 max-w-md leading-relaxed">
                  Browse verified services across every category. Filter by
                  price, tags, or category to find exactly what you need.
                </p>
              </div>

              {/* Stats */}
              {!isLoading && services.length > 0 && (
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Package size={13} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                        {services.length}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        services
                      </p>
                    </div>
                  </div>
                  {categories.length > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                          <Layers size={13} className="text-sky-500" />
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
                    </>
                  )}
                  {allTags.length > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <Tag size={13} className="text-emerald-500" />
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
                </div>
              )}

              {/* Search + filter bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
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
                    placeholder="Search by title, description, or tag…"
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
                  className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 rounded-2xl border text-sm font-semibold transition-all shadow-sm shrink-0 ${
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

              {/* Quick category pills */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateFilter("selectedCategory", "")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      !filters.selectedCategory
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 bg-white dark:bg-stone-800/80"
                    }`}>
                    All
                  </button>
                  {categories.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateFilter("selectedCategory", c.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        filters.selectedCategory === c.id
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 bg-white dark:bg-stone-800/80"
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Services Grid ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.selectedCategory && (
              <FilterChip
                label={
                  categories.find((c) => c.id === filters.selectedCategory)
                    ?.label ?? "Category"
                }
                onRemove={() => updateFilter("selectedCategory", "")}
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
            {(filters.priceRange.min || filters.priceRange.max) && (
              <FilterChip
                label={`Price: ${filters.priceRange.min || "0"} – ${filters.priceRange.max || "∞"}`}
                onRemove={() =>
                  updateFilter("priceRange", { min: "", max: "" })
                }
              />
            )}
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
            <span className="flex-1 min-w-0 truncate">
              {error.message === "Internal Server Error"
                ? "Connection error — please try again."
                : error.message}
            </span>
            <button
              onClick={() => refetch()}
              className="ml-auto flex items-center gap-1 font-semibold hover:underline shrink-0">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && <SkeletonGrid count={8} />}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {paginatedServices.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearAllFilters} />
            ) : (
              <>
                <section>
                  <SectionDivider
                    icon={<Package size={15} />}
                    title={hasFilters ? "Filtered Results" : "All Services"}
                    count={filteredAndSortedServices.length}
                    subtitle={
                      hasFilters
                        ? `Showing ${filteredAndSortedServices.length} of ${services.length} services`
                        : undefined
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {paginatedServices.map((service) => (
                      <PremiumServiceCard
                        key={service._id.toString()}
                        service={service}
                        onView={handleView}
                        onShare={handleShare}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favoriteIds.includes(
                          service._id.toString(),
                        )}
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

                <p className="text-center text-xs text-stone-400 dark:text-stone-500 pb-4 tabular-nums">
                  Showing{" "}
                  {Math.min(
                    (page - 1) * ITEMS_PER_PAGE + 1,
                    filteredAndSortedServices.length,
                  )}
                  –
                  {Math.min(
                    page * ITEMS_PER_PAGE,
                    filteredAndSortedServices.length,
                  )}{" "}
                  of {filteredAndSortedServices.length} service
                  {filteredAndSortedServices.length !== 1 ? "s" : ""}
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
        categories={categories}
        allTags={allTags}
      />
    </main>
  );
}
