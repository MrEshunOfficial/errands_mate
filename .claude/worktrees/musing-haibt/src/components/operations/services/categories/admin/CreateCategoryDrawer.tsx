"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  useCreateCategory,
  CreateCategoryPayload,
} from "@/hooks/services/categories/useServiceCategory";
import { useCategoryCover } from "@/hooks/files/useCategoryCover";
import type { UploadOrphanCoverResponse } from "@/types/files.types";
import CategoryForm, {
  CategoryFormData,
  CategoryOption,
} from "../form/category.form";
import { CategoryCoverPanel } from "./CategoryCoverPanel";

type DrawerStep = "cover" | "details";

export interface CreateCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTags: string[];
  availableCategories: CategoryOption[];
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  current,
}: {
  steps: { label: string; done: boolean }[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const isActive = i === current;
        const isDone = step.done;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive &&
                  "bg-primary/10 text-primary border border-primary/30",
                isDone && "text-emerald-600 dark:text-emerald-400",
                !isActive && !isDone && "text-muted-foreground",
              )}>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-emerald-500 text-white",
                  !isActive &&
                    !isDone &&
                    "border border-muted-foreground/40 text-muted-foreground",
                )}>
                {isDone ? "✓" : i + 1}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Uploaded cover preview (cover step)
// ---------------------------------------------------------------------------

function UploadedCoverPreview({
  uploadResult,
  onReplace,
}: {
  uploadResult: UploadOrphanCoverResponse;
  onReplace: () => void;
}) {
  // `url` and `thumbnailUrl` live on the nested `file` record, not the top
  // level of UploadOrphanCoverResponse.
  const previewUrl: string | undefined =
    uploadResult.file.thumbnailUrl ?? uploadResult.file.url;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {previewUrl ? (
          <div className="relative aspect-video w-full">
            <Image
              src={previewUrl}
              alt="Uploaded cover"
              fill
              className="object-cover"
              sizes="520px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white drop-shadow">
                Cover uploaded
              </span>
            </div>
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <p className="text-sm font-medium">Cover ready</p>
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={onReplace}>
        <RefreshCw className="size-3.5" />
        Replace cover image
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CreateCategoryDrawer({
  open,
  onClose,
  onSuccess,
  availableTags,
  availableCategories,
}: CreateCategoryDrawerProps) {
  const [step, setStep] = useState<DrawerStep>("cover");
  const [uploadResult, setUploadResult] =
    useState<UploadOrphanCoverResponse | null>(null);

  const { uploadCover, isUploading, error } = useCategoryCover();

  const createCategory = useCreateCategory({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  // Reset only when drawer transitions from closed -> open
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setStep("cover");
      setUploadResult(null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const handleCoverUploaded = useCallback(
    (result: UploadOrphanCoverResponse) => {
      setUploadResult(result);
    },
    [],
  );

  const handleReplaceCover = useCallback(() => {
    setUploadResult(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CategoryFormData) => {
      const payload: CreateCategoryPayload = {
        ...data,
        catCoverId: uploadResult?.fileId ?? undefined,
      };
      await createCategory.mutate(payload);
    },
    [createCategory, uploadResult],
  );

  const hasCover = uploadResult !== null;

  // Derive the shape CategoryForm expects from the raw upload result.
  // Both `url` and `thumbnailUrl` live on the nested `file` record.
  const coverPreview = uploadResult
    ? {
        fileId: uploadResult.fileId,
        url: uploadResult.file.url,
        thumbnailUrl: uploadResult.file.thumbnailUrl ?? uploadResult.file.url,
      }
    : null;

  const steps = [
    { label: "Cover Image", done: hasCover },
    { label: "Details", done: false },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-135 flex-col overflow-hidden p-0">
        {/* Header */}
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <div className="mb-1">
            <Badge
              variant="outline"
              className="border-primary/30 font-mono text-[10px] tracking-wider text-primary uppercase">
              New Category
            </Badge>
          </div>
          <SheetTitle>Create Category</SheetTitle>
          <SheetDescription>
            Add a cover image, then fill in the details.
          </SheetDescription>
        </SheetHeader>

        {/* Step indicator */}
        <div className="shrink-0 border-b px-6 py-3">
          <StepIndicator steps={steps} current={step === "cover" ? 0 : 1} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Cover step */}
          {step === "cover" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Upload a cover image to represent this category. You can skip
                and add one later.
              </p>

              {hasCover ? (
                // Already uploaded: show the preview, not the uploader
                <UploadedCoverPreview
                  uploadResult={uploadResult}
                  onReplace={handleReplaceCover}
                />
              ) : (
                <CategoryCoverPanel
                  categoryId=""
                  categoryName="New Category"
                  coverRecord={null}
                  mode="panel"
                  isUploading={isUploading}
                  error={error}
                  onUpload={uploadCover}
                  onDelete={async () => true}
                  onUploadSuccess={handleCoverUploaded}
                />
              )}
            </div>
          )}

          {/* Details step */}
          {step === "details" && (
            <div className="flex flex-col gap-4">
              <CategoryForm
                availableTags={availableTags}
                availableCategories={availableCategories}
                onSubmit={handleFormSubmit}
                // "Back" on the fields step returns to cover
                onCancel={() => setStep("cover")}
                // "Change" link on the review step returns to cover
                onChangeCover={() => setStep("cover")}
                submitLabel="Create Category"
                isLoading={createCategory.isLoading}
                // Pass the uploaded image so the review summary can show it
                coverPreview={coverPreview}
              />

              {createCategory.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createCategory.error?.message ??
                      "Failed to create category"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Footer: only visible on the cover step */}
        {step === "cover" && (
          <SheetFooter className="shrink-0 flex-row items-center justify-between border-t px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {!hasCover && (
                <Button variant="outline" onClick={() => setStep("details")}>
                  Skip
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              )}
              <Button
                onClick={() => setStep("details")}
                disabled={!hasCover && isUploading}>
                {hasCover ? (
                  <>
                    Continue
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </>
                ) : (
                  "Upload to Continue"
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
