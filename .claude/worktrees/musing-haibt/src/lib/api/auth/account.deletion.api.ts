import {
  AuthResponse,
  DeletionStatusResponse,
  DeletionReviewQueueResponse,
  RetryDeletionResponse,
} from "@/types/user.types";
import { APIClient } from "../base/api-client";

export class AccountDeletionAPI extends APIClient {
  private readonly endpoint = "/api/account/deletion";

  // ── User routes ─────────────────────────────────────────────────────────────

  // POST / — initiates the deletion pipeline; user enters grace period.
  async requestDeletion(): Promise<AuthResponse> {
    return this.post<AuthResponse>(this.endpoint);
  }

  // DELETE / — cancels a pending deletion while still in the grace period.
  async cancelDeletion(): Promise<AuthResponse> {
    return this.delete<AuthResponse>(this.endpoint);
  }

  // GET /status — returns the current deletion event state for the
  // authenticated user (pending, grace_period, processing, etc.).
  async getDeletionStatus(): Promise<DeletionStatusResponse> {
    return this.get<DeletionStatusResponse>(`${this.endpoint}/status`);
  }

  // ── Admin routes ─────────────────────────────────────────────────────────────

  // GET /admin/review — lists failed deletion events awaiting manual review.
  async getAdminReviewQueue(): Promise<DeletionReviewQueueResponse> {
    return this.get<DeletionReviewQueueResponse>(
      `${this.endpoint}/admin/review`,
    );
  }

  // POST /admin/:eventId/retry — manually retries a failed deletion pipeline.
  async retryDeletion(eventId: string): Promise<RetryDeletionResponse> {
    return this.post<RetryDeletionResponse>(
      `${this.endpoint}/admin/${eventId}/retry`,
    );
  }
}

export const accountDeletionAPI = new AccountDeletionAPI();
