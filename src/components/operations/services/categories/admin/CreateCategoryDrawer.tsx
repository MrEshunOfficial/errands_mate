"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, ArrowRight, ImagePlus, Loader2 } from "lucide-react";
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
  Category,
} from "@/hooks/services/categories/useServiceCategory";
import { useCategoryCover } from "@/hooks/files/useCategoryCover";
import CategoryForm, {
  CategoryFormData,
  CategoryOption,
} from "../form/category.form";
import { CategoryCoverPanel } from "./CategoryCoverPanel";

type DrawerStep = "details" | "cover";

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
// Main component
// ---------------------------------------------------------------------------

export function CreateCategoryDrawer({
  open,
  onClose,
  onSuccess,
  availableTags,
  availableCategories,
}: CreateCategoryDrawerProps) {
  const [step, setStep] = useState<DrawerStep>("details");
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);

  const createdCategoryId = createdCategory?._id
    ? String(createdCategory._id)
    : undefined;

  const {
    uploadCover,
    linkCover,
    deleteCloudinaryCover,
    isUploading,
    error: coverError,
  } = useCategoryCover(createdCategoryId);

  const createCategory = useCreateCategory();

  // Reset when drawer opens
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setStep("details");
      setCreatedCategory(null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleFormSubmit = useCallback(
    async (data: CategoryFormData) => {
      const payload: CreateCategoryPayload = {
        ...data,
        // null means "no parent" in the form, but the create API only accepts string | undefined
        parentCategoryId: data.parentCategoryId ?? undefined,
      };
      const category = await createCategory.mutate(payload);
      setCreatedCategory(category);
      setStep("cover");
    },
    [createCategory],
  );

  const handleCoverUpload = useCallback(
    async (file: File) => {
      const result = await uploadCover(file);
      if (result && createdCategoryId) {
        await linkCover(createdCategoryId, result.fileId);
      }
      return result;
    },
    [uploadCover, linkCover, createdCategoryId],
  );

  const handleDone = useCallback(() => {
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  const categoryCreated = step === "cover";

  const steps = [
    { label: "Details", done: categoryCreated },
    { label: "Cover Image", done: false },
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
            Fill in the details, then optionally add a cover image.
          </SheetDescription>
        </SheetHeader>

        {/* Step indicator */}
        <div className="shrink-0 border-b px-6 py-3">
          <StepIndicator steps={steps} current={step === "details" ? 0 : 1} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Details step */}
          {step === "details" && (
            <div className="flex flex-col gap-4">
              <CategoryForm
                availableTags={availableTags}
                availableCategories={availableCategories}
                onSubmit={handleFormSubmit}
                onCancel={onClose}
                submitLabel="Create Category"
                isLoading={createCategory.isLoading}
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

          {/* Cover step — category already exists, upload links directly */}
          {step === "cover" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Category created — add a cover image to help it stand out
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                A cover image helps users recognise this category at a glance.
                You can always add or change it later from the category settings.
              </p>

              <CategoryCoverPanel
                categoryId={createdCategoryId ?? ""}
                categoryName={createdCategory?.catName ?? "New Category"}
                coverRecord={null}
                mode="panel"
                isUploading={isUploading}
                error={coverError}
                onUpload={handleCoverUpload}
                onDelete={async () => {
                  if (!createdCategoryId) return true;
                  return deleteCloudinaryCover(createdCategoryId);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <SheetFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </SheetFooter>
        )}

        {step === "cover" && (
          <SheetFooter className="shrink-0 flex-row items-center justify-between border-t px-6 py-4">
            <Button variant="ghost" onClick={handleDone} disabled={isUploading}>
              Skip for now
            </Button>
            <Button onClick={handleDone} disabled={isUploading} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" />
                  Done
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
