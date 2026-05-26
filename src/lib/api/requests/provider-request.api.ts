// lib/api/requests/provider-request.api.ts
import { APIClient } from "@/lib/api/base/api-client";
import {
  ProviderRequest,
  ProviderRequestResponse,
  ProviderRequestListResponse,
  CreateTaskMatchRequestBody,
  CreateTaskInterestRequestBody,
  CreateServiceBrowseRequestBody,
  RespondToProviderRequestBody,
  ProposeScheduleBody,
  NegotiateScheduleBody,
} from "@/types/provider.request.types";

export class ProviderRequestAPI extends APIClient {
  private readonly base = "/api/requests";

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — CLIENT: REQUEST CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * POST /requests/task-match
   *
   * Client selects a provider from the matchedProviders list on their task.
   */
  async createTaskMatchRequest(
    body: CreateTaskMatchRequestBody,
  ): Promise<ProviderRequestResponse> {
    return this.post<ProviderRequestResponse>(`${this.base}/task-match`, body);
  }

  /**
   * POST /requests/task-interest
   *
   * Client requests a provider who expressed interest in their FLOATING task.
   */
  async createTaskInterestRequest(
    body: CreateTaskInterestRequestBody,
  ): Promise<ProviderRequestResponse> {
    return this.post<ProviderRequestResponse>(
      `${this.base}/task-interest`,
      body,
    );
  }

  /**
   * POST /requests/service-browse
   *
   * Client requests a provider directly after browsing services by location.
   * No task is required — the serviceId is the anchor.
   */
  async createServiceBrowseRequest(
    body: CreateServiceBrowseRequestBody,
  ): Promise<ProviderRequestResponse> {
    return this.post<ProviderRequestResponse>(
      `${this.base}/service-browse`,
      body,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — CLIENT: READ
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /requests/client/me
   *
   * All requests sent by the authenticated client, sorted newest first.
   */
  async getMyRequestsAsClient(): Promise<ProviderRequestListResponse> {
    return this.get<ProviderRequestListResponse>(`${this.base}/client/me`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — CLIENT: ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * PATCH /requests/:requestId/cancel
   *
   * Client cancels a PENDING request they own.
   */
  async cancelRequest(
    requestId: string,
    reason?: string,
  ): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/cancel`,
      { reason },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PROVIDER: READ
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /requests/provider/me
   *
   * All requests received by the authenticated provider across all statuses.
   */
  async getMyRequestsAsProvider(): Promise<ProviderRequestListResponse> {
    return this.get<ProviderRequestListResponse>(`${this.base}/provider/me`);
  }

  /**
   * GET /requests/provider/me/pending
   *
   * Only PENDING requests directed at the authenticated provider, sorted
   * oldest first (FIFO). Use for the provider's action inbox.
   */
  async getMyPendingRequests(): Promise<ProviderRequestListResponse> {
    return this.get<ProviderRequestListResponse>(
      `${this.base}/provider/me/pending`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — PROVIDER: ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * PATCH /requests/:requestId/respond
   *
   * Provider accepts or rejects a PENDING request.
   * On ACCEPT: request → ACCEPTED, booking created (201).
   * On REJECT: request → REJECTED, no booking (200).
   */
  async respondToRequest(
    requestId: string,
    body: RespondToProviderRequestBody,
  ): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/respond`,
      body,
    );
  }

  /**
   * PATCH /requests/:requestId/reschedule
   *
   * Provider proposes a new date/time instead of accepting or rejecting outright.
   * Status → RESCHEDULE_PROPOSED; client can then confirm via /confirm-reschedule.
   */
  async proposeSchedule(
    requestId: string,
    body: ProposeScheduleBody,
  ): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/reschedule`,
      body,
    );
  }

  /**
   * PATCH /requests/:requestId/confirm-reschedule
   *
   * Client confirms the provider's proposed reschedule.
   * Status → ACCEPTED with the new schedule applied.
   */
  async confirmReschedule(requestId: string): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/reschedule/confirm`,
    );
  }

  /**
   * PATCH /requests/:requestId/reschedule/decline
   *
   * Client rejects the provider's proposed reschedule.
   * Status → PENDING so the provider can respond again.
   */
  async declineReschedule(requestId: string): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/reschedule/decline`,
    );
  }

  /**
   * PATCH /requests/:requestId/reschedule/negotiate
   *
   * Client counter-proposes their own preferred date/time.
   * Provider's proposal is cleared, status → PENDING.
   */
  async negotiateSchedule(
    requestId: string,
    body: NegotiateScheduleBody,
  ): Promise<ProviderRequestResponse> {
    return this.patch<ProviderRequestResponse>(
      `${this.base}/${requestId}/reschedule/negotiate`,
      body,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SHARED: DETAIL VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /requests/task/:taskId
   *
   * All provider requests spawned by a given task, newest first.
   */
  async getRequestsByTask(taskId: string): Promise<ProviderRequestListResponse> {
    return this.get<ProviderRequestListResponse>(
      `${this.base}/task/${taskId}`,
    );
  }

  /**
   * GET /requests/:requestId
   *
   * Returns a single provider request by its ObjectId.
   * Caller must be either the client or the provider on the request.
   */
  async getRequestById(requestId: string): Promise<ProviderRequestResponse> {
    return this.get<ProviderRequestResponse>(`${this.base}/${requestId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /requests/admin/all
   *
   * Admin: returns all provider requests across all users.
   */
  async adminGetAllRequests(params?: {
    status?: string;
    clientId?: string;
    providerId?: string;
    limit?: number;
    skip?: number;
  }): Promise<ProviderRequestListResponse> {
    return this.get<ProviderRequestListResponse>(`${this.base}/admin/all`, params);
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const providerRequestAPI = new ProviderRequestAPI();

// ─── Convenience re-export for response shape ─────────────────────────────────

export type { ProviderRequest };
