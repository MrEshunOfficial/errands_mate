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
} from "lucide-react";
import {
  useCreateService,
  useUpdateService,
} from "@/hooks/services/useServices";
import { cn } from "@/lib/utils";
import {
  ServiceWithVirtuals,
  ServicePricing,
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
  // _id may be a Mongoose ObjectId — coerce to string for API calls
  return id ? String(id) : undefined;
}

/**
 * Pulls the IFile record off a ServiceWithVirtuals, whether it is stored
 * on the virtual wrapper or the inner Service document.
 * Returns null (not undefined) so CoverUploader's `coverRecord` prop is
 * always satisfied without casting.
 */
function resolveCoverRecord(sw: ServiceWithVirtuals | undefined): IFile | null {
  if (!sw) return null;
  const img = sw.coverImage ?? resolveInner(sw).coverImage;
  if (!img) return null;
  // The backend populates coverImage as an IFile object; accept it directly.
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
      discountRate: sp?.discount?.rate?.toString() ?? "",
      discountAmount: sp?.discount?.amount?.toString() ?? "",
      discountExpiresAt: toDateInput(sp?.discount?.expiresAt),
      discountPromoCode: sp?.discount?.promoCode ?? "",
      additionalFees:
        sp?.additionalFees?.map((f) => ({
          ...f,
          _key: Math.random().toString(36).slice(2, 9),
        })) ?? [],
      tiersEnabled: (sp?.tiers?.length ?? 0) > 0,
      tiers:
        sp?.tiers?.map((t) => ({
          ...t,
          _key: Math.random().toString(36).slice(2, 9),
        })) ?? [],
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

function buildPricing(p: PricingFormState): ServicePricing | undefined {
  if (!p.enabled) return undefined;

  const cleanedFees = p.additionalFees
    .filter((f) => f.label.trim())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _key: _k, ...f }) => f);

  const cleanedTiers = p.tiers
    .filter((t) => t.label.trim())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _key: _k, ...t }) => t);

  const hasDiscount =
    p.discountRate ||
    p.discountAmount ||
    p.discountExpiresAt ||
    p.discountPromoCode;

  return {
    pricingModel: p.pricingModel,
    currency: p.currency,
    taxIncluded: p.taxIncluded,
    commissionRateSnapshot: 0,
    ...(p.basePrice && { basePrice: parseFloat(p.basePrice) }),
    ...(p.unit && { unit: p.unit }),
    ...(p.taxRate && { taxRate: parseFloat(p.taxRate) }),
    ...(p.minimumPrice && { minimumPrice: parseFloat(p.minimumPrice) }),
    ...(p.pricingNotes && { pricingNotes: p.pricingNotes }),
    ...(cleanedFees.length > 0 && { additionalFees: cleanedFees }),
    ...(p.tiersEnabled && cleanedTiers.length > 0 && { tiers: cleanedTiers }),
    ...(hasDiscount && {
      discount: {
        ...(p.discountRate && { rate: parseFloat(p.discountRate) }),
        ...(p.discountAmount && { amount: parseFloat(p.discountAmount) }),
        ...(p.discountExpiresAt && { expiresAt: p.discountExpiresAt }),
        ...(p.discountPromoCode && { promoCode: p.discountPromoCode }),
      },
    }),
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
    if (p.taxRate && isNaN(parseFloat(p.taxRate)))
      e.taxRate = "Invalid tax rate";
    if (p.pricingModel === "negotiable" && !p.minimumPrice)
      e.minimumPrice = "Minimum price is required for negotiable model";
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

  const resolvedServiceId = resolveServiceId(service);

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
    linkCover, // ← add
    deleteCloudinaryCover,
  } = useServiceCover(resolvedServiceId);

  // The file _id to persist with the service payload. Initialised from the
  // existing cover in edit mode; updated after every successful upload.
  const [coverImageId, setCoverImageId] = useState<string | undefined>(() => {
    const existing = resolveCoverRecord(service);
    return existing?._id ? String(existing._id) : undefined;
  });

  // Keep coverImageId in sync when the hook fetches the latest record in edit
  // mode (e.g. after the component mounts and the auto-fetch completes).
  useEffect(() => {
    if (coverRecord?._id) {
      setCoverImageId(String(coverRecord._id));
    }
  }, [coverRecord]);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<ServiceFormState>(() =>
    mode === "edit" && service ? initFromService(service) : initEmpty(),
  );

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (mode === "edit" && service) {
      setForm(initFromService(service));
    }
  }, [service, mode]);

  // ── Cover handlers ─────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    const result = await uploadCover(file);
    if (!result) return result;

    const id =
      result.fileId ?? (result as { file?: { _id?: string } }).file?._id;
    if (!id) return result;

    // Edit mode — link the orphan immediately so entityId is stamped now,
    // not deferred to form submission (which may never happen).
    if (mode === "edit" && resolvedServiceId) {
      await linkCover(resolvedServiceId, String(id));
      // coverRecord is refreshed inside linkCover; no need to set coverImageId
      // manually — the useEffect syncing coverRecord._id handles it.
    } else {
      // Create mode — no entity yet; store fileId for the submit payload.
      setCoverImageId(String(id));
    }

    return result;
  };

  /**
   * Called by CoverUploader when the user confirms deletion.
   * Deletes from Cloudinary and clears the local fileId so it is not sent
   * in the payload.
   */
  const handleCoverDelete = async (): Promise<boolean> => {
    // In edit mode we know the service id; in create mode there is nothing
    // on the server yet so we just clear local state.
    if (resolvedServiceId) {
      const ok = await deleteCloudinaryCover(resolvedServiceId);
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

      const payload: CreateServicePayload = {
        title: b.title.trim(),
        description: b.description.trim(),
        slug: b.slug.trim(),
        tags: tagsArray,
        categoryId: b.categoryId,
        isPrivate: form.isPrivate,
        // Only include coverImage when we have a linked file id
        ...(coverImageId ? { coverImage: coverImageId } : {}),
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
        result = await createService(payload);
        toast.success("Service created — pending review");
      } else {
        if (!resolvedServiceId)
          throw new Error("Service ID is required for update");
        result = await updateService(
          resolvedServiceId,
          payload as UpdateServicePayload,
        );
        toast.success("Service updated");
      }

      setSubmitSuccess(true);
      onSuccess?.(result);
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

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitSuccess) {
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
            {/* ─── 1. Cover image ─────────────────────────────────────── */}
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

            {/* ─── 2. Basic information ────────────────────────────────── */}
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

            {/* ─── 3. Pricing ──────────────────────────────────────────── */}
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
                }}
              />
            </SectionCard>

            {/* ─── 4. Admin settings ───────────────────────────────────── */}
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
