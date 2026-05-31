"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, Loader2, RefreshCcw, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveCategories } from "@/hooks/services/categories/useServiceCategory";
import { useTagSuggestions } from "@/hooks/ai/useTagSuggestions";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface BasicInfoFormState {
  title: string;
  /** Auto-derived from title unless the user has manually edited it. */
  slug: string;
  /** Tracks whether the user has taken manual control of the slug field. */
  slugManuallyEdited: boolean;
  description: string;
  tags: string;
  categoryId: string;
}

export type BasicInfoValidationErrors = Partial<
  Record<"title" | "slug" | "description" | "categoryId" | "tags", string>
>;

export interface ServiceBasicInfoFormProps {
  value: BasicInfoFormState;
  onChange: (value: BasicInfoFormState) => void;
  errors?: BasicInfoValidationErrors;
}

// =============================================================================
// Helpers
// =============================================================================

export function initEmptyBasicInfo(): BasicInfoFormState {
  return {
    title: "",
    slug: "",
    slugManuallyEdited: false,
    description: "",
    tags: "",
    categoryId: "",
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
}

// =============================================================================
// Private sub-components
// =============================================================================

function FieldRow({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
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
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function TextInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  className,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <input
      id={id ?? name}
      name={name}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors",
        error
          ? "border-red-500 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-700",
        className,
      )}
    />
  );
}

// Category types inferred from the API shape at runtime
interface RuntimeCategory {
  _id: string;
  catName: string;
  catCoverId?: { thumbnailUrl?: string };
}

function asCat(raw: unknown): RuntimeCategory {
  return raw as RuntimeCategory;
}

// =============================================================================
// Main component
// =============================================================================

export function ServiceBasicInfoForm({
  value,
  onChange,
  errors = {},
}: ServiceBasicInfoFormProps) {
  // ── Internal UI state ─────────────────────────────────────────────────
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const { isLoading: aiLoading, isError: aiError, suggest } = useTagSuggestions();

  // ── Data ──────────────────────────────────────────────────────────────
  const {
    data: categories,
    isLoading: loadingCategories,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useActiveCategories();

  // ── Patch helper ──────────────────────────────────────────────────────
  function patch(partial: Partial<BasicInfoFormState>) {
    onChange({ ...value, ...partial });
  }

  // ── Title change — auto-derives slug unless manually edited ───────────
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    patch({
      title,
      slug: value.slugManuallyEdited ? value.slug : slugify(title),
    });
  }

  // ── Category selection ────────────────────────────────────────────────
  function handleCategorySelect(id: string) {
    patch({ categoryId: id });
    setCategoryPopoverOpen(false);
    setCategorySearch("");
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const selectedCategory = categories
    ?.map(asCat)
    .find((c) => c._id === value.categoryId);

  const filteredCategories = (categories ?? [])
    .map(asCat)
    .filter((c) =>
      c.catName.toLowerCase().includes(categorySearch.toLowerCase().trim()),
    );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Title */}
      <FieldRow id="title" label="Service Title" required error={errors.title}>
        <TextInput
          id="title"
          name="title"
          value={value.title}
          onChange={handleTitleChange}
          placeholder="e.g., Professional House Cleaning Service"
          error={errors.title}
        />
      </FieldRow>

      {/* Slug — hidden from UI, sent with the form payload */}
      <input type="hidden" name="slug" value={value.slug} readOnly />

      {/* Category */}
      <FieldRow
        id="categoryId"
        label="Category"
        required
        error={errors.categoryId}>
        {loadingCategories ? (
          <LoadingCategory />
        ) : categoriesError ? (
          <CategoryError onRetry={() => refetchCategories()} />
        ) : (
          <div className="flex items-center gap-2">
            <Popover
              open={categoryPopoverOpen}
              onOpenChange={(open) => {
                setCategoryPopoverOpen(open);
                if (!open) setCategorySearch("");
              }}>
              <PopoverTrigger asChild>
                <Button
                  id="categoryId"
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex-1 justify-between h-auto min-h-10 px-3 py-2 text-sm",
                    !value.categoryId && "text-muted-foreground",
                    errors.categoryId && "border-red-500",
                  )}>
                  {selectedCategory ? (
                    <div className="flex items-center gap-2 flex-1">
                      {selectedCategory.catCoverId?.thumbnailUrl && (
                        <div className="relative w-6 h-6 rounded overflow-hidden shrink-0">
                          <Image
                            src={selectedCategory.catCoverId.thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </div>
                      )}
                      <span className="truncate">
                        {selectedCategory.catName}
                      </span>
                    </div>
                  ) : (
                    "Select a category"
                  )}
                  <ChevronsUpDown className="ml-2 w-4 h-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                {/* Search */}
                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                  <input
                    autoFocus
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories…"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <ScrollArea className="h-64">
                  <div className="p-1">
                    {filteredCategories.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-center text-gray-400 dark:text-gray-500">
                        No categories match &quot;{categorySearch}&quot;
                      </p>
                    ) : (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => handleCategorySelect(cat._id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded px-2 py-2.5 text-sm hover:bg-accent transition-colors",
                            value.categoryId === cat._id && "bg-accent",
                          )}>
                          {cat.catCoverId?.thumbnailUrl && (
                            <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                              <Image
                                src={cat.catCoverId.thumbnailUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          )}
                          <span className="flex-1 text-left truncate">
                            {cat.catName}
                          </span>
                          <Check
                            className={cn(
                              "w-4 h-4 shrink-0",
                              value.categoryId === cat._id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => refetchCategories()}
              title="Refresh categories"
              className="shrink-0 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <RefreshCcw
                className={cn(
                  "w-4 h-4",
                  loadingCategories && "animate-spin text-teal-600",
                )}
              />
            </button>
          </div>
        )}
      </FieldRow>

      {/* Description */}
      <FieldRow id="description" label="Description" required error={errors.description}>
        <textarea
          id="description"
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={6}
          placeholder="Describe your service in detail…"
          className={cn(
            "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm",
            "focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition-colors",
            errors.description
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-700",
          )}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-600">{errors.description}</p>
          ) : (
            <p className="text-xs text-gray-500">Minimum 20 characters</p>
          )}
          <p className="text-xs text-gray-500">
            {value.description.length} / 5000
          </p>
        </div>
      </FieldRow>

      {/* Tags */}
      <FieldRow
        id="tags"
        label="Tags"
        hint="Comma-separated — e.g. cleaning, home, professional"
        error={errors.tags}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <TextInput
              id="tags"
              name="tags"
              value={value.tags}
              onChange={(e) => patch({ tags: e.target.value })}
              placeholder="cleaning, home, professional"
              className="pl-9"
            />
          </div>
          <button
            type="button"
            disabled={aiLoading || !value.title.trim()}
            onClick={async () => {
              const tags = await suggest(value.title, value.description);
              const existing = value.tags.split(",").map((t) => t.trim()).filter(Boolean);
              const newTags = tags.filter((t) => !existing.includes(t));
              if (newTags.length) patch({ tags: [...existing, ...newTags].join(", ") });
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${aiError ? "border-red-400 text-red-500 hover:border-red-500 hover:text-red-600" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400"}`}>
            {aiLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            {aiLoading ? "Suggesting…" : aiError ? "Failed — retry" : "Suggest"}
          </button>
        </div>
      </FieldRow>
    </div>
  );
}

// =============================================================================
// Inline loading / error states for the category picker
// =============================================================================

function LoadingCategory() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading categories…
    </div>
  );
}

function CategoryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-red-500 rounded-lg">
      <p className="text-sm text-red-600 dark:text-red-400">
        Failed to load categories.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline ml-3 shrink-0">
        <Loader2 className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
}
