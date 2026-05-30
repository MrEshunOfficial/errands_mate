"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { bookingAPI } from "@/lib/api/bookings/booking.api";
import {
  Booking,
  BookingStatus,
  BookingWithContext,
  SubmitProofRequestBody,
  RescheduleBookingRequestBody,
  CancelBookingRequestBody,
} from "@/types/booking.types";
import {
  CompletionAttempt,
  RespondToProofRequestBody,
  SubmitRebuttalRequestBody,
  AdminResolveDisputeRequestBody,
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
// SECTION 1 — CLIENT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useClientBookings(params?: {
  status?: BookingStatus;
  limit?: number;
  skip?: number;
}): QueryResult<Booking[]> {
  return useBaseQuery(
    () =>
      bookingAPI
        .getClientBookings(params)
        .then((res) => (res.bookings as Booking[]) ?? []),
    [params?.status, params?.limit, params?.skip],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — PROVIDER QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useProviderBookings(params?: {
  status?: BookingStatus;
  limit?: number;
  skip?: number;
}): QueryResult<Booking[]> {
  return useBaseQuery(
    () =>
      bookingAPI
        .getProviderBookings(params)
        .then((res) => (res.bookings as Booking[]) ?? []),
    [params?.status, params?.limit, params?.skip],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — SHARED QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useBookingById(
  bookingId: string | null | undefined,
): QueryResult<BookingWithContext> {
  return useBaseQuery(
    () =>
      bookingAPI
        .getBookingById(bookingId!)
        .then((res) => ({
          booking: res.booking as Booking,
          context: res.context,
        })),
    [bookingId],
    !!bookingId,
  );
}

export function useBookingAttempts(
  bookingId: string | null | undefined,
): QueryResult<CompletionAttempt[]> {
  return useBaseQuery(
    () =>
      bookingAPI
        .getBookingAttempts(bookingId!)
        .then((res) => res.attempts as CompletionAttempt[]),
    [bookingId],
    !!bookingId,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — CLIENT MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useRespondToProof(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; body: RespondToProofRequestBody }> {
  return useBaseMutation(
    ({ bookingId, body }) =>
      bookingAPI
        .respondToProof(bookingId, body)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

export function useCancelBooking(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; reason: string }> {
  return useBaseMutation(
    ({ bookingId, reason }) =>
      bookingAPI
        .cancelBooking(bookingId, { reason })
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — PROVIDER MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useStartService(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string }> {
  return useBaseMutation(
    ({ bookingId }) =>
      bookingAPI
        .startService(bookingId)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

export function useSubmitProof(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; body: SubmitProofRequestBody }> {
  return useBaseMutation(
    ({ bookingId, body }) =>
      bookingAPI
        .submitProof(bookingId, body)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

export function useSubmitRebuttal(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; body: SubmitRebuttalRequestBody }> {
  return useBaseMutation(
    ({ bookingId, body }) =>
      bookingAPI
        .submitRebuttal(bookingId, body)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — SHARED MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useRescheduleBooking(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; body: RescheduleBookingRequestBody }> {
  return useBaseMutation(
    ({ bookingId, body }) =>
      bookingAPI
        .rescheduleBooking(bookingId, body)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — ADMIN QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAdminAllBookings(params?: {
  status?: BookingStatus;
  clientId?: string;
  providerId?: string;
  limit?: number;
  skip?: number;
}): QueryResult<Booking[]> {
  return useBaseQuery(
    () =>
      bookingAPI
        .adminGetAllBookings(params)
        .then((res) => (res.bookings as Booking[]) ?? []),
    [
      params?.status,
      params?.clientId,
      params?.providerId,
      params?.limit,
      params?.skip,
    ],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — ADMIN MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAdminCancelBooking(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; reason: string }> {
  return useBaseMutation(
    ({ bookingId, reason }) =>
      bookingAPI
        .adminCancelBooking(bookingId, { reason })
        .then((res) => res.booking as Booking),
    callbacks,
  );
}

export function useAdminResolveDispute(
  callbacks?: MutationCallbacks<Booking>,
): MutationResult<Booking, { bookingId: string; body: AdminResolveDisputeRequestBody }> {
  return useBaseMutation(
    ({ bookingId, body }) =>
      bookingAPI
        .adminResolveDispute(bookingId, body)
        .then((res) => res.booking as Booking),
    callbacks,
  );
}
