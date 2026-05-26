"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { bookingAPI } from "@/lib/api/bookings/booking.api";
import { AdminResolutionOutcome } from "@/types/completion-attempt.types";
import type {
  Booking,
  BookingListParams,
  BookingListResponse,
  BookingDetailResponse,
  BookingStats,
  BookingStatus,
  ValidateBookingInput,
  ResolveDisputeInput,
  RescheduleBookingInput,
  PaymentStatus,
} from "@/types/booking/booking.types";

// ─── Shared Primitives ────────────────────────────────────────────────────────

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface QueryOptions {
  enabled?: boolean;
  pollInterval?: number;
}

interface QueryResult<T> extends QueryState<T> {
  refetch: () => void;
}

// ─── Internal: Base Query Hook ────────────────────────────────────────────────

function useBaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: QueryOptions = {},
): QueryResult<T> {
  const { enabled = true, pollInterval } = options;

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
      .current()
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

  useEffect(() => {
    if (!pollInterval || !enabled) return;
    const timer = setInterval(() => setTick((t) => t + 1), pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval, enabled]);

  return { ...state, refetch };
}

// ─── Terminal statuses ────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "RESOLVED"]);

// ─── Admin: Booking Detail + Mutations ───────────────────────────────────────

interface BookingDetailHookResult {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
  mutating: boolean;
  mutationError: string | null;
  isTerminal: boolean;
  refetch: () => void;
  startService: () => Promise<void>;
  completeService: (opts?: { finalPrice?: number }) => Promise<void>;
  validateCompletion: (input: ValidateBookingInput) => Promise<void>;
  cancelBooking: (opts: { reason: string; cancelledBy?: string }) => Promise<void>;
  deleteBooking: () => Promise<void>;
  restoreBooking: () => Promise<void>;
  resolveDispute: (input: ResolveDisputeInput) => Promise<void>;
  updatePaymentStatus: (opts: { paymentStatus: PaymentStatus }) => Promise<void>;
  submitRebuttal: (opts: { message: string }) => Promise<void>;
  rescheduleBooking: (input: RescheduleBookingInput) => Promise<void>;
}

export function useBookingById(
  id: string | null | undefined,
  _options?: { populate?: boolean },
): BookingDetailHookResult {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    bookingAPI
      .getBookingById(id)
      .then((res) => {
        if (!controller.signal.aborted) {
          setBooking((res.booking as Booking) ?? null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load booking");
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, tick]);

  const mutate = useCallback(
    async (fn: () => Promise<unknown>): Promise<void> => {
      setMutating(true);
      setMutationError(null);
      try {
        const res = await fn();
        // Update booking if a fresh one came back
        if (res && typeof res === "object" && "booking" in res) {
          setBooking((res as { booking: Booking }).booking ?? null);
        }
      } catch (err: unknown) {
        setMutationError(
          err instanceof Error ? err.message : "Operation failed",
        );
      } finally {
        setMutating(false);
      }
    },
    [],
  );

  const startService = useCallback(
    () => mutate(() => bookingAPI.startService(id!)),
    [id, mutate],
  );

  const completeService = useCallback(
    (opts?: { finalPrice?: number }) =>
      mutate(() => bookingAPI.adminCompleteService(id!, opts)),
    [id, mutate],
  );

  const validateCompletion = useCallback(
    (input: ValidateBookingInput) =>
      mutate(() => {
        if (input.approved) {
          return bookingAPI.respondToProof(id!, {
            approved: true,
            rating: input.rating ?? 5,
            review: input.review,
          });
        } else {
          return bookingAPI.respondToProof(id!, {
            approved: false,
            disputeReason: input.disputeReason ?? "",
          });
        }
      }),
    [id, mutate],
  );

  const cancelBooking = useCallback(
    (opts: { reason: string; cancelledBy?: string }) =>
      mutate(() => bookingAPI.adminCancelBooking(id!, { reason: opts.reason })),
    [id, mutate],
  );

  const deleteBooking = useCallback(
    () => mutate(() => bookingAPI.adminDeleteBooking(id!)),
    [id, mutate],
  );

  const restoreBooking = useCallback(
    () => mutate(() => bookingAPI.adminRestoreBooking(id!)),
    [id, mutate],
  );

  const resolveDispute = useCallback(
    (input: ResolveDisputeInput) =>
      mutate(() =>
        bookingAPI.adminResolveDispute(id!, {
          outcome: input.resolution === "approve" ? AdminResolutionOutcome.CLIENT_FAVOUR : AdminResolutionOutcome.PROVIDER_FAVOUR,
          notes: input.notes,
        }),
      ),
    [id, mutate],
  );

  const updatePaymentStatus = useCallback(
    (opts: { paymentStatus: PaymentStatus }) =>
      mutate(() => bookingAPI.adminUpdatePaymentStatus(id!, opts.paymentStatus)),
    [id, mutate],
  );

  const submitRebuttal = useCallback(
    (opts: { message: string }) =>
      mutate(() => bookingAPI.submitRebuttal(id!, { message: opts.message })),
    [id, mutate],
  );

  const rescheduleBooking = useCallback(
    (input: RescheduleBookingInput) =>
      mutate(() =>
        bookingAPI.rescheduleBooking(id!, {
          newDate: input.newDate,
          newTimeSlot: input.newTimeSlot,
        }),
      ),
    [id, mutate],
  );

  const isTerminal = booking
    ? TERMINAL_STATUSES.has(booking.status as string)
    : false;

  return {
    booking,
    loading,
    error,
    mutating,
    mutationError,
    isTerminal,
    refetch,
    startService,
    completeService,
    validateCompletion,
    cancelBooking,
    deleteBooking,
    restoreBooking,
    resolveDispute,
    updatePaymentStatus,
    submitRebuttal,
    rescheduleBooking,
  };
}

// ─── Admin: All Bookings ──────────────────────────────────────────────────────

export function useAllBookings(
  params: BookingListParams,
  options: QueryOptions = {},
): QueryResult<BookingListResponse> {
  const key = JSON.stringify(params);
  return useBaseQuery<BookingListResponse>(
    () =>
      bookingAPI
        .adminGetAllBookings({
          status: params.status as string | undefined,
          clientId: params.clientId,
          providerId: params.providerId,
          limit: params.limit,
          skip: params.skip,
          includeDeleted: params.includeDeleted,
        })
        .then((res) => ({
          success: res.success,
          bookings: res.bookings,
          total: res.total,
          message: res.message,
        })),
    [key],
    options,
  );
}

// ─── Admin: Active Bookings ───────────────────────────────────────────────────

export function useActiveBookings(
  params: Pick<BookingListParams, "limit" | "skip">,
  options: QueryOptions = {},
): QueryResult<BookingListResponse> {
  const key = JSON.stringify(params);
  return useBaseQuery<BookingListResponse>(
    () =>
      bookingAPI
        .adminGetAllBookings({
          status: "CONFIRMED,IN_PROGRESS,AWAITING_VALIDATION",
          limit: params.limit,
          skip: params.skip,
        })
        .then((res) => ({
          success: res.success,
          bookings: res.bookings,
          total: res.total,
          message: res.message,
        })),
    [key],
    options,
  );
}

// ─── Admin: Disputed Bookings ─────────────────────────────────────────────────

export function useDisputedBookings(
  params: Pick<BookingListParams, "limit" | "skip">,
  options: QueryOptions = {},
): QueryResult<BookingListResponse> {
  const key = JSON.stringify(params);
  return useBaseQuery<BookingListResponse>(
    () =>
      bookingAPI
        .adminGetAllBookings({
          status: "DISPUTED,REBUTTAL_SUBMITTED",
          limit: params.limit,
          skip: params.skip,
        })
        .then((res) => ({
          success: res.success,
          bookings: res.bookings,
          total: res.total,
          message: res.message,
        })),
    [key],
    options,
  );
}

// ─── Admin: Pending Validation ────────────────────────────────────────────────

export function usePendingValidationBookings(
  params: Pick<BookingListParams, "limit" | "skip">,
  options: QueryOptions = {},
): QueryResult<BookingListResponse> {
  const key = JSON.stringify(params);
  return useBaseQuery<BookingListResponse>(
    () =>
      bookingAPI
        .adminGetAllBookings({
          status: "AWAITING_VALIDATION" as BookingStatus,
          limit: params.limit,
          skip: params.skip,
        })
        .then((res) => ({
          success: res.success,
          bookings: res.bookings,
          total: res.total,
          message: res.message,
        })),
    [key],
    options,
  );
}

// ─── Admin: Booking Stats ─────────────────────────────────────────────────────

export function useBookingStats(
  options: QueryOptions = {},
): QueryResult<BookingStats> {
  return useBaseQuery<BookingStats>(
    () => bookingAPI.adminGetStats(),
    [],
    options,
  );
}

// Simple query-only version for non-admin uses (e.g., dashboard page stat card)
export function useBookingDetailQuery(
  id: string | null | undefined,
): QueryResult<BookingDetailResponse> {
  return useBaseQuery<BookingDetailResponse>(
    () =>
      bookingAPI.getBookingById(id!).then((res) => ({
        success: res.success,
        booking: res.booking as Booking,
        message: res.message,
      })),
    [id],
    { enabled: !!id },
  );
}
