"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { reviewAPI } from "@/lib/api/reviews/review.api";
import { Review, SubmitReviewBody } from "@/types/review.types";

// ─── Shared primitives (mirrors useBooking.ts pattern) ────────────────────────

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
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

// ─── Internal: base query ────────────────────────────────────────────────────

function useBaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): QueryState<T> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

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
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unexpected error";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  return { ...state, refetch };
}

// ─── Internal: base mutation ─────────────────────────────────────────────────

function useBaseMutation<TData, TArgs>(
  mutationFn: (args: TArgs) => Promise<TData>,
  callbacks?: MutationCallbacks<TData>,
): MutationState<TData> & {
  mutate: (args: TArgs) => Promise<TData | null>;
  reset: () => void;
} {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    loading: false,
    error: null,
  });
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; });
  const mutationFnRef = useRef(mutationFn);
  useEffect(() => { mutationFnRef.current = mutationFn; });

  const mutate = useCallback(async (args: TArgs): Promise<TData | null> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await mutationFnRef.current(args);
      setState({ data, loading: false, error: null });
      callbacksRef.current?.onSuccess?.(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
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

// ─── Public: Provider Reviews (paginated, append-on-load-more) ───────────────

export interface ProviderReviewsState {
  reviews: Review[];
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function useProviderReviews(
  providerProfileId: string | null | undefined,
  limit = 10,
): ProviderReviewsState {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch page 1 on mount / when profileId changes
  useEffect(() => {
    if (!providerProfileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPage(1);
    setReviews([]);

    reviewAPI
      .getProviderReviews(providerProfileId, { page: 1, limit })
      .then((res) => {
        setReviews(res.reviews ?? []);
        setTotal(res.total ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerProfileId, limit]);

  const loadMore = useCallback(() => {
    if (!providerProfileId || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    reviewAPI
      .getProviderReviews(providerProfileId, { page: nextPage, limit })
      .then((res) => {
        setReviews((prev) => [...prev, ...(res.reviews ?? [])]);
        setTotal(res.total ?? 0);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load more reviews");
        setLoadingMore(false);
      });
  }, [providerProfileId, page, limit, loadingMore]);

  const hasMore = reviews.length < total;

  return { reviews, total, page, loading, loadingMore, error, hasMore, loadMore };
}

// ─── Public: Submit Review ───────────────────────────────────────────────────

export function useSubmitReview(
  callbacks?: MutationCallbacks<Review>,
): MutationState<Review> & {
  mutate: (args: { bookingId: string; body: SubmitReviewBody }) => Promise<Review | null>;
  reset: () => void;
} {
  return useBaseMutation(
    ({ bookingId, body }) =>
      reviewAPI
        .submitReview(bookingId, body)
        .then((res) => {
          if (!res.success) throw new Error(res.message);
          return res.review as Review;
        }),
    callbacks,
  );
}

// Re-export so callers can get the base query state shape if needed
export { useBaseQuery };
