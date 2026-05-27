import { APIClient } from "@/lib/api/base/api-client";
import {
  CompletionAttemptResponse,
  CompletionAttemptListResponse,
  AdminResolveDisputeRequestBody,
} from "@/types/completion-attempt.types";

export class CompletionAttemptAPI extends APIClient {
  private readonly base = "/api/completion-attempts";

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — PROVIDER
  // ═══════════════════════════════════════════════════════════════════════════

  async initiateAttempt(bookingId: string): Promise<CompletionAttemptResponse> {
    return this.post<CompletionAttemptResponse>(this.base, { bookingId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — SHARED
  // ═══════════════════════════════════════════════════════════════════════════

  async getAttemptById(attemptId: string): Promise<CompletionAttemptResponse> {
    return this.get<CompletionAttemptResponse>(`${this.base}/${attemptId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  async adminGetOpenDisputes(): Promise<CompletionAttemptListResponse> {
    return this.get<CompletionAttemptListResponse>(
      `${this.base}/admin/open-disputes`,
    );
  }

  async adminGetPendingRebuttals(): Promise<CompletionAttemptListResponse> {
    return this.get<CompletionAttemptListResponse>(
      `${this.base}/admin/pending-rebuttals`,
    );
  }

  async adminResolveDispute(
    attemptId: string,
    body: AdminResolveDisputeRequestBody,
  ): Promise<CompletionAttemptResponse> {
    return this.patch<CompletionAttemptResponse>(
      `${this.base}/${attemptId}/admin-resolve`,
      body,
    );
  }
}

export const completionAttemptAPI = new CompletionAttemptAPI();
