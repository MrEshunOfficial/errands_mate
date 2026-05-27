import {
  PaginatedResponse,
  serviceAPI,
  SearchServicesParams,
  GetServicesByCategoryParams,
  GetServicesByProviderParams,
  AutoActivationStatus,
  CreateServicePayload,
  UpdateServicePayload,
  UpdateCoverImagePayload,
  GetAllServicesParams,
  ServiceStats,
  RejectServicePayload,
  BulkUpdatePayload,
  PaginationParams, // ✅ Fix 1: was used throughout but never imported
} from "@/lib/api/services/service.api";
import {
  ServiceWithVirtuals,
  ServiceSearchResult,
} from "@/types/services/service.types";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  DependencyList,
} from "react";
import { useAuth } from "../auth/useAuth";

// =============================================================================
// Primitives
// =============================================================================

export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface QueryResult<T> extends QueryState<T> {
  /** Re-run the fetch manually */
  refetch: () => void;
}

export interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface MutationResult<
  TData,
  TArgs extends unknown[],
> extends MutationState<TData> {
  /** Fire-and-forget: errors are captured in state, not thrown */
  mutate: (...args: TArgs) => void;
  /** Awaitable version — throws on error */
  mutateAsync: (...args: TArgs) => Promise<TData>;
  /** Reset state back to initial */
  reset: () => void;
}

// =============================================================================
// Internal base hooks
// =============================================================================

/**
 * Generic auto-fetching hook.
 *
 * @param fetcher  Async function that returns the data
 * @param deps     Re-fetch whenever any of these change (stable reference or primitives)
 * @param enabled  Set to `false` to skip the fetch (e.g. when a required param is absent)
 */
function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  enabled = true,
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    isError: false,
    error: null,
  });

  // Keep a stable reference to the fetcher so the effect dep array stays clean
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const runQuery = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: null,
    }));
    try {
      const data = await fetcherRef.current();
      setState({ data, isLoading: false, isError: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, isLoading: false, isError: true, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, isLoading: false, isError: false, error: null });
      return;
    }
    runQuery();
  }, [enabled, runQuery]);

  return { ...state, refetch: runQuery };
}

/**
 * Generic mutation hook — wraps a call that only fires on demand.
 */
function useMutation<TData, TArgs extends unknown[]>(
  mutationFn: (...args: TArgs) => Promise<TData>,
): MutationResult<TData, TArgs> {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  const mutationFnRef = useRef(mutationFn);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  });

  const mutateAsync = useCallback(async (...args: TArgs): Promise<TData> => {
    setState({ data: null, isLoading: true, isError: false, error: null });
    try {
      const data = await mutationFnRef.current(...args);
      setState({ data, isLoading: false, isError: false, error: null });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, isLoading: false, isError: true, error });
      throw error;
    }
  }, []);

  const mutate = useCallback(
    (...args: TArgs): void => {
      mutateAsync(...args).catch(() => {
        /* errors are captured in state */
      });
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, isError: false, error: null });
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

// =============================================================================
// Public browsing hooks
// =============================================================================

/**
 * Auto-fetches a paginated list of active (public) services.
 *
 * @example
 * const { data, isLoading, refetch } = useActiveServices({ page: 1, limit: 20 });
 */
export function useActiveServices(params?: PaginationParams) {
  return useQuery<PaginatedResponse<ServiceWithVirtuals>>(
    () => serviceAPI.getActiveServices(params),
    [params?.page, params?.limit],
  );
}

/**
 * Auto-fetches services matching the given search/filter params.
 * Pass `enabled: false` to suppress the initial fetch until the user
 * has typed a query.
 *
 * @example
 * const { data } = useSearchServices({ q: "photography", minPrice: 50 });
 */
export function useSearchServices(
  params?: SearchServicesParams,
  enabled = true,
) {
  return useQuery<PaginatedResponse<ServiceSearchResult>>(
    () => serviceAPI.searchServices(params),
    [
      params?.q,
      params?.categoryId,
      params?.minPrice,
      params?.maxPrice,
      params?.pricingModel,
      params?.currency,
      params?.providerId,
      params?.page,
      params?.limit,
    ],
    enabled,
  );
}

/**
 * Auto-fetches a single service by its URL slug.
 * Skips the fetch when `slug` is falsy.
 *
 * @example
 * const { data: service } = useServiceBySlug("wedding-photography", true);
 */
export function useServiceBySlug(slug: string | undefined, details?: boolean) {
  return useQuery<ServiceWithVirtuals>(
    () => serviceAPI.getServiceBySlug(slug!, details),
    [slug, details],
    Boolean(slug),
  );
}

/**
 * Auto-fetches services belonging to a category.
 * Skips when `categoryId` is falsy.
 *
 * @example
 * const { data } = useServicesByCategory("cat_123", { page: 1, limit: 10 });
 */
export function useServicesByCategory(
  categoryId: string | undefined,
  params?: GetServicesByCategoryParams,
) {
  return useQuery<PaginatedResponse<ServiceWithVirtuals>>(
    () => serviceAPI.getServicesByCategory(categoryId!, params),
    [categoryId, params?.page, params?.limit],
    Boolean(categoryId),
  );
}

/**
 * Auto-fetches a single service by id.
 * Skips when `id` is falsy.
 *
 * @example
 * const { data: service } = useServiceById("svc_123");
 */
export function useServiceById(id: string | undefined, details?: boolean) {
  return useQuery<ServiceWithVirtuals>(
    () => serviceAPI.getServiceById(id!, details),
    [id, details],
    Boolean(id),
  );
}

/**
 * Auto-fetches the fully-resolved service (all virtuals populated).
 * Skips when `id` is falsy.
 *
 * @example
 * const { data } = useCompleteService("svc_123");
 */
export function useCompleteService(id: string | undefined) {
  return useQuery<ServiceWithVirtuals>(
    () => serviceAPI.getCompleteService(id!),
    [id],
    Boolean(id),
  );
}

// =============================================================================
// Public utility checks
// =============================================================================

/**
 * Auto-checks whether a service with the given id exists.
 * Skips when `id` is falsy.
 *
 * @example
 * const { data } = useServiceExists("svc_123");
 * if (data?.exists) { ... }
 */
export function useServiceExists(id: string | undefined) {
  return useQuery<{ exists: boolean }>(
    () => serviceAPI.serviceExists(id!),
    [id],
    Boolean(id),
  );
}

/**
 * Auto-checks whether a slug is available.
 * Skips when `slug` is falsy.
 *
 * @example
 * const { data } = useSlugAvailable("my-new-service", "svc_exclude_123");
 * if (data?.available) { ... }
 */
export function useSlugAvailable(slug: string | undefined, excludeId?: string) {
  return useQuery<{ available: boolean }>(
    () => serviceAPI.isSlugAvailable(slug!, excludeId),
    [slug, excludeId],
    Boolean(slug),
  );
}

// =============================================================================
// Authenticated — provider query hooks
// =============================================================================

/**
 * Auto-fetches all services belonging to a provider.
 * Skips when `providerId` is falsy.
 *
 * @example
 * const { data } = useServicesByProvider("usr_123", { includeInactive: true });
 */
export function useServicesByProvider(params?: GetServicesByProviderParams) {
  const { isAuthenticated } = useAuth(); // or however you expose auth state

  return useQuery<PaginatedResponse<ServiceWithVirtuals>>(
    () => serviceAPI.getServicesByProvider(params),
    [params?.page, params?.limit, params?.includeInactive],
    isAuthenticated,
  );
}

/**
 * Auto-fetches the scheduled-activation status for a service.
 * Skips when `id` is falsy.
 *
 * @example
 * const { data } = useAutoActivationStatus("svc_123");
 */
export function useAutoActivationStatus(id: string | undefined) {
  return useQuery<AutoActivationStatus>(
    () => serviceAPI.getAutoActivationStatus(id!),
    [id],
    Boolean(id),
  );
}

// =============================================================================
// Authenticated — provider mutation hooks
// =============================================================================

/**
 * Creates a new service listing.
 *
 * @example
 * const { mutateAsync, isLoading } = useCreateService();
 * await mutateAsync({ title: "...", slug: "...", ... });
 */
export function useCreateService() {
  return useMutation<ServiceWithVirtuals, [CreateServicePayload]>((payload) =>
    serviceAPI.createService(payload),
  );
}

/**
 * Fully updates a service by id.
 *
 * @example
 * const { mutate, isLoading } = useUpdateService();
 * mutate("svc_123", { title: "New title" });
 */
export function useUpdateService() {
  return useMutation<ServiceWithVirtuals, [string, UpdateServicePayload]>(
    (id, payload) => serviceAPI.updateService(id, payload),
  );
}

/**
 * Soft-deletes a service.
 *
 * @example
 * const { mutateAsync } = useDeleteService();
 * await mutateAsync("svc_123");
 */
export function useDeleteService() {
  return useMutation<{ success: boolean }, [string]>((id) =>
    serviceAPI.deleteService(id),
  );
}

/**
 * Toggles private/public visibility on a service.
 *
 * @example
 * const { mutate } = useTogglePrivateStatus();
 * mutate("svc_123");
 */
export function useTogglePrivateStatus() {
  return useMutation<ServiceWithVirtuals, [string]>((id) =>
    serviceAPI.togglePrivateStatus(id),
  );
}

/**
 * Replaces the cover image of a service.
 *
 * @example
 * const { mutateAsync } = useUpdateCoverImage();
 * await mutateAsync("svc_123", { coverImageId: "img_456" });
 */
export function useUpdateCoverImage() {
  return useMutation<ServiceWithVirtuals, [string, UpdateCoverImagePayload]>(
    (id, payload) => serviceAPI.updateCoverImage(id, payload),
  );
}

/**
 * Removes the cover image from a service.
 *
 * @example
 * const { mutate } = useRemoveCoverImage();
 * mutate("svc_123");
 */
export function useRemoveCoverImage() {
  return useMutation<ServiceWithVirtuals, [string]>((id) =>
    serviceAPI.removeCoverImage(id),
  );
}

// =============================================================================
// Admin query hooks
// =============================================================================

/**
 * Auto-fetches all services (including soft-deleted when requested).
 * Admin only.
 *
 * @example
 * const { data } = useAllServices({ page: 1, limit: 50, includeDeleted: true });
 */
export function useAllServices(params?: GetAllServicesParams) {
  return useQuery<PaginatedResponse<ServiceWithVirtuals>>(
    () => serviceAPI.getAllServices(params),
    [params?.page, params?.limit, params?.includeDeleted],
  );
}

/**
 * Auto-fetches services awaiting admin approval.
 * Admin only.
 *
 * @example
 * const { data } = usePendingServices({ page: 1, limit: 20 });
 */
export function usePendingServices(params?: PaginationParams) {
  return useQuery<PaginatedResponse<ServiceWithVirtuals>>(
    () => serviceAPI.getPendingServices(params),
    [params?.page, params?.limit],
  );
}

/**
 * Auto-fetches platform service stats.
 * Pass `providerId` to scope to a single provider.
 * Admin only.
 *
 * @example
 * const { data: stats } = useServiceStats();
 * const { data: providerStats } = useServiceStats("usr_123");
 */
export function useServiceStats(providerId?: string) {
  return useQuery<ServiceStats>(
    () => serviceAPI.getServiceStats(providerId),
    [providerId],
  );
}

// =============================================================================
// Admin mutation hooks
// =============================================================================

/**
 * Approves a pending service. Admin only.
 *
 * @example
 * const { mutateAsync, isLoading } = useApproveService();
 * await mutateAsync("svc_123");
 */
export function useApproveService() {
  return useMutation<ServiceWithVirtuals, [string]>((id) =>
    serviceAPI.approveService(id),
  );
}

/**
 * Rejects a pending service with a reason. Admin only.
 *
 * @example
 * const { mutate } = useRejectService();
 * mutate("svc_123", { reason: "Content policy violation" });
 */
export function useRejectService() {
  return useMutation<ServiceWithVirtuals, [string, RejectServicePayload]>(
    (id, payload) => serviceAPI.rejectService(id, payload),
  );
}

/**
 * Restores a soft-deleted service. Admin only.
 *
 * @example
 * const { mutateAsync } = useRestoreService();
 * await mutateAsync("svc_123");
 */
export function useRestoreService() {
  return useMutation<ServiceWithVirtuals, [string]>((id) =>
    serviceAPI.restoreService(id),
  );
}

/**
 * Permanently removes a service from the database. Super-admin only.
 *
 * @example
 * const { mutateAsync } = usePermanentlyDeleteService();
 * await mutateAsync("svc_123");
 */
export function usePermanentlyDeleteService() {
  return useMutation<{ success: boolean }, [string]>((id) =>
    serviceAPI.permanentlyDeleteService(id),
  );
}

/**
 * Applies a partial update across multiple services in one request.
 * Admin only.
 *
 * @example
 * const { mutateAsync } = useBulkUpdateServices();
 * await mutateAsync({ serviceIds: ["svc_1", "svc_2"], updates: { isActive: false } });
 */
export function useBulkUpdateServices() {
  return useMutation<{ modifiedCount: number }, [BulkUpdatePayload]>(
    (payload) => serviceAPI.bulkUpdateServices(payload),
  );
}

/**
 * Manually triggers the scheduled-activation job.
 * Useful for admin dashboards and debugging.
 * Admin only.
 *
 * @example
 * const { mutate, data } = useProcessScheduledActivations();
 * // data?.processed === number of services activated
 */
export function useProcessScheduledActivations() {
  return useMutation<{ processed: number }, []>(() =>
    serviceAPI.processScheduledActivations(),
  );
}
