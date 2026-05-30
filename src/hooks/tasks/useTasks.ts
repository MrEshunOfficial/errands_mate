"use client";

import { taskAPI } from "@/lib/api/tasks/tasks.api";
import {
  GetFloatingTasksParams,
  Task,
  SearchTasksParams,
  GetTaskByIdParams,
  GetMyTasksParams,
  ClientTaskSummary,
  ProviderMatchResult,
  PopulatedProviderMatchResult,
  GetMatchedTasksParams,
  AdminGetAllTasksParams,
  AdminGetTaskStatsParams,
  AdminTaskStatsResponse,
  MatchingSummary,
  CreateTaskRequestBody,
  UpdateTaskRequestBody,
  CancelTaskRequestBody,
  RematchRequestBody,
  ExpressInterestRequestBody,
} from "@/types/task.types";
import { useState, useEffect, useCallback, useRef } from "react";

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
//
// All query hooks are built on this. It handles:
//   - auto-fetch on mount and whenever `deps` change
//   - AbortController cleanup on unmount / re-fetch
//   - `enabled` guard to skip fetching (e.g. when an ID is not yet known)
//   - stable `refetch` via a counter increment

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

  // Increment to force a manual re-fetch without changing external deps
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // Keep fetcher stable across renders without stale-closure issues
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
//
// All mutation hooks are built on this. Provides:
//   - manual `mutate` trigger
//   - in-flight loading state
//   - `reset` to clear state between uses
//   - optional onSuccess / onError callbacks

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
// SECTION 1 — SHARED / PUBLIC DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches all FLOATING tasks visible to authenticated clients and providers.
 * Re-fetches automatically whenever `params` changes.
 *
 * @example
 *   const { data: tasks, loading, refetch } = useFloatingTasks({ region: "Greater Accra" });
 */
export function useFloatingTasks(
  params?: GetFloatingTasksParams,
): QueryResult<Task[]> {
  return useBaseQuery(
    () =>
      taskAPI
        .getFloatingTasks(params)
        .then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
  );
}

/**
 * Full-text search across task title, description, and tags.
 * Skips the request when `params.q` is empty.
 *
 * @example
 *   const { data: results, loading } = useSearchTasks({ q: "plumber", region: "Accra" });
 */
export function useSearchTasks(
  params: Partial<SearchTasksParams>,
): QueryResult<Task[]> {
  const hasQuery = !!params.q?.trim();
  return useBaseQuery(
    () =>
      taskAPI
        .searchTasks(params as SearchTasksParams)
        .then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
    hasQuery,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — CLIENT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches a single task by ID.
 * Skips the request when `taskId` is falsy.
 * Pass `populate: true` to load related category, client, and provider documents.
 *
 * @example
 *   const { data: task, loading, error, refetch } = useTaskById(taskId);
 *   const { data: task } = useTaskById(taskId, { populate: true });
 */
export function useTaskById(
  taskId: string | null | undefined,
  params?: GetTaskByIdParams,
): QueryResult<Task> {
  return useBaseQuery(
    () => taskAPI.getTaskById(taskId!, params).then((res) => res.task!),
    [taskId, JSON.stringify(params)],
    !!taskId,
  );
}

/**
 * Paginated list of tasks belonging to the authenticated client, sorted most-recent first.
 *
 * @example
 *   const { data: tasks, loading, refetch } = useMyTasks({ status: TaskStatus.MATCHED });
 */
export function useMyTasks(params?: GetMyTasksParams): QueryResult<Task[]> {
  return useBaseQuery(
    () => taskAPI.getMyTasks(params).then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
  );
}

/**
 * Compact dashboard summary: total, active, cancelled, and expired task counts.
 * Avoids loading full task documents — use for badges and counters only.
 *
 * @example
 *   const { data: summary } = useClientTaskSummary();
 *   summary?.active // → 3
 */
export function useClientTaskSummary(): QueryResult<ClientTaskSummary> {
  return useBaseQuery(
    () => taskAPI.getClientTaskSummary().then((res) => res.summary!),
    [],
  );
}

/**
 * Fetches the full matched provider list for a task, sorted by matchScore descending.
 * Skips when `taskId` is falsy.
 *
 * @example
 *   const { data: providers } = useMatchedProviders(taskId);
 */
export function useMatchedProviders(
  taskId: string | null | undefined,
): QueryResult<PopulatedProviderMatchResult[]> {
  return useBaseQuery(
    () =>
      taskAPI
        .getMatchedProviders(taskId!)
        .then((res) => res.matchedProviders ?? []),
    [taskId],
    !!taskId,
  );
}

/**
 * Fetches providers who have expressed interest in a FLOATING task.
 * Only the owning client should call this.
 * Skips when `taskId` is falsy.
 *
 * @example
 *   const { data: providers } = useInterestedProviders(taskId);
 */
export function useInterestedProviders(
  taskId: string | null | undefined,
): QueryResult<NonNullable<Task["interestedProviders"]>> {
  return useBaseQuery(
    () =>
      taskAPI
        .getInterestedProviders(taskId!)
        .then((res) => res.interestedProviders ?? []),
    [taskId],
    !!taskId,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — PROVIDER QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tasks where the authenticated provider appears in the matchedProviders array.
 * Results are sorted by matchScore descending — this is the provider's opportunity feed.
 *
 * @example
 *   const { data: tasks } = useMatchedTasksForProvider({ limit: 10 });
 */
export function useMatchedTasksForProvider(
  params?: GetMatchedTasksParams,
): QueryResult<Task[]> {
  return useBaseQuery(
    () =>
      taskAPI
        .getMatchedTasksForProvider(params)
        .then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
  );
}

/**
 * Tasks where the authenticated provider has previously expressed interest —
 * their pending application list.
 *
 * @example
 *   const { data: tasks } = useTasksWithMyInterest({ limit: 5 });
 */
export function useTasksWithMyInterest(
  params?: GetMatchedTasksParams,
): QueryResult<Task[]> {
  return useBaseQuery(
    () =>
      taskAPI
        .getTasksWithMyInterest(params)
        .then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ADMIN QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Paginated list of all tasks across all clients.
 * @role admin
 *
 * @example
 *   const { data: tasks } = useAdminAllTasks({ includeDeleted: true, limit: 50 });
 */
export function useAdminAllTasks(
  params?: AdminGetAllTasksParams,
): QueryResult<Task[]> {
  return useBaseQuery(
    () =>
      taskAPI
        .adminGetAllTasks(params)
        .then((res) => (res.tasks as Task[]) ?? []),
    [JSON.stringify(params)],
  );
}

/**
 * Platform-wide task statistics: totals by status, soft-deleted count,
 * and a computed matching success rate.
 * Pass `clientId` to scope all counts to a single client.
 * @role admin
 *
 * @example
 *   const { data: stats } = useAdminTaskStats();
 *   stats?.matchingSuccessRate // → 0.87
 */
export function useAdminTaskStats(
  params?: AdminGetTaskStatsParams,
): QueryResult<NonNullable<AdminTaskStatsResponse["stats"]>> {
  return useBaseQuery(
    () => taskAPI.adminGetTaskStats(params).then((res) => res.stats!),
    [JSON.stringify(params)],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — CLIENT MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a new task and triggers provider matching.
 * @role customer
 *
 * @example
 *   const { mutate: createTask, loading, error } = useCreateTask({
 *     onSuccess: ({ task }) => router.push(`/tasks/${task?._id}`),
 *   });
 *   await createTask({ title: "Fix sink", ... });
 */
export function useCreateTask(
  callbacks?: MutationCallbacks<{
    task?: Task;
    matchedProviders?: ProviderMatchResult[];
    matchingSummary?: MatchingSummary;
    savedLocationId?: string;
  }>,
) {
  return useBaseMutation(
    (body: CreateTaskRequestBody) =>
      taskAPI.createTask(body).then((res) => ({
        task: res.task,
        matchedProviders: res.matchedProviders,
        matchingSummary: res.matchingSummary,
        savedLocationId: res.savedLocationId,
      })),
    callbacks,
  );
}

/**
 * Updates mutable fields on a task owned by the authenticated client.
 * Content changes automatically re-trigger intelligent provider matching.
 * @role customer (own tasks only)
 *
 * @example
 *   const { mutate: updateTask, loading } = useUpdateTask({ onSuccess: refetch });
 *   await updateTask({ taskId, body: { title: "Fix leaking sink" } });
 */
export function useUpdateTask(
  callbacks?: MutationCallbacks<{
    task?: Task;
    matchedProviders?: ProviderMatchResult[];
    matchingSummary?: MatchingSummary;
  }>,
) {
  return useBaseMutation(
    ({ taskId, body }: { taskId: string; body: UpdateTaskRequestBody }) =>
      taskAPI.updateTask(taskId, body).then((res) => ({
        task: res.task,
        matchedProviders: res.matchedProviders,
        matchingSummary: res.matchingSummary,
      })),
    callbacks,
  );
}

/**
 * Soft-deletes a task owned by the authenticated client.
 * The record is NOT purged from the database.
 * @role customer (own tasks only)
 *
 * @example
 *   const { mutate: deleteTask } = useDeleteTask({ onSuccess: () => router.back() });
 *   await deleteTask(taskId);
 */
export function useDeleteTask(
  callbacks?: MutationCallbacks<void>,
): MutationResult<void, string> {
  return useBaseMutation(
    (taskId: string) => taskAPI.deleteTask(taskId).then(() => undefined),
    callbacks,
  );
}

/**
 * Cancels a task owned by the authenticated client.
 * Terminal tasks (CANCELLED / EXPIRED) are rejected by the backend with 409.
 * @role customer (own tasks only)
 *
 * @example
 *   const { mutate: cancelTask, loading } = useCancelTask({ onSuccess: refetch });
 *   await cancelTask({ taskId, reason: "Changed my mind" });
 */
export function useCancelTask(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, { taskId: string } & CancelTaskRequestBody> {
  return useBaseMutation(
    ({ taskId, reason }: { taskId: string } & CancelTaskRequestBody) =>
      taskAPI.cancelTask(taskId, { reason }).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Transitions a task from MATCHED → FLOATING, opening it to all nearby providers.
 * @role customer (own tasks only)
 *
 * @example
 *   const { mutate: makeFloating } = useMakeTaskFloating({ onSuccess: refetch });
 *   await makeFloating(taskId);
 */
export function useMakeTaskFloating(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, string> {
  return useBaseMutation(
    (taskId: string) =>
      taskAPI.makeTaskFloating(taskId).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Manually re-triggers provider matching for a task.
 * Returns the updated task, matched providers, and matching summary.
 * @role customer (own tasks only)
 *
 * @example
 *   const { mutate: triggerMatch, loading } = useTriggerMatching({
 *     onSuccess: ({ matchedProviders }) => console.log(matchedProviders.length),
 *   });
 *   await triggerMatch({ taskId, strategy: "intelligent" });
 */
export function useTriggerMatching(
  callbacks?: MutationCallbacks<{
    task?: Task;
    matchedProviders?: ProviderMatchResult[];
    matchingSummary?: MatchingSummary;
  }>,
) {
  return useBaseMutation(
    ({ taskId, strategy }: { taskId: string } & RematchRequestBody) =>
      taskAPI.triggerMatching(taskId, { strategy }).then((res) => ({
        task: res.task,
        matchedProviders: res.matchedProviders,
        matchingSummary: res.matchingSummary,
      })),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — PROVIDER MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Records the authenticated provider's interest in a FLOATING or MATCHED task.
 * Duplicate submissions are rejected at the model layer (idempotent).
 * @role provider
 *
 * @example
 *   const { mutate: express } = useExpressInterest({ onSuccess: refetch });
 *   await express({ taskId, message: "I can be there tomorrow." });
 */
export function useExpressInterest(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, { taskId: string } & ExpressInterestRequestBody> {
  return useBaseMutation(
    ({ taskId, message }: { taskId: string } & ExpressInterestRequestBody) =>
      taskAPI.expressInterest(taskId, { message }).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Removes the authenticated provider's previously expressed interest.
 * Providers can withdraw at any point before the client selects them.
 * @role provider
 *
 * @example
 *   const { mutate: withdraw } = useWithdrawInterest({ onSuccess: refetch });
 *   await withdraw(taskId);
 */
export function useWithdrawInterest(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, string> {
  return useBaseMutation(
    (taskId: string) =>
      taskAPI.withdrawInterest(taskId).then((res) => res.task!),
    callbacks,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — ADMIN MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Admin-level task cancellation. Overrides ownership — any non-terminal
 * task can be cancelled regardless of which client created it.
 * @role admin
 *
 * @example
 *   const { mutate: cancel } = useAdminCancelTask({ onSuccess: refetch });
 *   await cancel({ taskId, reason: "Policy violation" });
 */
export function useAdminCancelTask(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, { taskId: string } & CancelTaskRequestBody> {
  return useBaseMutation(
    ({ taskId, reason }: { taskId: string } & CancelTaskRequestBody) =>
      taskAPI.adminCancelTask(taskId, { reason }).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Restores a soft-deleted task, making it visible in default queries again.
 * The task retains its original status.
 * @role admin
 *
 * @example
 *   const { mutate: restore } = useAdminRestoreTask({ onSuccess: refetch });
 *   await restore(taskId);
 */
export function useAdminRestoreTask(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, string> {
  return useBaseMutation(
    (taskId: string) =>
      taskAPI.adminRestoreTask(taskId).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Manually transitions a single task to EXPIRED status.
 * Terminal tasks are rejected with 404.
 * @role admin
 *
 * @example
 *   const { mutate: expire } = useAdminExpireTask({ onSuccess: refetch });
 *   await expire(taskId);
 */
export function useAdminExpireTask(
  callbacks?: MutationCallbacks<Task>,
): MutationResult<Task, string> {
  return useBaseMutation(
    (taskId: string) =>
      taskAPI.adminExpireTask(taskId).then((res) => res.task!),
    callbacks,
  );
}

/**
 * Batch-expires all tasks whose expiresAt has passed and are not yet terminal.
 * Returns the count of affected tasks.
 * Designed to be triggered manually from the admin dashboard or by a cron job.
 * @role admin
 *
 * @example
 *   const { mutate: expireOverdue, data: count } = useAdminExpireOverdueTasks({
 *     onSuccess: (count) => toast(`${count} tasks expired`),
 *   });
 *   await expireOverdue(undefined);
 */
export function useAdminExpireOverdueTasks(
  callbacks?: MutationCallbacks<number>,
): MutationResult<number, undefined> {
  return useBaseMutation(
    () => taskAPI.adminExpireOverdueTasks().then((res) => res.expiredCount),
    callbacks,
  );
}
