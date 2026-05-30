"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { completionAttemptAPI } from "@/lib/api/bookings/completion-attempt.api";
import {
  CompletionAttempt,
  AdminResolveDisputeRequestBody,
  CompletionAttemptResponse,
} from "@/types/completion-attempt.types";

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

export interface MutationCallbacks<T> {
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

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const activeCallRef = useRef(0);

  const mutate = useCallback(async (args: TArgs): Promise<TData | null> => {
    const callId = ++activeCallRef.current;
    setState({ data: null, loading: true, error: null });
    try {
      const data = await mutationFnRef.current(args);
      if (mountedRef.current && activeCallRef.current === callId) {
        setState({ data, loading: false, error: null });
        callbacksRef.current?.onSuccess?.(data);
      }
      return data;
    } catch (err: unknown) {
      if (mountedRef.current && activeCallRef.current === callId) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        callbacksRef.current?.onError?.(message);
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    activeCallRef.current++;
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SHARED QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAttemptById(
  attemptId: string | null | undefined,
): QueryResult<CompletionAttempt> {
  return useBaseQuery(
    () =>
      completionAttemptAPI
        .getAttemptById(attemptId!)
        .then((res) => res.attempt as CompletionAttempt),
    [attemptId],
    !!attemptId,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — PROVIDER MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useInitiateAttempt(
  callbacks?: MutationCallbacks<CompletionAttempt>,
): MutationResult<CompletionAttempt, { bookingId: string }> {
  return useBaseMutation(
    ({ bookingId }) =>
      completionAttemptAPI
        .initiateAttempt(bookingId)
        .then((res) => res.attempt as CompletionAttempt),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — ADMIN QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAdminOpenDisputes(): QueryResult<CompletionAttempt[]> {
  return useBaseQuery(
    () =>
      completionAttemptAPI
        .adminGetOpenDisputes()
        .then((res) => (res.attempts as CompletionAttempt[]) ?? []),
    [],
  );
}

export function useAdminPendingRebuttals(): QueryResult<CompletionAttempt[]> {
  return useBaseQuery(
    () =>
      completionAttemptAPI
        .adminGetPendingRebuttals()
        .then((res) => (res.attempts as CompletionAttempt[]) ?? []),
    [],
  );
}

export function useAdminResolveDispute(
  callbacks?: MutationCallbacks<CompletionAttemptResponse>,
): MutationResult<CompletionAttemptResponse, { attemptId: string } & AdminResolveDisputeRequestBody> {
  return useBaseMutation(
    ({ attemptId, outcome, notes }) =>
      completionAttemptAPI.adminResolveDispute(attemptId, { outcome, notes }),
    callbacks,
  );
}
