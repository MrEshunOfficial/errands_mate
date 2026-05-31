import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  UpdateCategoryImagePayload,
  BulkUpdateCategoryItem,
  GetAllCategoriesParams,
  SearchCategoriesParams,
  CategoryStats,
  SlugAvailabilityResult,
  CategoryExistsResult,
  CategoryImageStatus,
  BulkUpdateResult,
  RepairCoverLinksResult,
  categoryAPI,
} from "@/lib/api/services/categories/service.category.api";
import {
  Category,
  CategoryObject,
  CategorySuggestion,
  CategoryWithServices,
} from "@/types/services/categories/service.category.types";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

// Re-export every public type so consumers only ever import from this hook
// file — never directly from the API or types layers.
export type {
  // Payloads
  CreateCategoryPayload,
  UpdateCategoryPayload,
  UpdateCategoryImagePayload,
  BulkUpdateCategoryItem,
  GetAllCategoriesParams,
  SearchCategoriesParams,
  // Responses
  CategoryStats,
  SlugAvailabilityResult,
  CategoryExistsResult,
  CategoryImageStatus,
  BulkUpdateResult,
  RepairCoverLinksResult,
  // Entities
  Category,
  CategoryObject,
  CategorySuggestion,
  CategoryWithServices,
};

// =============================================================================
// Shared state primitives
// =============================================================================

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetched: boolean;
}

interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
}

type QueryAction<T> =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: T }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "RESET" };

type MutationAction<T> =
  | { type: "MUTATE_START" }
  | { type: "MUTATE_SUCCESS"; payload: T }
  | { type: "MUTATE_ERROR"; payload: Error }
  | { type: "RESET" };

function queryReducer<T>(
  state: QueryState<T>,
  action: QueryAction<T>,
): QueryState<T> {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, isError: false, error: null };
    case "FETCH_SUCCESS":
      return {
        data: action.payload,
        isLoading: false,
        isError: false,
        error: null,
        isFetched: true,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        isError: true,
        error: action.payload,
        isFetched: true,
      };
    case "RESET":
      return initialQueryState();
    default:
      return state;
  }
}

function mutationReducer<T>(
  state: MutationState<T>,
  action: MutationAction<T>,
): MutationState<T> {
  switch (action.type) {
    case "MUTATE_START":
      return {
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
      };
    case "MUTATE_SUCCESS":
      return {
        data: action.payload,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      };
    case "MUTATE_ERROR":
      return {
        data: null,
        isLoading: false,
        isError: true,
        error: action.payload,
        isSuccess: false,
      };
    case "RESET":
      return initialMutationState();
    default:
      return state;
  }
}

function initialQueryState<T>(): QueryState<T> {
  return {
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isFetched: false,
  };
}

function initialMutationState<T>(): MutationState<T> {
  return {
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
  };
}

// =============================================================================
// Shared hook options
// =============================================================================

interface QueryOptions<T> {
  /**
   * When false the hook skips the initial fetch and all refetches triggered
   * by dependency changes. Useful for conditional fetching (e.g. waiting for
   * an id to be defined). Defaults to true.
   */
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// =============================================================================
// Internal: useQuery — powers all auto-fetch hooks
// =============================================================================

function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: QueryOptions<T> = {},
) {
  const { enabled = true, onSuccess, onError } = options;

  const [state, dispatch] = useReducer(
    queryReducer as (s: QueryState<T>, a: QueryAction<T>) => QueryState<T>,
    undefined,
    initialQueryState<T>,
  );

  // Stable refs so callbacks never force a re-fetch when they change identity
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const execute = useCallback(async (signal: AbortSignal) => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetcher(signal);
      if (signal.aborted) return;
      dispatch({ type: "FETCH_SUCCESS", payload: data });
      onSuccessRef.current?.(data);
    } catch (err) {
      if (signal.aborted) return;
      const error = err instanceof Error ? err : new Error(String(err));
      dispatch({ type: "FETCH_ERROR", payload: error });
      onErrorRef.current?.(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    execute(controller.signal);
    return () => controller.abort();
  }, [enabled, execute]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    execute(controller.signal);
  }, [execute]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...state, refetch, reset };
}

// =============================================================================
// Internal: useMutation — powers all write hooks
// =============================================================================

function useMutation<TArgs, TResult>(
  mutator: (args: TArgs) => Promise<TResult>,
  options: MutationOptions<TResult> = {},
) {
  const { onSuccess, onError } = options;

  const [state, dispatch] = useReducer(
    mutationReducer as (
      s: MutationState<TResult>,
      a: MutationAction<TResult>,
    ) => MutationState<TResult>,
    undefined,
    initialMutationState<TResult>,
  );

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const mutate = useCallback(
    async (args: TArgs) => {
      dispatch({ type: "MUTATE_START" });
      try {
        const data = await mutator(args);
        dispatch({ type: "MUTATE_SUCCESS", payload: data });
        onSuccessRef.current?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        dispatch({ type: "MUTATE_ERROR", payload: error });
        onErrorRef.current?.(error);
        throw error;
      }
    },
    [mutator],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...state, mutate, reset };
}

// =============================================================================
// PUBLIC — Search & filtering
// =============================================================================

/**
 * Auto-fetches when `params` changes.
 * Set `enabled: false` to skip the initial fetch (e.g. while the user is
 * still typing). Pair with a debounced value of `params.q` in practice.
 */
export function useSearchCategories(
  params: SearchCategoriesParams,
  options?: QueryOptions<Category[]>,
) {
  return useQuery<Category[]>(
    () => categoryAPI.searchCategories(params),
    [params.q, params.page, params.limit, params.isActive],
    options,
  );
}

/**
 * Debounced category suggestions driven by a task title string.
 * Fires only when title.length >= 3; returns [] immediately otherwise.
 */
export function useSuggestCategory(title: string, limit = 3) {
  const [debouncedTitle, setDebouncedTitle] = useState("");

  useEffect(() => {
    if (title.length < 3) {
      setDebouncedTitle("");
      return;
    }
    const timer = setTimeout(() => setDebouncedTitle(title), 300);
    return () => clearTimeout(timer);
  }, [title]);

  return useQuery<CategorySuggestion[]>(
    () => categoryAPI.suggestCategory(debouncedTitle, limit),
    [debouncedTitle, limit],
    { enabled: debouncedTitle.length >= 3 },
  );
}

/** Auto-fetches the full distinct tag list once on mount. */
export function useAllTags(options?: QueryOptions<string[]>) {
  return useQuery<string[]>(() => categoryAPI.getAllTags(), [], options);
}

/**
 * Auto-fetches categories for the given `tag`.
 * Skips the request when `tag` is empty/undefined — pass `enabled: false`
 * for full manual control.
 */
export function useCategoriesByTag(
  tag: string,
  options?: QueryOptions<Category[]>,
) {
  return useQuery<Category[]>(
    () => categoryAPI.getCategoriesByTag(tag),
    [tag],
    { enabled: Boolean(tag), ...options },
  );
}

// =============================================================================
// PUBLIC — Hierarchy & structure
// =============================================================================

/** Auto-fetches the full parent → children category tree on mount. */
export function useCategoryHierarchy(options?: QueryOptions<CategoryObject[]>) {
  return useQuery<CategoryObject[]>(
    () => categoryAPI.getCategoryHierarchy(),
    [],
    options,
  );
}

/** Auto-fetches only root-level (parentless) categories on mount. */
export function useTopLevelCategories(options?: QueryOptions<Category[]>) {
  return useQuery<Category[]>(
    () => categoryAPI.getTopLevelCategories(),
    [],
    options,
  );
}

/** Auto-fetches all categories where isActive === true on mount. */
export function useActiveCategories(options?: QueryOptions<Category[]>) {
  return useQuery<Category[]>(
    () => categoryAPI.getActiveCategories(),
    [],
    options,
  );
}

// =============================================================================
// PUBLIC — Single category
// =============================================================================

/**
 * Auto-fetches a category by slug.
 * Skips when `slug` is empty — pass `enabled: false` for full manual control.
 */
export function useCategoryBySlug(
  slug: string,
  options?: QueryOptions<Category>,
) {
  return useQuery<Category>(() => categoryAPI.getCategoryBySlug(slug), [slug], {
    enabled: Boolean(slug),
    ...options,
  });
}

/**
 * Auto-fetches a category by _id.
 * Skips when `id` is empty.
 */
export function useCategoryById(id: string, options?: QueryOptions<Category>) {
  return useQuery<Category>(() => categoryAPI.getCategoryById(id), [id], {
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Auto-fetches a category with its services, popular services,
 * and resolved subcategories in a single call.
 * Skips when `id` is empty.
 */
export function useCompleteCategory(
  id: string,
  options?: QueryOptions<CategoryWithServices>,
) {
  return useQuery<CategoryWithServices>(
    () => categoryAPI.getCompleteCategory(id),
    [id],
    { enabled: Boolean(id), ...options },
  );
}

/**
 * Auto-fetches the immediate children of a category.
 * Skips when `id` is empty.
 */
export function useSubcategories(
  id: string,
  options?: QueryOptions<Category[]>,
) {
  return useQuery<Category[]>(() => categoryAPI.getSubcategories(id), [id], {
    enabled: Boolean(id),
    ...options,
  });
}

// =============================================================================
// ADMIN — Read
// =============================================================================

/**
 * Auto-fetches aggregate category counts (total, active, inactive, deleted).
 * Admin only.
 */
export function useCategoryStats(options?: QueryOptions<CategoryStats>) {
  return useQuery<CategoryStats>(
    () => categoryAPI.getCategoryStats(),
    [],
    options,
  );
}

/**
 * Auto-fetches slug availability when `slug` changes.
 * Skips when `slug` is empty. Admin only.
 *
 * Tip: wrap `slug` in a debounce before passing it in from a form field.
 */
export function useSlugAvailability(
  slug: string,
  options?: QueryOptions<SlugAvailabilityResult>,
) {
  return useQuery<SlugAvailabilityResult>(
    () => categoryAPI.checkSlugAvailability(slug),
    [slug],
    { enabled: Boolean(slug), ...options },
  );
}

/**
 * Auto-fetches every category including soft-deleted ones.
 * Re-fetches when `params` changes. Admin only.
 */
export function useAllCategories(
  params?: GetAllCategoriesParams,
  options?: QueryOptions<Category[]>,
) {
  return useQuery<Category[]>(
    () => categoryAPI.getAllCategories(params),
    [params?.includeDeleted, params?.page, params?.limit],
    options,
  );
}

/**
 * Auto-fetches category existence for the given `id`. Admin only.
 * Skips when `id` is empty.
 */
export function useCategoryExists(
  id: string,
  options?: QueryOptions<CategoryExistsResult>,
) {
  return useQuery<CategoryExistsResult>(
    () => categoryAPI.checkCategoryExists(id),
    [id],
    { enabled: Boolean(id), ...options },
  );
}

/**
 * Auto-fetches the cover-image resolution status for a category.
 * Skips when `id` is empty. Admin only.
 */
export function useCategoryImageStatus(
  id: string,
  options?: QueryOptions<CategoryImageStatus>,
) {
  return useQuery<CategoryImageStatus>(
    () => categoryAPI.getCategoryImageStatus(id),
    [id],
    { enabled: Boolean(id), ...options },
  );
}

// =============================================================================
// ADMIN — Write mutations
// =============================================================================

/** Returns a `mutate(payload)` function to create a new category. */
export function useCreateCategory(options?: MutationOptions<Category>) {
  return useMutation<CreateCategoryPayload, Category>(
    (payload) => categoryAPI.createCategory(payload),
    options,
  );
}

/** Returns a `mutate({ id, payload })` function to update a category. */
export function useUpdateCategory(options?: MutationOptions<Category>) {
  return useMutation<{ id: string; payload: UpdateCategoryPayload }, Category>(
    ({ id, payload }) => categoryAPI.updateCategory(id, payload),
    options,
  );
}

/** Returns a `mutate({ id, payload })` function to swap the cover image. */
export function useUpdateCategoryImage(options?: MutationOptions<Category>) {
  return useMutation<
    { id: string; payload: UpdateCategoryImagePayload },
    Category
  >(({ id, payload }) => categoryAPI.updateCoverImage(id, payload), options);
}

/** Returns a `mutate(id)` function to flip the isActive flag. */
export function useToggleActiveStatus(options?: MutationOptions<Category>) {
  return useMutation<string, Category>(
    (id) => categoryAPI.toggleActiveStatus(id),
    options,
  );
}

/** Returns a `mutate(items)` function to bulk-update multiple categories. */
export function useBulkUpdateCategories(
  options?: MutationOptions<BulkUpdateResult>,
) {
  return useMutation<BulkUpdateCategoryItem[], BulkUpdateResult>(
    (items) => categoryAPI.bulkUpdateCategories(items),
    options,
  );
}

// =============================================================================
// ADMIN — Delete & restore mutations
// =============================================================================

/** Returns a `mutate(id)` function to soft-delete a category. */
export function useDeleteCategory(options?: MutationOptions<Category>) {
  return useMutation<string, Category>(
    (id) => categoryAPI.deleteCategory(id),
    options,
  );
}

/** Returns a `mutate(id)` function to restore a soft-deleted category. */
export function useRestoreCategory(options?: MutationOptions<Category>) {
  return useMutation<string, Category>(
    (id) => categoryAPI.restoreCategory(id),
    options,
  );
}

/** Returns a `mutate(id)` function to permanently delete a category. */
export function usePermanentlyDeleteCategory(
  options?: MutationOptions<{ deleted: boolean }>,
) {
  return useMutation<string, { deleted: boolean }>(
    (id) => categoryAPI.permanentlyDeleteCategory(id),
    options,
  );
}

// =============================================================================
// ADMIN — Maintenance mutations
// =============================================================================

/** Returns a `mutate()` function to trigger a cover-link repair scan. */
export function useRepairCoverLinks(
  options?: MutationOptions<RepairCoverLinksResult>,
) {
  return useMutation<void, RepairCoverLinksResult>(
    () => categoryAPI.repairCoverLinks(),
    options,
  );
}

/**
 * Imperative slug-availability check — useful inside form validation logic
 * where you want to call `mutate(slug)` on demand rather than auto-fetching.
 * For reactive auto-fetch behaviour use `useSlugAvailability` instead.
 */
export function useCheckSlugAvailability(
  options?: MutationOptions<SlugAvailabilityResult>,
) {
  return useMutation<string, SlugAvailabilityResult>(
    (slug) => categoryAPI.checkSlugAvailability(slug),
    options,
  );
}

/**
 * Imperative existence check — useful for one-off checks inside handlers.
 * For reactive auto-fetch behaviour use `useCategoryExists` instead.
 */
export function useCheckCategoryExists(
  options?: MutationOptions<CategoryExistsResult>,
) {
  return useMutation<string, CategoryExistsResult>(
    (id) => categoryAPI.checkCategoryExists(id),
    options,
  );
}

/** Returns a `mutate(file)` function to bulk-import categories from a .txt or .docx file. */
export function useBulkImportCategories(options?: MutationOptions<unknown>) {
  return useMutation<File, unknown>(
    (file) => categoryAPI.bulkImportCategories(file),
    options,
  );
}
