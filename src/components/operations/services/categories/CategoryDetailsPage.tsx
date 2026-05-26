"use client";

import React, { JSX } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Home,
  FolderOpen,
  Tag,
  Package,
  Share2,
  ArrowLeft,
  AlertCircle,
  Layers,
  CalendarDays,
  ChevronLeft,
  ArrowUpRight,
  RefreshCw,
  Folder,
  TreePine,
  BadgeCheck,
  Shield,
  Star,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

import {
  useCategoryBySlug,
  useCompleteCategory,
  useSubcategories,
  type Category,
  type CategoryWithServices,
} from "@/hooks/services/categories/useServiceCategory";
import { Service, ServiceWithVirtuals } from "@/types/services/service.types";

// =============================================================================
// API envelope normalisers
//
// The hooks store whatever the API layer returns verbatim. The server wraps
// every response in an envelope:
//
//   GET /categories/:slug
//   { success: true, data: { catName, _id, … } }
//
//   GET /categories/:id/complete
//   { success: true, data: { category: { catName, services, … },
//                            subcategoriesCount, servicesCount } }
//
// These helpers strip all known envelope shapes so the rest of the page
// always works with plain, typed objects regardless of whether the API
// layer has already unwrapped the response or not.
// =============================================================================

function unwrapSingleCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // { success, data: { category: Category } }  ← complete-endpoint shape
  if (r.success && r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (d.category && typeof d.category === "object") {
      const cat = d.category as Record<string, unknown>;
      if (cat.catName) return cat as unknown as Category;
    }
    // { success, data: Category }  ← slug/id-endpoint shape
    if (d.catName) return d as unknown as Category;
  }

  // { category: Category }  ← some endpoints wrap in a bare object
  if (r.category && typeof r.category === "object") {
    const cat = r.category as Record<string, unknown>;
    if (cat.catName) return cat as unknown as Category;
  }

  // Already unwrapped by the API layer
  if (r.catName) return raw as Category;

  return null;
}

interface UnwrappedComplete {
  category: Category | null;
  services: (Service | ServiceWithVirtuals)[];
  popularServices: (Service | ServiceWithVirtuals)[];
  subcategories: (Category | CategoryWithServices)[];
}

function unwrapCompleteCategory(raw: unknown): UnwrappedComplete {
  const empty: UnwrappedComplete = {
    category: null,
    services: [],
    popularServices: [],
    subcategories: [],
  };
  if (!raw || typeof raw !== "object") return empty;

  const r = raw as Record<string, unknown>;
  let catData: Record<string, unknown> | null = null;

  // { success, data: { category: { catName, services, subcategories, … } } }
  if (r.success && r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (d.category && typeof d.category === "object") {
      catData = d.category as Record<string, unknown>;
    } else if (d.catName) {
      catData = d;
    }
  }
  // { category: { catName, services, … } }
  else if (r.category && typeof r.category === "object") {
    catData = r.category as Record<string, unknown>;
  }
  // Already a CategoryWithServices
  else if (r.catName) {
    catData = r;
  }

  if (!catData) return empty;

  return {
    category: catData as unknown as Category,
    services: Array.isArray(catData.services)
      ? (catData.services as (Service | ServiceWithVirtuals)[])
      : [],
    popularServices: Array.isArray(catData.popularServices)
      ? (catData.popularServices as (Service | ServiceWithVirtuals)[])
      : [],
    subcategories: Array.isArray(catData.subcategories)
      ? (catData.subcategories as (Category | CategoryWithServices)[])
      : [],
  };
}

// =============================================================================
// Helpers
// =============================================================================

function safeDistance(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "—" : formatDistanceToNow(d, { addSuffix: true });
}

function resolveBasePrice(service: Service): number {
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

function formatPrice(amount: number, currency = "GHS"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// Primitives
// =============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
        {title}
      </h2>
      {count != null && (
        <span className="ml-auto text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Subcategory card
// =============================================================================

function SubcategoryCard({
  category,
  onClick,
}: {
  category: Category | CategoryWithServices;
  onClick: (cat: Category) => void;
}) {
  const cover = category.catCoverId;
  const coverUrl =
    cover && typeof cover === "object" && "url" in cover
      ? (cover as { url: string }).url
      : null;

  return (
    <div
      onClick={() => onClick(category as Category)}
      className="group flex items-center gap-3 p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 hover:border-amber-300 dark:hover:border-amber-600/50 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-700 dark:to-stone-600 flex items-center justify-center shrink-0 overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={category.catName}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <Folder size={14} className="text-amber-300 dark:text-stone-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {category.catName}
        </p>
        {category.catDesc && (
          <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
            {category.catDesc}
          </p>
        )}
      </div>
      <ArrowUpRight
        size={12}
        className="text-stone-300 dark:text-stone-600 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
      />
    </div>
  );
}

// =============================================================================
// Service card
// =============================================================================

function ServiceCard({
  service,
  onClick,
}: {
  service: Service | ServiceWithVirtuals;
  onClick: (s: Service) => void;
}) {
  const s = service as ServiceWithVirtuals;
  const basePrice = resolveBasePrice(service);
  const currency = service.servicePricing?.currency ?? "GHS";
  const pricingModel = service.servicePricing?.pricingModel;
  const coverUrl = (
    service.coverImage as unknown as { url?: string } | undefined
  )?.url;

  const formattedPrice =
    pricingModel === "free"
      ? "Free"
      : pricingModel === "negotiable"
        ? "Negotiable"
        : basePrice > 0
          ? formatPrice(basePrice, currency)
          : null;

  return (
    <div
      onClick={() => onClick(service as Service)}
      className="group flex items-start gap-3 p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-300 dark:hover:border-amber-600/50 hover:shadow-sm transition-all cursor-pointer">
      <div className="w-12 h-12 rounded-lg bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={service.title}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={14} className="text-amber-200 dark:text-stone-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {service.title}
        </p>
        {service.description && (
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
            {service.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {formattedPrice && (
            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200">
              {formattedPrice}
            </span>
          )}
          {s.isApproved && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Shield size={8} /> Verified
            </span>
          )}
          {s.hasTiers && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-sky-600 dark:text-sky-400">
              <BadgeCheck size={8} /> Packages
            </span>
          )}
        </div>
      </div>
      <ArrowUpRight
        size={12}
        className="text-stone-300 dark:text-stone-600 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
      />
    </div>
  );
}

// =============================================================================
// Error state
// =============================================================================

function ErrorState({
  message,
  onBack,
  onRetry,
  notFound = false,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
  notFound?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 mb-5">
          <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {notFound ? "Category not found" : "Something went wrong"}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 h-9 text-sm border-stone-200 dark:border-stone-700">
            <ArrowLeft size={13} /> Browse categories
          </Button>
          {!notFound && (
            <Button
              onClick={onRetry}
              className="h-9 text-sm bg-amber-500 hover:bg-amber-600 text-white">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function CategoryDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // ── Step 1: slug → base category ─────────────────────────────────────────
  const {
    data: categoryRaw,
    isFetched: baseFetched,
    error: errorBase,
    refetch: refetchBase,
  } = useCategoryBySlug(slug);

  // Normalise: strip the API envelope so we always have a plain Category
  const categoryBase = unwrapSingleCategory(categoryRaw);
  const categoryId = (categoryBase?._id as unknown as string) ?? "";

  // ── Step 2: extended data (services + subcategories) ──────────────────────
  const {
    data: completeRaw,
    isLoading: loadingComplete,
    isFetched: completeFetched,
    refetch: refetchComplete,
  } = useCompleteCategory(categoryId);

  const {
    category: completeCategory,
    services,
    popularServices,
    subcategories: completeSubs,
  } = unwrapCompleteCategory(completeRaw);

  // ── Step 3: subcategory fallback ──────────────────────────────────────────
  const { data: subcatsRaw } = useSubcategories(categoryId);
  const subcatsData: (Category | CategoryWithServices)[] = Array.isArray(
    subcatsRaw,
  )
    ? (subcatsRaw as (Category | CategoryWithServices)[])
    : [];

  // ── Loading guard ─────────────────────────────────────────────────────────
  // Remain in loading state until:
  //   (a) the slug fetch has fully settled, AND
  //   (b) the complete fetch has settled — only when we have an id to fetch
  const isLoading = !baseFetched || (!!categoryId && !completeFetched);

  const refetch = () => {
    refetchBase();
    if (categoryId) refetchComplete();
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  // categoryBase is the authoritative source for metadata (catName, slug, …).
  // Fall back to completeCategory in case the slug endpoint is missing fields.
  const category = categoryBase ?? completeCategory;

  const subcategories: (Category | CategoryWithServices)[] =
    completeSubs.length > 0 ? completeSubs : subcatsData;

  const hasServices = services.length > 0;
  const hasPopular = popularServices.length > 0;
  const hasSubcats = subcategories.length > 0;

  // Resolve cover URL from a populated object ({ url: "…" }) or null
  const coverUrl = (() => {
    const c = category?.catCoverId;
    if (!c || typeof c !== "object") return null;
    return "url" in c ? (c as { url: string }).url : null;
  })();

  const isSubcategory = Boolean(
    category?.parentCategoryId &&
    category.parentCategoryId !== null &&
    category.parentCategoryId !== "",
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: category?.catName, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleViewService = (service: Service) =>
    router.push(
      service.slug ? `/services/${service.slug}` : `/services/d/${service._id}`,
    );

  const handleViewSubcat = (cat: Category) =>
    router.push(
      cat.slug ? `/categories/${cat.slug}` : `/categories/d/${cat._id}`,
    );

  const handleBrowseServices = () => {
    if (!category) return;
    router.push(`/services?category=${category._id}`);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingOverlay message="Loading category…" show />;

  if (errorBase) {
    return (
      <ErrorState
        message={errorBase.message || "Failed to load category"}
        onBack={() => router.push("/categories")}
        onRetry={refetch}
      />
    );
  }

  if (!category || !category.catName) {
    return (
      <ErrorState
        message="This category doesn't exist or has been removed."
        onBack={() => router.push("/categories")}
        onRetry={refetch}
        notFound
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="h-full overflow-auto bg-stone-50 dark:bg-stone-950">
      {/* Sticky nav */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
        <div className="w-full px-5 md:px-8 h-13 flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
                  <Home className="w-3 h-3" />
                  <span className="hidden sm:inline">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/categories"
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
                  <FolderOpen className="w-3 h-3" />
                  <span className="hidden sm:inline">Categories</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium max-w-36 truncate text-stone-900 dark:text-stone-100">
                  {category.catName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1 h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
            <ChevronLeft size={13} />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-stone-950">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={category.catName}
            fill
            priority
            className="object-cover opacity-40"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-amber-900/30 via-stone-900 to-stone-950 flex items-center justify-center">
            <FolderOpen className="w-20 h-20 text-stone-800" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/60 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-5 md:px-8 pb-8 md:pb-12">
          <div className="flex flex-wrap gap-2 mb-3">
            {isSubcategory ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-300 bg-amber-500/15 border border-amber-400/25 rounded-full px-3 py-1">
                <TreePine size={9} /> Subcategory
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-300 bg-sky-500/15 border border-sky-400/25 rounded-full px-3 py-1">
                <FolderOpen size={9} /> Top-level
              </span>
            )}
            {category.isActive && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 rounded-full px-3 py-1">
                <Star size={9} /> Active
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight max-w-2xl">
            {category.catName}
          </h1>
          {category.catDesc && (
            <p className="text-sm text-white/60 mt-2 max-w-lg leading-relaxed line-clamp-2">
              {category.catDesc}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <CalendarDays size={11} /> Created{" "}
              {safeDistance(category.createdAt)}
            </span>
            {hasServices && (
              <span className="text-xs text-white/40 flex items-center gap-1.5">
                <Package size={11} />
                {services.length} service{services.length !== 1 ? "s" : ""}
              </span>
            )}
            {hasSubcats && (
              <span className="text-xs text-white/40 flex items-center gap-1.5">
                <Layers size={11} />
                {subcategories.length} subcategor
                {subcategories.length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Left column */}
          <div className="space-y-4 min-w-0">
            <Card>
              <CardHeader
                icon={<FolderOpen size={13} />}
                title="About this category"
              />
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                {category.catDesc || "No description provided."}
              </p>
            </Card>

            {category.tags && category.tags.length > 0 && (
              <Card>
                <CardHeader
                  icon={<Tag size={13} />}
                  title="Tags"
                  count={category.tags.length}
                />
                <div className="flex flex-wrap gap-1.5">
                  {category.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md text-xs font-medium border border-stone-100 dark:border-stone-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {hasSubcats && (
              <Card>
                <CardHeader
                  icon={<Layers size={13} />}
                  title="Subcategories"
                  count={subcategories.length}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subcategories.map((sub) => (
                    <SubcategoryCard
                      key={sub._id as unknown as string}
                      category={sub}
                      onClick={handleViewSubcat}
                    />
                  ))}
                </div>
              </Card>
            )}

            {hasPopular && (
              <Card>
                <CardHeader
                  icon={<Star size={13} />}
                  title="Popular services"
                  count={popularServices.length}
                />
                <div className="space-y-2">
                  {popularServices.slice(0, 6).map((s) => (
                    <ServiceCard
                      key={s._id as unknown as string}
                      service={s}
                      onClick={handleViewService}
                    />
                  ))}
                </div>
              </Card>
            )}

            {hasServices && (
              <Card>
                <CardHeader
                  icon={<Package size={13} />}
                  title="All services"
                  count={services.length}
                />
                <div className="space-y-2">
                  {services.slice(0, 10).map((s) => (
                    <ServiceCard
                      key={s._id as unknown as string}
                      service={s}
                      onClick={handleViewService}
                    />
                  ))}
                  {services.length > 10 && (
                    <button
                      onClick={handleBrowseServices}
                      className="w-full mt-1 py-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:border-amber-300 dark:hover:border-amber-600/50 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center justify-center gap-1.5">
                      View all {services.length} services{" "}
                      <ArrowUpRight size={11} />
                    </button>
                  )}
                </div>
              </Card>
            )}

            {/* Empty state — only after extended data has fully settled */}
            {!hasServices && completeFetched && (
              <Card>
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Package
                      size={18}
                      className="text-stone-300 dark:text-stone-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                      No services yet
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                      Services in this category will appear here once
                      they&apos;re published.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <CardHeader
                icon={<CalendarDays size={13} />}
                title="Category info"
              />
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Created
                  </dt>
                  <dd className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {safeDistance(category.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Last updated
                  </dt>
                  <dd className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {safeDistance(category.updatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Status
                  </dt>
                  <dd className="text-sm font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${category.isActive ? "bg-emerald-500" : "bg-stone-300"}`}
                    />
                    {category.isActive ? "Active" : "Inactive"}
                  </dd>
                </div>
                {category.slug && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                      Slug
                    </dt>
                    <dd className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-md border border-stone-100 dark:border-stone-700 w-fit">
                      {category.slug}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
              <div className="px-5 py-5 border-b border-stone-100 dark:border-stone-800">
                <SectionLabel>Quick actions</SectionLabel>
                <div className="space-y-2.5 mt-3">
                  <button
                    onClick={handleBrowseServices}
                    className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Package size={14} /> Browse services
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full h-9 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-xl hover:border-stone-300 dark:hover:border-stone-600 transition-all flex items-center justify-center gap-2">
                    <Share2 size={13} /> Share this category
                  </button>
                </div>
              </div>

              <div className="px-5 py-4">
                <SectionLabel>At a glance</SectionLabel>
                <div className="space-y-3">
                  {[
                    {
                      icon: <Package size={11} />,
                      label: "Services",
                      value: loadingComplete ? "…" : services.length,
                    },
                    {
                      icon: <Layers size={11} />,
                      label: "Subcategories",
                      value: loadingComplete ? "…" : subcategories.length,
                    },
                    {
                      icon: <Tag size={11} />,
                      label: "Tags",
                      value: category.tags?.length ?? 0,
                    },
                  ].map(({ icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between">
                      <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        {icon} {label}
                      </span>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-100">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {category.tags && category.tags.length > 0 && (
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-5 py-4">
                <SectionLabel>Tags</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {category.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg px-1.5 py-0.5 border border-stone-100 dark:border-stone-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasSubcats && (
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-5 py-4">
                <SectionLabel>
                  Subcategories ({subcategories.length})
                </SectionLabel>
                <div className="space-y-1.5">
                  {subcategories.slice(0, 5).map((sub) => (
                    <button
                      key={sub._id as unknown as string}
                      onClick={() => handleViewSubcat(sub as Category)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors group">
                      <Folder size={11} className="text-amber-400 shrink-0" />
                      <span className="text-xs text-stone-700 dark:text-stone-300 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {sub.catName}
                      </span>
                    </button>
                  ))}
                  {subcategories.length > 5 && (
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 px-2 pt-1">
                      +{subcategories.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={refetch}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors py-1">
              <RefreshCw size={11} /> Refresh data
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
