// api/tasks/task.api.ts
import { APIClient } from "@/lib/api/base/api-client";

import {
  TaskResponse, // Request bodies
  CreateTaskRequestBody,
  UpdateTaskRequestBody,
  RematchRequestBody,
  CancelTaskRequestBody,
  ExpressInterestRequestBody,
  // Query param shapes
  GetFloatingTasksParams,
  SearchTasksParams,
  GetMyTasksParams,
  GetMatchedTasksParams,
  GetTaskByIdParams,
  AdminGetAllTasksParams,
  AdminGetTaskStatsParams,
  // Response shapes
  // TaskResponse,
  TaskListResponse,
  TaskWithMatchesResponse,
  TaskSummaryResponse,
  MatchedProvidersResponse,
  InterestedProvidersResponse,
  AdminTaskStatsResponse,
  AdminExpireOverdueResponse,
} from "@/types/task.types";

export class TaskAPI extends APIClient {
  private readonly base = "/api/tasks";

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — SHARED / PUBLIC DISCOVERY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /tasks/floating
   *
   * Returns all tasks currently in FLOATING status — open opportunities
   * visible to any authenticated provider or client in the region.
   */
  async getFloatingTasks(
    params?: GetFloatingTasksParams,
  ): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(`${this.base}/floating`, params);
  }

  /**
   * GET /tasks/search
   *
   * Full-text search across task title, description, and tags.
   * `q` is required; all other params are optional filters.
   */
  async searchTasks(params: SearchTasksParams): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(`${this.base}/search`, params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — CLIENT ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * POST /tasks
   *
   * Creates a new task for the authenticated client and immediately triggers
   * provider matching. Returns the task, matched providers, and an optional
   * savedLocationId when the location was persisted to the address book.
   */
  async createTask(
    body: CreateTaskRequestBody,
  ): Promise<TaskWithMatchesResponse> {
    return this.post<TaskWithMatchesResponse>(`${this.base}`, body);
  }

  /**
   * GET /tasks/client/me
   *
   * Returns a paginated list of tasks belonging to the authenticated client,
   * sorted most-recent first.
   */
  async getMyTasks(params?: GetMyTasksParams): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(`${this.base}/client/me`, params);
  }

  /**
   * GET /tasks/client/summary
   *
   * Returns a compact activity summary for the authenticated client's
   * dashboard: total, active, cancelled, and expired task counts.
   */
  async getClientTaskSummary(): Promise<TaskSummaryResponse> {
    return this.get<TaskSummaryResponse>(`${this.base}/client/summary`);
  }

  /**
   * PATCH /tasks/:taskId
   *
   * Updates mutable fields on a task owned by the authenticated client.
   * Content changes automatically re-trigger intelligent provider matching.
   */
  async updateTask(
    taskId: string,
    body: UpdateTaskRequestBody,
  ): Promise<TaskWithMatchesResponse> {
    return this.patch<TaskWithMatchesResponse>(`${this.base}/${taskId}`, body);
  }

  /**
   * DELETE /tasks/:taskId
   *
   * Soft-deletes a task owned by the authenticated client.
   * The record is NOT purged from the database.
   */
  async deleteTask(taskId: string): Promise<TaskResponse> {
    return this.delete<TaskResponse>(`${this.base}/${taskId}`);
  }

  /**
   * PATCH /tasks/:taskId/cancel
   *
   * Cancels a task owned by the authenticated client.
   * Terminal tasks (already CANCELLED or EXPIRED) are rejected with 409.
   */
  async cancelTask(
    taskId: string,
    body?: CancelTaskRequestBody,
  ): Promise<TaskResponse> {
    return this.patch<TaskResponse>(`${this.base}/${taskId}/cancel`, body);
  }

  /**
   * PATCH /tasks/:taskId/float
   *
   * Transitions the task from MATCHED to FLOATING, making it visible to
   * all providers in the area rather than only the curated matched subset.
   */
  async makeTaskFloating(taskId: string): Promise<TaskResponse> {
    return this.patch<TaskResponse>(`${this.base}/${taskId}/float`);
  }

  /**
   * GET /tasks/:taskId/matched-providers
   *
   * Returns the full matched provider list for a task, with ProviderProfile
   * documents populated. Providers are returned in descending matchScore order.
   */
  async getMatchedProviders(taskId: string): Promise<MatchedProvidersResponse> {
    return this.get<MatchedProvidersResponse>(
      `${this.base}/${taskId}/matched-providers`,
    );
  }

  /**
   * GET /tasks/:taskId/interested-providers
   *
   * Returns providers who have expressed interest in a FLOATING task,
   * with their optional pitch message included.
   */
  async getInterestedProviders(
    taskId: string,
  ): Promise<InterestedProvidersResponse> {
    return this.get<InterestedProvidersResponse>(
      `${this.base}/${taskId}/interested-providers`,
    );
  }

  /**
   * POST /tasks/:taskId/rematch
   *
   * Manually re-triggers provider matching for a task. Useful when initial
   * matching failed, task content was corrected, or new providers have
   * registered in the task's area since creation.
   */
  async triggerMatching(
    taskId: string,
    body?: RematchRequestBody,
  ): Promise<TaskWithMatchesResponse> {
    return this.post<TaskWithMatchesResponse>(
      `${this.base}/${taskId}/rematch`,
      body,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — PROVIDER ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /tasks/provider/matched
   *
   * Returns tasks where the authenticated provider appears in the
   * matchedProviders array, sorted by matchScore descending.
   */
  async getMatchedTasksForProvider(
    params?: GetMatchedTasksParams,
  ): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(`${this.base}/provider/matched`, params);
  }

  /**
   * GET /tasks/provider/interested
   *
   * Returns tasks where the authenticated provider has previously expressed
   * interest — their pending applications.
   */
  async getTasksWithMyInterest(
    params?: GetMatchedTasksParams,
  ): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(
      `${this.base}/provider/interested`,
      params,
    );
  }

  /**
   * POST /tasks/:taskId/interest
   *
   * Records the authenticated provider's interest in a FLOATING or MATCHED
   * task. An optional pitch message can be included for the client.
   * Duplicate submissions are rejected by the backend (idempotent).
   */
  async expressInterest(
    taskId: string,
    body?: ExpressInterestRequestBody,
  ): Promise<TaskResponse> {
    return this.post<TaskResponse>(`${this.base}/${taskId}/interest`, body);
  }

  /**
   * DELETE /tasks/:taskId/interest
   *
   * Removes the authenticated provider's previously expressed interest.
   * Providers can withdraw at any point before the client selects them.
   */
  async withdrawInterest(taskId: string): Promise<TaskResponse> {
    return this.delete<TaskResponse>(`${this.base}/${taskId}/interest`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — SHARED TASK DETAIL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /tasks/:taskId
   *
   * Fetches a single task by its ObjectId. Pass populate: true to load
   * related documents (category, clientId → UserProfile → User,
   * matchedProviders → ProviderProfile → serviceOfferings).
   *
   * Each successful call increments the task's viewCount (fire-and-forget).
   */
  async getTaskById(
    taskId: string,
    params?: GetTaskByIdParams,
  ): Promise<TaskResponse> {
    return this.get<TaskResponse>(`${this.base}/${taskId}`, params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — ADMIN ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /admin/tasks
   *
   * Paginated list of all tasks across all clients. Supports optional filters
   * for status, clientId, and soft-deleted records.
   */
  async adminGetAllTasks(
    params?: AdminGetAllTasksParams,
  ): Promise<TaskListResponse> {
    return this.get<TaskListResponse>(`${this.base}/admin/tasks`, params);
  }

  /**
   * GET /admin/tasks/stats
   *
   * Platform-wide task statistics: totals by status, soft-deleted count,
   * and a computed matching success rate. Pass clientId to scope to one client.
   */
  async adminGetTaskStats(
    params?: AdminGetTaskStatsParams,
  ): Promise<AdminTaskStatsResponse> {
    return this.get<AdminTaskStatsResponse>(
      `${this.base}/admin/tasks/stats`,
      params,
    );
  }

  /**
   * PATCH /admin/tasks/:taskId/cancel
   *
   * Admin-level task cancellation. Overrides ownership — any non-terminal
   * task can be cancelled regardless of which client created it.
   */
  async adminCancelTask(
    taskId: string,
    body?: CancelTaskRequestBody,
  ): Promise<TaskResponse> {
    return this.patch<TaskResponse>(
      `${this.base}/admin/tasks/${taskId}/cancel`,
      body,
    );
  }

  /**
   * PATCH /admin/tasks/:taskId/restore
   *
   * Restores a soft-deleted task, making it visible in default queries again.
   * The task retains its original status.
   */
  async adminRestoreTask(taskId: string): Promise<TaskResponse> {
    return this.patch<TaskResponse>(
      `${this.base}/admin/tasks/${taskId}/restore`,
    );
  }

  /**
   * PATCH /admin/tasks/:taskId/expire
   *
   * Manually transitions a single task to EXPIRED status.
   * Terminal tasks are rejected with 404.
   */
  async adminExpireTask(taskId: string): Promise<TaskResponse> {
    return this.patch<TaskResponse>(
      `${this.base}/admin/tasks/${taskId}/expire`,
    );
  }

  /**
   * POST /admin/tasks/expire-overdue
   *
   * Batch-expires all tasks whose expiresAt has passed and are not yet
   * terminal. Returns the count of affected tasks.
   * Designed to be called by a cron job or manually from the admin dashboard.
   */
  async adminExpireOverdueTasks(): Promise<AdminExpireOverdueResponse> {
    return this.post<AdminExpireOverdueResponse>(
      `${this.base}/admin/tasks/expire-overdue`,
    );
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
// Import `taskAPI` directly instead of instantiating TaskAPI in every module.

export const taskAPI = new TaskAPI();
