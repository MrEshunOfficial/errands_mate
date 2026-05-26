"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { SystemRole } from "@/types/base.types";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  CheckCircle,
  Calendar,
  ImagePlus,
} from "lucide-react";
import {
  useCreateService,
  useUpdateService,
} from "@/hooks/services/useServices";
import { cn } from "@/lib/utils";
import {
  ServiceWithVirtuals,
  ServicePricingInput,
  PROMO_CODE_REGEX,
  Service,
} from "@/types/services/service.types";
import type {
  CreateServicePayload,
  UpdateServicePayload,
} from "@/lib/api/services/service.api";

import {
  ServicePricingForm,
  PricingFormState,
  PricingValidationErrors,
  initEmptyPricing,
} from "./service/service.pricing.form";
import {
  ServiceBasicInfoForm,
  BasicInfoFormState,
  BasicInfoValidationErrors,
  initEmptyBasicInfo,
} from "./service/basicInfo.form";
import { CoverUploader } from "@/components/files/CoverUploader";
import { useServiceCover } from "@/hooks/files/useServiceCover";
import type { IFile } from "@/types/files.types";

// =============================================================================
// Types
// =============================================================================

interface ServiceFormState {
  basicInfo: BasicInfoFormState;
  isPrivate: boolean;
  scheduledActivationAt: string;
  pricing: PricingFormState;
}

type ValidationErrors = BasicInfoValidationErrors & PricingValidationErrors;

type FormStep = "form" | "cover" | "done";

export interface ServiceFormProps {
  mode: "create" | "edit";
  service?: ServiceWithVirtuals;
  onSuccess?: (service: ServiceWithVirtuals) => void;
  onCancel?: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function resolveInner(sw: ServiceWithVirtuals): Service {
  return (sw.service as Service | undefined) ?? sw;
}

function resolveServiceId(
  sw: ServiceWithVirtuals | undefined,
): string | undefined {
  if (!sw) return undefined;
  const id = sw._id ?? resolveInner(sw)._id;
  return id ? String(id) : undefined;
}

function resolveCoverRecord(sw: ServiceWithVirtuals | undefined): IFile | null {
  if (!sw) return null;
  const img = sw.coverImage ?? resolveInner(sw).coverImage;
  if (!img) return null;
  if (typeof img === "object" && "url" in (img as object)) return img as IFile;
  return null;
}

function toDateTimeLocal(value: string | Date | undefined | null): string {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function toDateInput(value: string | Date | undefined | null): string {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function initFromService(sw: ServiceWithVirtuals): ServiceFormState {
  const service = resolveInner(sw);
  const sp = service.servicePricing ?? sw.servicePricing;

  return {
    basicInfo: {
      title: service.title ?? "",
      slug: service.slug ?? "",
      slugManuallyEdited: true,
      description: service.description ?? "",
      tags: service.tags?.join(", ") ?? "",
      categoryId:
        typeof service.categoryId === "string"
          ? service.categoryId
          : ((service.categoryId as unknown as { _id: string })?._id ?? ""),
    },
    isPrivate: service.isPrivate ?? false,
    scheduledActivationAt: toDateTimeLocal(service.scheduledActivationAt),
    pricing: {
      enabled: !!sp,
      pricingModel: sp?.pricingModel ?? "fixed",
      currency: sp?.currency ?? "GHS",
      basePrice: sp?.basePrice?.toString() ?? "",
      unit: sp?.unit ?? "",
      taxIncluded: sp?.taxIncluded ?? false,
      taxRate: sp?.taxRate?.toString() ?? "",
      minimumPrice: sp?.minimumPrice?.toString() ?? "",
      pricingNotes: sp?.pricingNotes ?? "",
      tiersEnabled: (sp?.tiers?.length ?? 0) > 0,
      tiers:
        sp?.tiers?.map((t) => ({
          ...t,
          _key: Math.random().toString(36).slice(2, 9),
        })) ?? [],
      feesEnabled: (sp?.additionalFees?.length ?? 0) > 0,
      additionalFees:
        sp?.additionalFees?.map((f) => ({
          ...f,
          _key: Math.random().toString(36).slice(2, 9),
        })) ?? [],
      discountEnabled: !!sp?.discount,
      discountRate: sp?.discount?.rate?.toString() ?? "",
      discountAmount: sp?.discount?.amount?.toString() ?? "",
      discountExpiresAt: toDateInput(sp?.discount?.expiresAt),
      discountPromoCode: sp?.discount?.promoCode ?? "",
    },
  };
}

function initEmpty(): ServiceFormState {
  return {
    basicInfo: initEmptyBasicInfo(),
    isPrivate: false,
    scheduledActivationAt: "",
    pricing: initEmptyPricing(),
  };
}

// =============================================================================
// Build ServicePricing payload
// =============================================================================

function buildPricing(p: PricingFormState): ServicePricingInput | undefined {
  if (!p.enabled) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanedTiers = p.tiers.filter((t) => t.label.trim()).map(({ _key: _k, ...t }) => t);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanedFees  = p.additionalFees.filter((f) => f.label.trim()).map(({ _key: _k, ...f }) => f);

  const hasTiers = p.tiersEnabled && cleanedTiers.length > 0;

  return {
    pricingModel: p.pricingModel,
    currency:     p.currency,
    taxIncluded:  p.taxIncluded,
    // commissionRateSnapshot intentionally omitted — set by the server
    ...(!hasTiers && p.basePrice ? { basePrice: parseFloat(p.basePrice) } : {}),
    ...(p.unit        ? { unit:         p.unit                  } : {}),
    ...(p.taxRate     ? { taxRate:      parseFloat(p.taxRate)   } : {}),
    ...(p.minimumPrice? { minimumPrice: parseFloat(p.minimumPrice) } : {}),
    ...(p.pricingNotes? { pricingNotes: p.pricingNotes          } : {}),
    ...(hasTiers                        ? { tiers:          cleanedTiers } : {}),
    ...(p.feesEnabled && cleanedFees.length > 0 ? { additionalFees: cleanedFees } : {}),
    ...(p.discountEnabled ? {
      discount: {
        ...(p.discountRate      ? { rate:      parseFloat(p.discountRate)          } : {}),
        ...(p.discountAmount    ? { amount:    parseFloat(p.discountAmount)        } : {}),
        ...(p.discountExpiresAt ? { expiresAt: p.discountExpiresAt                } : {}),
        ...(p.discountPromoCode ? { promoCode: p.discountPromoCode.toUpperCase()  } : {}),
      },
    } : {}),
  };
}

// =============================================================================
// Validation
// =============================================================================

function validateForm(form: ServiceFormState): ValidationErrors {
  const e: ValidationErrors = {};
  const b = form.basicInfo;

  if (!b.title.trim()) e.title = "Title is required";
  else if (b.title.length < 3) e.title = "Title must be at least 3 characters";
  else if (b.title.length > 200)
    e.title = "Title must be less than 200 characters";

  if (!b.slug.trim()) e.slug = "Slug is required";
  else if (!/^[a-z0-9-]+$/.test(b.slug))
    e.slug = "Only lowercase letters, numbers and hyphens";

  if (!b.description.trim()) e.description = "Description is required";
  else if (b.description.length < 20)
    e.description = "Description must be at least 20 characters";
  else if (b.description.length > 5000)
    e.description = "Description must be less than 5000 characters";

  if (!b.categoryId) e.categoryId = "Please select a category";

  const p = form.pricing;
  if (p.enabled) {
    const needsBase =
      p.pricingModel !== "free" &&
      p.pricingModel !== "negotiable" &&
      !p.tiersEnabled;
    if (needsBase && !p.basePrice) e.basePrice = "Base price is required";
    if (p.basePrice && isNaN(parseFloat(p.basePrice)))
      e.basePrice = "Invalid price";

    const needsUnit =
      p.pricingModel === "hourly" || p.pricingModel === "per_unit";
    if (needsUnit && !p.unit) e.unit = "Unit is required for this pricing model";

    if (p.taxRate && isNaN(parseFloat(p.taxRate)))
      e.taxRate = "Invalid tax rate";
    if (!p.taxIncluded && !p.taxRate)
      e.taxRate = "Tax rate is required when tax is not included in the price";

    if (p.pricingModel === "negotiable" && !p.minimumPrice)
      e.minimumPrice = "Minimum price is required for negotiable model";

    if (
      p.discountPromoCode &&
      !PROMO_CODE_REGEX.test(p.discountPromoCode.toUpperCase())
    )
      e.promoCode =
        "Promo code must be 3–20 uppercase letters or numbers, no spaces";
  }

  return e;
}

// =============================================================================
// Sub-components
// =============================================================================

function SectionCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/60 text-sm font-semibold text-gray-700 dark:text-gray-200",
          collapsible &&
            "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        )}>
        {title}
        {collapsible &&
          (open ? (
            <ChevronUp className="w-4 h-4 opacity-60" />
          ) : (
            <ChevronDown className="w-4 h-4 opacity-60" />
          ))}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function FieldRow({
  label,
  required,
  hint,
  error,
  children,
  id,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export default function ServiceForm({
  mode = "create",
  service,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const formId = useId();

  // Reactive service ID — starts from the prop, updated after a successful create
  const [activeServiceId, setActiveServiceId] = useState<string | undefined>(
    () => resolveServiceId(service),
  );

  const { mutateAsync: createService, isLoading: createLoading } =
    useCreateService();
  const { mutateAsync: updateService, isLoading: updateLoading } =
    useUpdateService();
  const isLoading = mode === "create" ? createLoading : updateLoading;

  const {
    coverRecord,
    isLoading: coverLoading,
    isUploading,
    error: coverError,
    uploadCover,
    linkCover,
    deleteCloudinaryCover,
  } = useServiceCover(activeServiceId);

  const [coverImageId, setCoverImageId] = useState<string | undefined>(() => {
    const existing = resolveCoverRecord(service);
    return existing?._id ? String(existing._id) : undefined;
  });

  useEffect(() => {
    if (coverRecord?._id) {
      setCoverImageId(String(coverRecord._id));
    }
  }, [coverRecord]);

  // ── Step machine ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<FormStep>("form");
  const [createdService, setCreatedService] =
    useState<ServiceWithVirtuals | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<ServiceFormState>(() =>
    mode === "edit" && service ? initFromService(service) : initEmpty(),
  );

  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (mode === "edit" && service) {
      setForm(initFromService(service));
    }
  }, [service, mode]);

  // ── Cover handlers ───────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    const result = await uploadCover(file);
    if (!result) return result;

    const id =
      result.fileId ?? (result as { file?: { _id?: string } }).file?._id;
    if (!id) return result;

    // In edit mode the service already exists — link immediately.
    // In create mode activeServiceId is now the newly-created ID,
    // so linkCover works here too.
    if (activeServiceId) {
      await linkCover(activeServiceId, String(id));
    }

    setCoverImageId(String(id));
    return result;
  };

  const handleCoverDelete = async (): Promise<boolean> => {
    if (activeServiceId) {
      const ok = await deleteCloudinaryCover(activeServiceId);
      if (ok) setCoverImageId(undefined);
      return ok;
    }
    setCoverImageId(undefined);
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstId = Object.keys(errs)[0];
      document
        .getElementById(firstId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      const { basicInfo: b } = form;
      const tagsArray = b.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const pricing = buildPricing(form.pricing);

      const basePayload = {
        title: b.title.trim(),
        description: b.description.trim(),
        slug: b.slug.trim(),
        tags: tagsArray,
        categoryId: b.categoryId,
        isPrivate: form.isPrivate,
        ...(form.scheduledActivationAt
          ? {
              scheduledActivationAt: new Date(
                form.scheduledActivationAt,
              ).toISOString(),
            }
          : {}),
        ...(pricing ? { servicePricing: pricing } : {}),
      };

      let result: ServiceWithVirtuals;

      if (mode === "create") {
        // Cover is NOT included in the create payload — it is linked after
        // creation on the dedicated cover step, eliminating orphaned files.
        result = await createService(basePayload as CreateServicePayload);

        const newId = resolveServiceId(result);
        if (newId) setActiveServiceId(newId); // useServiceCover re-runs with real ID

        setCreatedService(result);
        setStep("cover");
        toast.success("Service created — add a cover image to stand out");
      } else {
        if (!activeServiceId)
          throw new Error("Service ID is required for update");

        // In edit mode, include the cover if one is already linked
        const editPayload: UpdateServicePayload = {
          ...basePayload,
          ...(coverImageId ? { coverImage: coverImageId } : {}),
        };

        result = await updateService(activeServiceId, editPayload);
        toast.success("Service updated");
        setStep("done");
        onSuccess?.(result);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${mode} service`,
      );
    }
  };

  const handleCancel = () => (onCancel ? onCancel() : router.back());

  const isAdmin =
    user?.systemRole === SystemRole.ADMIN ||
    user?.systemRole === SystemRole.SUPER_ADMIN;

  // ── Done screen ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Service {mode === "create" ? "Created" : "Updated"}!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {mode === "create"
              ? "Submitted for review. Redirecting…"
              : "Changes saved. Redirecting…"}
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
        </div>
      </div>
    );
  }

  // ── Cover step (create mode only, after successful submission) ───────────
  if (step === "cover") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Service created — add a cover
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-10">
              A great cover image helps your service stand out in listings. You
              can always change it later from the service settings.
            </p>
          </div>

          {/* Uploader */}
          <div className="p-6">
            <CoverUploader
              context="service"
              coverRecord={coverRecord}
              isLoading={coverLoading}
              isUploading={isUploading}
              error={coverError}
              onUpload={handleCoverUpload}
              onDelete={handleCoverDelete}
              onDeleteSuccess={() => setCoverImageId(undefined)}
            />

            {coverImageId && (
              <p className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-3">
                <CheckCircle className="w-3 h-3 shrink-0" />
                Cover image linked to your service
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (createdService) onSuccess?.(createdService);
                setStep("done");
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline transition-colors">
              Skip for now
            </button>

            <button
              type="button"
              disabled={!coverImageId || isUploading}
              onClick={() => {
                if (createdService) onSuccess?.(createdService);
                setStep("done");
              }}
              className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              {isUploading ? "Uploading…" : "Save & Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? "Create New Service" : "Edit Service"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {mode === "create"
              ? "Fill in all required fields. Your service will be submitted for review."
              : "Update the fields below and save."}
          </p>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1">
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-6 space-y-5 h-[calc(96vh-220px)] overflow-auto hide-scrollbar">
            {/* ─── Cover image (edit mode only) ────────────────────────── */}
            {mode === "edit" && (
              <SectionCard title="Cover Image">
                <CoverUploader
                  context="service"
                  coverRecord={coverRecord}
                  isLoading={coverLoading}
                  isUploading={isUploading}
                  error={coverError}
                  onUpload={handleCoverUpload}
                  onDelete={handleCoverDelete}
                  onDeleteSuccess={() => setCoverImageId(undefined)}
                />
                {coverImageId && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    Cover image linked — will be saved with this service
                  </p>
                )}
              </SectionCard>
            )}

            {/* ─── Basic information ───────────────────────────────────── */}
            <SectionCard title="Basic Information">
              <ServiceBasicInfoForm
                value={form.basicInfo}
                onChange={(basicInfo) =>
                  setForm((prev) => ({ ...prev, basicInfo }))
                }
                errors={{
                  title: errors.title,
                  slug: errors.slug,
                  description: errors.description,
                  categoryId: errors.categoryId,
                  tags: errors.tags,
                }}
              />
            </SectionCard>

            {/* ─── Pricing ─────────────────────────────────────────────── */}
            <SectionCard title="Pricing" collapsible defaultOpen>
              <ServicePricingForm
                value={form.pricing}
                onChange={(pricing) =>
                  setForm((prev) => ({ ...prev, pricing }))
                }
                errors={{
                  basePrice: errors.basePrice,
                  taxRate: errors.taxRate,
                  minimumPrice: errors.minimumPrice,
                  unit: errors.unit,
                  promoCode: errors.promoCode,
                }}
              />
            </SectionCard>

            {/* ─── Admin settings ──────────────────────────────────────── */}
            {isAdmin && (
              <SectionCard
                title="Admin Settings"
                collapsible
                defaultOpen={false}>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Private listing
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Only visible to company-trained providers
                    </p>
                  </div>
                  <Switch
                    checked={form.isPrivate}
                    onCheckedChange={(v) =>
                      setForm((prev) => ({ ...prev, isPrivate: v }))
                    }
                  />
                </div>
                <FieldRow
                  id="scheduledActivationAt"
                  label="Scheduled Activation"
                  hint="Leave blank for manual approval. Set a datetime to auto-activate.">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="scheduledActivationAt"
                      type="datetime-local"
                      value={form.scheduledActivationAt}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          scheduledActivationAt: e.target.value,
                        }))
                      }
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </FieldRow>
              </SectionCard>
            )}

            <div className="h-6" />
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t rounded-b-md border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-5 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isLoading}
            className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "create" ? "Creating…" : "Updating…"}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === "create" ? "Create Service" : "Update Service"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
