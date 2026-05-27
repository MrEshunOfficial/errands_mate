"use client";

// =============================================================================
// ServiceDetailPage.tsx
// Service detail view — imports ProviderPanel as a standalone component.
// =============================================================================

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  Package,
  Share2,
  ArrowLeft,
  AlertCircle,
  Layers,
  BadgePercent,
  CalendarDays,
  Info,
  CheckCircle2,
  CalendarClock,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useServiceBySlug } from "@/hooks/services/useServices";
import { ServicePricing, Service } from "@/types/services/service.types";
import { Category } from "@/types/services/categories/service.category.types";
import { IFile } from "@/types/files.types";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { UserRole } from "@/types/base.types";

import ProviderPanel, { PopulatedProvider } from "./ProviderPanel";
import {
  Card,
  CardHeader,
  SECTION_LABEL,
  CARD_BASE,
  Divider,
} from "./service-ui-primitives";

// =============================================================================
// Helpers
// =============================================================================

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function safeDistance(value: unknown): string {
  const d = safeDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

function safeFormat(value: unknown, fmt: string): string {
  const d = safeDate(value);
  return d ? format(d, fmt) : "—";
}

function getCoverImage(cover: unknown): { url?: string } | null {
  if (!cover) return null;
  if (typeof cover === "string") return { url: cover };
  if (typeof cover === "object" && cover !== null) {
    const c = cover as unknown as IFile;
    if (c.url) return { url: c.url };
  }
  return null;
}

function getCategoryName(category: unknown): string | null {
  if (!category) return null;
  if (typeof category === "string") return null;
  return (category as Category).catName ?? null;
}

function formatPrice(
  amount: number | null | undefined,
  currency = "GHS",
  compact = false,
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(amount);
}

function getBasePrice(pricing?: ServicePricing): number | null {
  if (!pricing) return null;
  if (pricing.basePrice != null) return pricing.basePrice;
  if (pricing.tiers?.length) return pricing.tiers[0].basePrice ?? null;
  return null;
}

/**
 * Returns the populated provider object if `providerId` has been
 * expanded by the API, or null if it's still a plain string ID.
 */
function getPopulatedProvider(providerId: unknown): PopulatedProvider | null {
  if (!providerId || typeof providerId === "string") return null;
  return providerId as PopulatedProvider;
}

// =============================================================================
// ServiceHero
// =============================================================================

function ServiceHero({
  service,
  categoryName,
  coverImage,
  onBack,
}: {
  service: Service;
  categoryName: string | null;
  coverImage: { url?: string } | null;
  onBack: () => void;
}) {
  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-950 rounded-none">
      {coverImage?.url ? (
        <Image
          src={coverImage.url}
          alt={service.title}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-gray-900 to-gray-950 flex items-center justify-center">
          <Package className="w-20 h-20 text-gray-800" />
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 sm:left-6 z-10 flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-black/25 hover:bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 transition-all">
        <ArrowLeft size={13} />
        Back
      </button>

      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
        {categoryName && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-300 bg-blue-500/15 border border-blue-400/25 rounded-full px-3 py-1 mb-3">
            <Package size={10} />
            {categoryName}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white leading-tight tracking-tight max-w-2xl">
          {service.title}
        </h1>
        <div className="flex flex-wrap gap-3 sm:gap-5 mt-3">
          <span className="text-xs text-white/40 flex items-center gap-1.5">
            <CalendarDays size={11} />
            Listed {safeDistance(service.createdAt)}
          </span>
          {service.updatedAt && (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <CalendarClock size={11} />
              Updated {safeDistance(service.updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DescriptionCard
// =============================================================================

function DescriptionCard({ description }: { description?: string }) {
  return (
    <Card>
      <CardHeader icon={<Info size={13} />} title="About this service" />
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {description || "No description provided."}
      </p>
    </Card>
  );
}

// =============================================================================
// TagsCard
// =============================================================================

function TagsCard({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <Card>
      <CardHeader icon={<Tag size={13} />} title="Tags" />
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium border border-gray-100 dark:border-gray-700">
            #{tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// TiersCard
// =============================================================================

function TiersCard({
  tiers,
  currency,
}: {
  tiers: NonNullable<ServicePricing["tiers"]>;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader icon={<Layers size={13} />} title="Packages" />
      <div className="grid sm:grid-cols-2 gap-3">
        {tiers.map((tier, i) => (
          <div
            key={tier.tierId}
            className={`rounded-xl p-4 border transition-colors ${
              i === 0
                ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20"
            }`}>
            {i === 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 mb-2">
                Most popular
              </p>
            )}
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {tier.label}
              </p>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                {formatPrice(tier.basePrice, currency, true)}
              </p>
            </div>
            {tier.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {tier.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// AdditionalFeesCard
// =============================================================================

function AdditionalFeesCard({
  fees,
  currency,
}: {
  fees: NonNullable<ServicePricing["additionalFees"]>;
  currency: string;
}) {
  if (!fees.length) return null;
  return (
    <Card>
      <CardHeader icon={<BadgePercent size={13} />} title="Additional fees" />
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {fees.map((fee, i) => (
          <div
            key={i}
            className={`flex justify-between items-center py-2.5 px-3 gap-3 ${
              i !== fees.length - 1
                ? "border-b border-gray-50 dark:border-gray-800/80"
                : ""
            }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  fee.isOptional
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
                }`}>
                {fee.isOptional ? "Optional" : "Required"}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {fee.label}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums shrink-0">
              {formatPrice(fee.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// ServiceInfoCard
// =============================================================================

function ServiceInfoCard({ service }: { service: Service }) {
  return (
    <Card>
      <CardHeader icon={<CalendarDays size={13} />} title="Service info" />
      <dl className="w-full flex flex-col gap-2">
        <div>
          <dt className={`${SECTION_LABEL} mb-1`}>Published</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {safeDistance(service.createdAt)}
          </dd>
        </div>
        <div>
          <dt className={`${SECTION_LABEL} mb-1`}>Last updated</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {safeDistance(service.updatedAt)}
          </dd>
        </div>
        {service.approvedAt && (
          <div>
            <dt className={`${SECTION_LABEL} mb-1`}>Approved</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {safeFormat(service.approvedAt, "MMM d, yyyy")}
            </dd>
          </div>
        )}
        {service.rejectedAt && (
          <div>
            <dt className={`${SECTION_LABEL} mb-1`}>Rejected</dt>
            <dd className="text-sm font-medium text-red-600 dark:text-red-400">
              {safeFormat(service.rejectedAt, "MMM d, yyyy")}
            </dd>
          </div>
        )}
        {service.rejectionReason && (
          <div>
            <dt className={`${SECTION_LABEL} mb-1`}>Rejection reason</dt>
            <dd className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
              {service.rejectionReason}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

// =============================================================================
// PricingPanel
// =============================================================================

function PricingPanel({
  pricing,
  onShare,
  onRequest,
  hasProvider,
  isCustomer,
}: {
  pricing?: ServicePricing;
  onShare: () => void;
  onRequest: () => void;
  hasProvider: boolean;
  isCustomer: boolean;
}) {
  const basePrice = getBasePrice(pricing);
  const currency = pricing?.currency ?? "GHS";
  const hasTiers = !!pricing?.tiers?.length;

  return (
    <div className={`${CARD_BASE} overflow-hidden`}>
      <div className="bg-gray-950 dark:bg-black px-5 sm:px-6 py-6">
        {basePrice != null ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {hasTiers ? "Starting from" : "Service price"}
            </p>
            <p className="text-4xl sm:text-[42px] font-semibold tracking-tight leading-none tabular-nums text-white">
              {formatPrice(basePrice, currency)}
            </p>
            {pricing?.unit && (
              <p className="text-xs text-gray-400 mt-2">per {pricing.unit}</p>
            )}
            {pricing?.taxIncluded && (
              <div className="flex items-center gap-1.5 mt-3">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-xs text-emerald-500 font-medium">
                  All taxes included
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xl font-semibold text-white">Price on request</p>
        )}
      </div>

      <div className="px-5 sm:px-6 py-4 space-y-2.5">
        {hasProvider && isCustomer && (
          <Button
            onClick={onRequest}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-xl shadow-none transition-colors">
            Request this Provider
          </Button>
        )}
        <Button
          onClick={onShare}
          variant="outline"
          className="w-full h-9 text-xs font-medium rounded-xl gap-2 border-gray-200 dark:border-gray-700">
          <Share2 size={13} />
          Share this service
        </Button>
      </div>

      {pricing?.pricingNotes && (
        <>
          <Divider />
          <p className="px-5 sm:px-6 py-4 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {pricing.pricingNotes}
          </p>
        </>
      )}
    </div>
  );
}

// =============================================================================
// ErrorState
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 mb-5">
          <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {notFound ? "Service not found" : "Something went wrong"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 h-9 text-sm border-gray-200 dark:border-gray-700">
            <ArrowLeft size={13} />
            Browse services
          </Button>
          {!notFound && (
            <Button
              onClick={onRetry}
              className="h-9 text-sm bg-blue-600 hover:bg-blue-700">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ServiceDetailPage (default export)
// =============================================================================

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { profile: myProfile } = useProfile();
  const isCustomer = myProfile?.role === UserRole.CUSTOMER;

  const { data, isLoading, error, refetch } = useServiceBySlug(slug, true);

  const serviceRaw = data?.service ?? data;
  const service = serviceRaw as Service | null;

  if (isLoading)
    return <LoadingOverlay message="Fetching service details…" show />;

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load service"}
        onBack={() => router.push("/services")}
        onRetry={refetch}
      />
    );
  }

  if (!service?.title) {
    return (
      <ErrorState
        message="This service doesn't exist or has been removed."
        onBack={() => router.push("/services")}
        onRetry={refetch}
        notFound
      />
    );
  }

  const coverImage = getCoverImage(service.coverImage);
  const categoryName = getCategoryName(service.categoryId);
  const pricing = service.servicePricing;
  const hasTiers = !!pricing?.tiers?.length;
  const currency = pricing?.currency ?? "GHS";
  const provider = getPopulatedProvider(service.providerId);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: service.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleRequest = (providerId: string) => {
    const serviceId = String(service._id ?? "");
    const query = serviceId ? `?serviceId=${serviceId}` : "";
    router.push(`/requests/provider/${providerId}${query}`);
  };

  const basePrice = getBasePrice(pricing);

  return (
    <main className="h-full overflow-y-auto">
      {/* ── Hero ── */}
      <ServiceHero
        service={service}
        categoryName={categoryName}
        coverImage={coverImage}
        onBack={() => router.back()}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pt-6 sm:pt-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
          {/* Left column (wide) on desktop — main content */}
          <div className="space-y-4 min-w-0">
            <DescriptionCard description={service.description} />
            {service.tags?.length ? <TagsCard tags={service.tags} /> : null}
            {hasTiers && pricing?.tiers && (
              <TiersCard tiers={pricing.tiers} currency={currency} />
            )}
            {pricing?.additionalFees?.length ? (
              <AdditionalFeesCard
                fees={pricing.additionalFees}
                currency={currency}
              />
            ) : null}
            <ServiceInfoCard service={service} />
          </div>

          {/* Right column (narrow sidebar) on desktop — hidden on mobile (sticky CTA covers it) */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-6 self-start">
            <PricingPanel
              pricing={pricing}
              onShare={handleShare}
              onRequest={() => handleRequest(provider?._id ?? "")}
              hasProvider={!!provider}
              isCustomer={isCustomer}
            />
            {provider && (
              <ProviderPanel
                provider={provider}
                onRequest={() => handleRequest(provider._id)}
                isCustomer={isCustomer}
              />
            )}
          </div>
        </div>

        {/* Provider panel shown below content on mobile */}
        {provider && (
          <div className="lg:hidden mt-4">
            <ProviderPanel
              provider={provider}
              onRequest={() => handleRequest(provider._id)}
              isCustomer={isCustomer}
            />
          </div>
        )}
      </div>

      {/* ── Mobile sticky CTA bar ──────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          {basePrice != null ? (
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-none tabular-nums">
              {formatPrice(basePrice, currency)}
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Price on request
            </p>
          )}
          {hasTiers && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              starting from
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleShare}
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-gray-200 dark:border-gray-700 shrink-0">
            <Share2 size={14} />
          </Button>
          {provider && isCustomer && (
            <Button
              onClick={() => handleRequest(provider._id)}
              disabled={provider.status?.toLowerCase() === "booked"}
              className={`h-9 px-5 text-sm font-medium rounded-xl shadow-none ${
                provider.status?.toLowerCase() === "booked"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {provider.status?.toLowerCase() === "booked" ? "Booked" : "Request"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
