"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { providerRequestAPI } from "@/lib/api/requests/provider-request.api";
import {
  ProviderRequest,
  RequestViewContext,
  CreateTaskMatchRequestBody,
  CreateTaskInterestRequestBody,
  CreateServiceBrowseRequestBody,
  RespondToProviderRequestBody,
  ProposeScheduleBody,
  NegotiateScheduleBody,
} from "@/types/provider.request.types";

export interface RequestWithContext {
  request: ProviderRequest;
  context?: RequestViewContext;
}

// ─── Shared Primitives ────────────────────────────────────────────────────────

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface QueryResult<T> extends QueryState<T> {
  refetch: () => void;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface MutationCallbacks<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export interface MutationResult<TData, TArgs> extends MutationState<TData> {
  mutate: (args: TArgs) => Promise<TData | null>;
  reset: () => void;
}

// ─── Internal: Base Query Hook ────────────────────────────────────────────────

function useBaseQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  enabled = true,
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  return { ...state, refetch };
}

// ─── Internal: Base Mutation Hook ─────────────────────────────────────────────

function useBaseMutation<TData, TArgs>(
  mutationFn: (args: TArgs) => Promise<TData>,
  callbacks?: MutationCallbacks<TData>,
): MutationResult<TData, TArgs> {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const mutationFnRef = useRef(mutationFn);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  });

  const mutate = useCallback(async (args: TArgs): Promise<TData | null> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await mutationFnRef.current(args);
      setState({ data, loading: false, error: null });
      callbacksRef.current?.onSuccess?.(data);
      return data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      callbacksRef.current?.onError?.(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — CLIENT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All requests sent by the authenticated client, sorted newest first.
 *
 * @example
 *   const { data: requests, loading, refetch } = useMyRequestsAsClient();
 */
export function useMyRequestsAsClient(): QueryResult<ProviderRequest[]> {
  return useBaseQuery(
    () =>
      providerRequestAPI
        .getMyRequestsAsClient()
        .then((res) => (res.providerRequests as ProviderRequest[]) ?? []),
    [],
  );
}

/**
 * Single request by ID. Skips the fetch when `requestId` is falsy.
 * Caller must be either the client or the provider on the request.
 *
 * @example
 *   const { data: request, loading } = useRequestById(requestId);
 */
export function useRequestById(
  requestId: string | null | undefined,
): QueryResult<RequestWithContext> {
  return useBaseQuery(
    () =>
      providerRequestAPI
        .getRequestById(requestId!)
        .then((res) => ({
          request: res.providerRequest as ProviderRequest,
          context: res.context,
        })),
    [requestId],
    !!requestId,
  );
}

/**
 * All provider requests spawned by a given task, newest first.
 * Skips when `taskId` is falsy.
 *
 * @example
 *   const { data: requests } = useRequestsByTask(taskId);
 */
export function useRequestsByTask(
  taskId: string | null | undefined,
): QueryResult<ProviderRequest[]> {
  return useBaseQuery(
    () =>
      providerRequestAPI
        .getRequestsByTask(taskId!)
        .then((res) => (res.providerRequests as ProviderRequest[]) ?? []),
    [taskId],
    !!taskId,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — PROVIDER QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All requests received by the authenticated provider across all statuses.
 * @role provider
 *
 * @example
 *   const { data: requests, loading } = useMyRequestsAsProvider();
 */
export function useMyRequestsAsProvider(): QueryResult<ProviderRequest[]> {
  return useBaseQuery(
    () =>
      providerRequestAPI.getMyRequestsAsProvider()
        .then((res) => (res.providerRequests as ProviderRequest[]) ?? []),
    [],
  );
}

/**
 * Only PENDING requests directed at the authenticated provider, oldest first.
 * Use this for the provider's action inbox and notification badge count.
 * @role provider
 *
 * @example
 *   const { data: pending } = useMyPendingRequests();
 *   pending?.length // → badge count
 */
export function useMyPendingRequests(): QueryResult<ProviderRequest[]> {
  return useBaseQuery(
    () =>
      providerRequestAPI
        .getMyPendingRequests()
        .then((res) => (res.providerRequests as ProviderRequest[]) ?? []),
    [],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — CLIENT MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Submit a request to a provider who appears in the task's matchedProviders list.
 * @role customer
 *
 * @example
 *   const { mutate: sendRequest, loading, error } = useCreateTaskMatchRequest({
 *     onSuccess: ({ providerRequest }) => router.push(`/requests/${providerRequest?._id}`),
 *   });
 *   await sendRequest({ providerId, taskId, source: RequestSource.TASK_MATCH, ... });
 */
export function useCreateTaskMatchRequest(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, CreateTaskMatchRequestBody> {
  return useBaseMutation(
    (body) =>
      providerRequestAPI
        .createTaskMatchRequest(body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

/**
 * Submit a request to a provider who expressed interest in the client's floating task.
 * @role customer
 *
 * @example
 *   const { mutate: sendRequest, loading } = useCreateTaskInterestRequest({
 *     onSuccess: () => toast.success("Request sent!"),
 *   });
 */
export function useCreateTaskInterestRequest(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, CreateTaskInterestRequestBody> {
  return useBaseMutation(
    (body) =>
      providerRequestAPI
        .createTaskInterestRequest(body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

/**
 * Submit a request to a provider after browsing their service listing.
 * No task required — the serviceId is the anchor.
 * @role customer
 *
 * @example
 *   const { mutate: sendRequest, loading, error } = useCreateServiceBrowseRequest({
 *     onSuccess: ({ _id }) => router.push(`/requests/${_id}`),
 *   });
 */
export function useCreateServiceBrowseRequest(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, CreateServiceBrowseRequestBody> {
  return useBaseMutation(
    (body) =>
      providerRequestAPI
        .createServiceBrowseRequest(body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

/**
 * Cancel a PENDING request the authenticated client owns.
 * Non-PENDING requests are rejected by the backend (409).
 * @role customer
 *
 * @example
 *   const { mutate: cancel, loading } = useCancelRequest({ onSuccess: refetch });
 *   await cancel({ requestId, reason: "Changed my mind" });
 */
export function useCancelRequest(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, { requestId: string; reason?: string }> {
  return useBaseMutation(
    ({ requestId, reason }) =>
      providerRequestAPI
        .cancelRequest(requestId, reason)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — PROVIDER MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Provider accepts or rejects a PENDING request directed at them.
 *
 * On ACCEPT: status → ACCEPTED, a Booking is created atomically.
 * On REJECT: status → REJECTED, no booking created.
 * @role provider
 *
 * @example
 *   const { mutate: respond, loading } = useRespondToRequest({ onSuccess: refetch });
 *   await respond({ requestId, body: { action: "accept", message: "See you Friday!" } });
 */
/**
 * Provider proposes a new schedule for a PENDING request.
 * Status → RESCHEDULED.
 * @role provider
 */
export function useProposeSchedule(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<
  ProviderRequest,
  { requestId: string; body: ProposeScheduleBody }
> {
  return useBaseMutation(
    ({ requestId, body }) =>
      providerRequestAPI
        .proposeSchedule(requestId, body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

/**
 * Client confirms a provider's proposed reschedule.
 * Status → ACCEPTED with the new schedule applied.
 * @role customer
 */
/**
 * Client declines a provider's proposed reschedule.
 * Status → PENDING so the provider can respond again.
 * @role customer
 */
export function useDeclineReschedule(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, { requestId: string }> {
  return useBaseMutation(
    ({ requestId }) =>
      providerRequestAPI
        .declineReschedule(requestId)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

export function useConfirmReschedule(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, { requestId: string }> {
  return useBaseMutation(
    ({ requestId }) =>
      providerRequestAPI
        .confirmReschedule(requestId)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

/**
 * Client counter-proposes their own schedule when the provider has proposed a
 * reschedule. Status → PENDING so the provider can respond again.
 * @role customer
 */
export function useNegotiateSchedule(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<ProviderRequest, { requestId: string; body: NegotiateScheduleBody }> {
  return useBaseMutation(
    ({ requestId, body }) =>
      providerRequestAPI
        .negotiateSchedule(requestId, body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

export function useRespondToRequest(
  callbacks?: MutationCallbacks<ProviderRequest>,
): MutationResult<
  ProviderRequest,
  { requestId: string; body: RespondToProviderRequestBody }
> {
  return useBaseMutation(
    ({ requestId, body }) =>
      providerRequestAPI
        .respondToRequest(requestId, body)
        .then((res) => res.providerRequest as ProviderRequest),
    callbacks,
  );
}

// ─── Admin: All Requests ──────────────────────────────────────────────────────

export interface AdminRequestsResponse {
  requests: ProviderRequest[];
  total: number;
}

export function useProviderRequests(params?: {
  status?: string;
  limit?: number;
  skip?: number;
}): QueryResult<AdminRequestsResponse> {
  const key = JSON.stringify(params);
  return useBaseQuery(
    (_signal) =>
      providerRequestAPI
        .adminGetAllRequests(params)
        .then((res) => ({
          requests: (res.providerRequests ?? []) as ProviderRequest[],
          total: res.providerRequests?.length ?? 0,
        })),
    [key],
  );
}
