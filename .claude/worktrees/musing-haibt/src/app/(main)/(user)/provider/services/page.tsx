// app/provider/[providerId]/services/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  AlertCircle,
  Package,
  Pencil,
  Trash2,
  Share2,
  Star,
  Shield,
  BadgeCheck,
  Clock,
  Layers,
  ArrowUpRight,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";

import {
  useServicesByProvider,
  useDeleteService,
} from "@/hooks/services/useServices";
import { ServiceWithVirtuals } from "@/types/services/service.types";
import Image from "next/image";

// =============================================================================
// Helpers
// =============================================================================

function formatPriceForShare(service: ServiceWithVirtuals): string {
  const pricing = service.servicePricing as
    | (typeof service.servicePricing & { serviceBasePrice?: number })
    | undefined;
  if (!pricing) return "";
  const price =
    pricing.basePrice ??
    pricing.serviceBasePrice ??
    pricing.tiers?.[0]?.basePrice;
  if (price === undefined) return "";
  return `\nStarting at: ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricing.currency ?? "USD",
  }).format(price)}`;
}

function getCategoryName(service: ServiceWithVirtuals): string {
  const cat = service.categoryId;
  if (!cat || typeof cat === "string") return "General";
  return (cat as unknown as { catName?: string }).catName ?? "General";
}

function resolveBasePrice(service: ServiceWithVirtuals): number {
  const pricing = service.servicePricing as
    | (typeof service.servicePricing & { serviceBasePrice?: number })
    | undefined;
  return pricing?.serviceBasePrice ?? pricing?.basePrice ?? 0;
}

async function copyToClipboard(
  service: ServiceWithVirtuals,
  url: string,
  priceText: string,
  tagsText: string,
): Promise<void> {
  const text = `${service.title}\n\n${service.description}\n\nCategory: ${getCategoryName(service)}${priceText}${tagsText}\n\n${url}`;
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    prompt("Copy this text:", text);
  }
}

// =============================================================================
// Skeleton
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden animate-pulse">
      <div className="h-32 bg-stone-100 dark:bg-stone-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded-full" />
        <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="h-3 w-2/3 bg-stone-100 dark:bg-stone-800 rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-stone-100 dark:bg-stone-800 rounded-full" />
          <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded-full" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          <div className="h-8 w-8 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          <div className="h-8 w-8 bg-stone-100 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Service Card (provider/management variant)
// =============================================================================

function ProviderServiceCard({
  service,
  isFavorite,
  onView,
  onEdit,
  onDelete,
  onShare,
  onToggleFavorite,
}: {
  service: ServiceWithVirtuals;
  isFavorite: boolean;
  onView: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => void;
}) {
  const catName = getCategoryName(service);
  const basePrice = resolveBasePrice(service);
  const currency = service.servicePricing?.currency ?? "USD";
  const pricingModel = service.servicePricing?.pricingModel;

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

  const statusBadge = service.isApproved
    ? {
        label: "Active",
        color:
          "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
      }
    : service.isRejected
      ? {
          label: "Rejected",
          color:
            "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50",
        }
      : service.isPending
        ? {
            label: "Pending",
            color:
              "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
          }
        : service.isPrivate
          ? {
              label: "Private",
              color:
                "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
            }
          : null;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600/60 hover:shadow-lg hover:shadow-stone-100/80 dark:hover:shadow-stone-950/80 hover:-translate-y-0.5 transition-all duration-200">
      {/* Top accent */}
      {service.isApproved && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-300 z-10" />
      )}

      {/* Cover image */}
      <div
        className="relative h-32 bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 overflow-hidden shrink-0 cursor-pointer"
        onClick={onView}>
        {service.coverImage ? (
          <Image
            src={(service.coverImage as unknown as { url?: string }).url ?? ""}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            width={400}
            height={200}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={28} className="text-amber-200 dark:text-stone-600" />
          </div>
        )}

        {/* Status badge overlay */}
        {statusBadge && (
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(service._id.toString());
          }}
          className={`absolute top-3 right-3 w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-sm ${isFavorite ? "bg-amber-500 border-amber-500 text-white" : "bg-white/90 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-300 hover:text-amber-500"}`}>
          <Star size={12} fill={isFavorite ? "currentColor" : "none"} />
        </button>

        {/* Category chip */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <Layers size={8} />
            {catName}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="cursor-pointer" onClick={onView}>
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

        {/* Capability badges */}
        {(service.isApproved || service.hasTiers) && (
          <div className="flex flex-wrap gap-1.5">
            {service.isApproved && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-full px-2 py-0.5">
                <Shield size={8} /> Verified
              </span>
            )}
            {service.hasTiers && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/50 rounded-full px-2 py-0.5">
                <BadgeCheck size={8} /> Packages
              </span>
            )}
            {service.isPendingAutoActivation && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-full px-2 py-0.5">
                <Clock size={8} /> Scheduled
              </span>
            )}
          </div>
        )}

        {/* Price + actions */}
        <div className="mt-auto pt-3 border-t border-stone-50 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
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
              </div>
            ) : (
              <div />
            )}
            <button
              onClick={onView}
              className="flex items-center gap-1 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
              View
              <ArrowUpRight size={12} />
            </button>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(service._id.toString())}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-300 dark:hover:border-amber-600/60 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all">
              <Pencil size={11} />
              Edit
            </button>
            <button
              onClick={() => onShare(service._id.toString())}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-sky-300 dark:hover:border-sky-600/60 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-all">
              <Share2 size={12} />
            </button>
            <button
              onClick={() => onDelete(service._id.toString())}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-red-300 dark:hover:border-red-600/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Delete Dialog
// =============================================================================

function DeleteDialog({
  service,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  service: ServiceWithVirtuals;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
            Delete Service
          </p>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all">
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-stone-900 dark:text-stone-50">
              &ldquo;{service.title}&rdquo;
            </span>
            ? This action can be reversed by an admin.
          </p>
        </div>
        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <Package size={26} className="text-stone-300 dark:text-stone-600" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
          No services yet
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 max-w-52">
          Create your first service listing to start receiving bookings.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm">
        <Plus size={13} />
        Create Service
      </button>
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function ServiceList() {
  const router = useRouter();
  const { providerId } = useParams<{ providerId: string }>();

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useServicesByProvider({
    includeInactive: true,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const services: ServiceWithVirtuals[] = data?.items ?? [];
  const { mutateAsync: deleteService, isLoading: isDeleting } =
    useDeleteService();

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] =
    useState<ServiceWithVirtuals | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleView = useCallback(
    (service: ServiceWithVirtuals) =>
      router.push(
        service.slug
          ? `/services/${service.slug}`
          : `/services/d1/${service._id}`,
      ),
    [router],
  );

  const handleEdit = useCallback(
    (id: string) => router.push(`/provider/services/edit/${id}`),
    [router],
  );

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleShare = useCallback(
    async (id: string) => {
      const service = services.find((s) => s._id.toString() === id);
      if (!service) return;
      const url = service.slug
        ? `${window.location.origin}/services/${service.slug}`
        : `${window.location.origin}/services/d1/${id}`;
      const priceText = formatPriceForShare(service);
      const tagsText = service.tags?.length
        ? `\nTags: ${service.tags.slice(0, 3).join(", ")}`
        : "";
      if (navigator.share) {
        try {
          await navigator.share({ title: service.title, url });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }
      await copyToClipboard(service, url, priceText, tagsText);
    },
    [services],
  );

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteService(pendingDelete._id.toString());
      toast.success(`"${pendingDelete.title}" deleted`);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete service",
      );
    } finally {
      setPendingDelete(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const total = data?.total ?? services.length;
  const activeCount = services.filter((s) => s.isApproved).length;
  const pendingCount = services.filter((s) => s.isPending).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="h-full overflow-y-auto bg-stone-50 dark:bg-stone-950">
      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, #92400e 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-125 h-75 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <span className="w-4 h-px bg-amber-400" />
                  Provider Dashboard
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-50 leading-[1.15] tracking-tight">
                  My{" "}
                  <span className="relative inline-block">
                    <span className="text-amber-500">Services</span>
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/50 rounded-full" />
                  </span>
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                  Manage, edit, and track the status of all your service
                  listings.
                </p>
              </div>

              {/* Stats row */}
              {!isLoading && total > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Package size={13} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                        {total}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        total
                      </p>
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <Shield size={13} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                            {activeCount}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            active
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {pendingCount > 0 && (
                    <>
                      <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                          <Clock size={13} className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-none">
                            {pendingCount}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            pending
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() =>
                router.push(`/provider/services/create`)
              }
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all shadow-sm">
              <Zap size={12} />
              New Service
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Error */}
        {isError && !isLoading && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 mb-6">
            <AlertCircle size={15} className="shrink-0" />
            {error?.message ?? "Failed to load services"}
            <button
              onClick={() => refetch()}
              className="ml-auto flex items-center gap-1 font-semibold hover:underline">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && services.length === 0 && (
          <EmptyState
            onCreate={() =>
              router.push(`/provider/services/create`)
            }
          />
        )}

        {/* Grid */}
        {!isLoading && services.length > 0 && (
          <>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
                <Package size={15} />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                  All Services
                </p>
                <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
                  {total}
                </span>
              </div>

              {/* Quick "add" shortcut on the right */}
              <button
                onClick={() =>
                  router.push(`/provider/services/create`)
                }
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Plus size={13} />
                Add another
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {services.map((service) => (
                <ProviderServiceCard
                  key={service._id.toString()}
                  service={service}
                  isFavorite={favoriteIds.has(service._id.toString())}
                  onView={() => handleView(service)}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    const s = services.find((sv) => sv._id.toString() === id);
                    if (s) setPendingDelete(s);
                  }}
                  onShare={handleShare}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete dialog */}
      {pendingDelete && (
        <DeleteDialog
          service={pendingDelete}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
