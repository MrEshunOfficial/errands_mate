"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  X,
  FolderTree,
  Loader2,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Hash,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Standalone interface — intentionally not derived from CreateCategoryPayload
 * via Omit+intersection, because TypeScript resolves intersected optional
 * members inconsistently inside generic functions like handleFieldChange.
 *
 * parentCategoryId semantics:
 *   null      → explicitly clear the parent (liberate to top-level)
 *   string    → set / change the parent
 *   undefined → leave unchanged (default for the create flow)
 *
 * null survives JSON.stringify as the literal `null`; undefined is stripped.
 */
export interface CategoryFormData {
  catName: string;
  catDesc: string;
  slug: string;
  tags?: string[];
  parentCategoryId?: string | null;
}

export interface CoverPreview {
  fileId: string;
  url: string;
  thumbnailUrl: string;
}

export interface CategoryOption {
  _id: string;
  catName: string;
  slug: string;
  parentCategoryId?: string;
}

export interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  availableTags?: string[];
  availableCategories?: CategoryOption[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  onChangeCover?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  currentCategoryId?: string;
  coverPreview?: CoverPreview | null;
  onCoverRemove?: () => void;
}

type FormStep = "fields" | "review";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_FORM_DATA: CategoryFormData = {
  catName: "",
  catDesc: "",
  slug: "",
  tags: [],
  parentCategoryId: undefined,
};

// ---------------------------------------------------------------------------
// Review row
// ---------------------------------------------------------------------------

function ReviewRow({
  icon: Icon,
  label,
  value,
  empty,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {empty ? (
          <span className="text-sm text-muted-foreground/60 italic">None</span>
        ) : (
          <div className="text-sm text-foreground">{value}</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoryForm({
  initialData,
  availableTags = [],
  availableCategories = [],
  onSubmit,
  onCancel,
  onChangeCover,
  submitLabel = "Submit",
  isLoading = false,
  currentCategoryId,
  coverPreview,
}: CategoryFormProps) {
  const [formStep, setFormStep] = useState<FormStep>("fields");
  const [formData, setFormData] = useState<CategoryFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  const validParentCategories = availableCategories.filter(
    (c) => c._id !== currentCategoryId,
  );

  const selectedParent = validParentCategories.find(
    (c) => c._id === formData.parentCategoryId,
  );

  const tagSuggestions = availableTags.filter(
    (t) =>
      !formData.tags?.includes(t) &&
      t.toLowerCase().includes(tagInput.toLowerCase()),
  );

  // Validation
  function validate(): boolean {
    const next: Partial<Record<keyof CategoryFormData, string>> = {};
    if (!formData.catName.trim()) next.catName = "Category name is required";
    else if (formData.catName.trim().length < 2)
      next.catName = "Must be at least 2 characters";
    if (!formData.catDesc.trim()) next.catDesc = "Description is required";
    else if (formData.catDesc.trim().length < 10)
      next.catDesc = "Must be at least 10 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinueToReview() {
    if (validate()) setFormStep("review");
  }

  async function handleSubmit() {
    if (formStep !== "review") return;
    await onSubmit(formData);
  }

  function handleFieldChange<K extends keyof CategoryFormData>(
    field: K,
    value: CategoryFormData[K],
  ) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "catName") next.slug = slugify(value as string);
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || formData.tags?.includes(trimmed)) return;
    handleFieldChange("tags", [...(formData.tags ?? []), trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    handleFieldChange(
      "tags",
      (formData.tags ?? []).filter((t) => t !== tag),
    );
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && formData.tags?.length) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  }

  // ---------------------------------------------------------------------------
  // Fields step
  // ---------------------------------------------------------------------------
  if (formStep === "fields") {
    return (
      <div className="space-y-5">
        {/* Category name */}
        <div className="space-y-1.5">
          <Label>
            Category Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.catName}
            onChange={(e) => handleFieldChange("catName", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="e.g. Home Cleaning"
            disabled={isLoading}
            className={cn(
              errors.catName &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.catName ? (
            <p className="text-xs text-destructive">{errors.catName}</p>
          ) : formData.slug ? (
            <p className="text-xs text-muted-foreground">
              Slug:{" "}
              <span className="font-mono text-foreground/70">
                {formData.slug}
              </span>
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={formData.catDesc}
            onChange={(e) => handleFieldChange("catDesc", e.target.value)}
            placeholder="Describe what services belong in this category"
            rows={4}
            disabled={isLoading}
            className={cn(
              "resize-none",
              errors.catDesc &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.catDesc ? (
            <p className="text-xs text-destructive">{errors.catDesc}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {formData.catDesc.length} characters
            </p>
          )}
        </div>

        {/* Parent category */}
        {validParentCategories.length > 0 && (
          <div className="space-y-1.5">
            <Label>
              Parent Category{" "}
              <span className="text-xs font-normal text-muted-foreground">
                optional
              </span>
            </Label>
            <Select
              value={formData.parentCategoryId ?? "none"}
              onValueChange={(val) =>
                handleFieldChange(
                  "parentCategoryId",
                  val === "none" ? null : val,
                )
              }
              disabled={isLoading}>
              <SelectTrigger className="w-full">
                <FolderTree className="mr-2 size-4 text-muted-foreground" />
                <SelectValue placeholder="None — top-level category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — top-level category</SelectItem>
                {validParentCategories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.catName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.parentCategoryId
                ? "Makes this a subcategory of the selected parent"
                : "This will be a top-level category"}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-1.5">
          <Label>
            Tags{" "}
            <span className="text-xs font-normal text-muted-foreground">
              optional
            </span>
          </Label>

          <div
            onClick={() => tagInputRef.current?.focus()}
            className={cn(
              "flex min-h-11 w-full flex-wrap gap-1.5 cursor-text rounded-md border border-input bg-background px-3 py-2",
              "transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring",
            )}>
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                <Tag className="size-3 shrink-0" />
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors">
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={
                formData.tags?.length ? "" : "Type a tag, press Enter..."
              }
              className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>

          {tagInput && tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tagSuggestions.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Tag className="size-3" />
                  {tag}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            or{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              ,
            </kbd>{" "}
            to add a tag
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          <Button
            type="button"
            onClick={handleContinueToReview}
            disabled={isLoading}
            className="flex-1 gap-2">
            Review & Submit
            <ArrowRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1">
            Back
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Review step
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Review before submitting
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Cover image — only shown when a cover exists or the caller provides a way to change it */}
        {(coverPreview || onChangeCover) && (
          coverPreview ? (
            <div className="relative w-full aspect-video border-b">
              <Image
                src={coverPreview.thumbnailUrl || coverPreview.url}
                alt="Category cover"
                fill
                className="object-cover"
                sizes="520px"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white drop-shadow">
                    Cover image
                  </span>
                </div>
                {onChangeCover && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 bg-black/30 px-2.5 text-xs text-white hover:bg-black/50 hover:text-white"
                    onClick={onChangeCover}>
                    Change
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-b px-4 py-3 text-sm text-muted-foreground">
              <ImageIcon className="size-4 shrink-0" />
              <span>No cover image</span>
              {onChangeCover && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="ml-auto h-auto p-0 text-xs"
                  onClick={onChangeCover}>
                  Add one
                </Button>
              )}
            </div>
          )
        )}

        {/* Details rows */}
        <div className="px-4">
          <ReviewRow
            icon={FileText}
            label="Name"
            value={
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{formData.catName}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  /{formData.slug}
                </span>
              </div>
            }
          />

          <ReviewRow
            icon={FileText}
            label="Description"
            value={
              <p className="leading-relaxed text-foreground/80">
                {formData.catDesc}
              </p>
            }
          />

          <ReviewRow
            icon={FolderTree}
            label="Parent Category"
            value={selectedParent?.catName}
            empty={!selectedParent}
          />

          <ReviewRow
            icon={Hash}
            label="Tags"
            value={
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {formData.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 text-xs">
                    <Tag className="size-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            }
            empty={!formData.tags?.length}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t pt-4">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 gap-2">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFormStep("fields")}
          disabled={isLoading}
          className="flex-1 gap-2">
          <ArrowLeft className="size-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
