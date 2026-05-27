import { APIClient } from "@/lib/api/base/api-client";
import {
  BookingResponse,
  BookingListResponse,
  SubmitProofRequestBody,
  RescheduleBookingRequestBody,
  CancelBookingRequestBody,
} from "@/types/booking.types";
import type { BookingStats, BookingStatsResponse } from "@/types/booking/booking.types";
import {
  CompletionAttemptListResponse,
  RespondToProofRequestBody,
  SubmitRebuttalRequestBody,
  AdminResolveDisputeRequestBody,
} from "@/types/completion-attempt.types";

export class BookingAPI extends APIClient {
  private readonly base = "/api/bookings";

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — CLIENT: READ
  // ═══════════════════════════════════════════════════════════════════════════

  async getClientBookings(params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<BookingListResponse> {
    return this.get<BookingListResponse>(`${this.base}/client/me`, params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — CLIENT: ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async respondToProof(
    bookingId: string,
    body: RespondToProofRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/${bookingId}/respond-proof`,
      body,
    );
  }

  async cancelBooking(
    bookingId: string,
    body: CancelBookingRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/${bookingId}/cancel`,
      body,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — PROVIDER: READ
  // ═══════════════════════════════════════════════════════════════════════════

  async getProviderBookings(params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<BookingListResponse> {
    return this.get<BookingListResponse>(`${this.base}/provider/me`, params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PROVIDER: ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async startService(bookingId: string): Promise<BookingResponse> {
    return this.patch<BookingResponse>(`${this.base}/${bookingId}/start`);
  }

  async submitProof(
    bookingId: string,
    body: SubmitProofRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/${bookingId}/submit-proof`,
      body,
    );
  }

  async submitRebuttal(
    bookingId: string,
    body: SubmitRebuttalRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/${bookingId}/rebuttal`,
      body,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SHARED: RESCHEDULE & DETAIL
  // ═══════════════════════════════════════════════════════════════════════════

  async rescheduleBooking(
    bookingId: string,
    body: RescheduleBookingRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/${bookingId}/reschedule`,
      body,
    );
  }

  async getBookingAttempts(
    bookingId: string,
  ): Promise<CompletionAttemptListResponse> {
    return this.get<CompletionAttemptListResponse>(
      `${this.base}/${bookingId}/attempts`,
    );
  }

  async getBookingById(bookingId: string): Promise<BookingResponse> {
    return this.get<BookingResponse>(`${this.base}/${bookingId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  async adminGetAllBookings(params?: {
    status?: string;
    clientId?: string;
    providerId?: string;
    limit?: number;
    skip?: number;
    includeDeleted?: boolean;
  }): Promise<BookingListResponse> {
    return this.get<BookingListResponse>(`${this.base}/admin/all`, params);
  }

  async adminGetStats(): Promise<BookingStats> {
    const res = await this.get<BookingStatsResponse>(`${this.base}/admin/stats`);
    return res.stats;
  }

  async adminCompleteService(
    bookingId: string,
    opts?: { finalPrice?: number },
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/admin/${bookingId}/complete`,
      opts,
    );
  }

  async adminDeleteBooking(bookingId: string): Promise<BookingResponse> {
    return this.delete<BookingResponse>(`${this.base}/admin/${bookingId}`);
  }

  async adminRestoreBooking(bookingId: string): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/admin/${bookingId}/restore`,
    );
  }

  async adminUpdatePaymentStatus(
    bookingId: string,
    paymentStatus: string,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/admin/${bookingId}/payment-status`,
      { paymentStatus },
    );
  }

  async adminCancelBooking(
    bookingId: string,
    body: CancelBookingRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/admin/${bookingId}/cancel`,
      body,
    );
  }

  async adminResolveDispute(
    bookingId: string,
    body: AdminResolveDisputeRequestBody,
  ): Promise<BookingResponse> {
    return this.patch<BookingResponse>(
      `${this.base}/admin/${bookingId}/resolve`,
      body,
    );
  }
}

export const bookingAPI = new BookingAPI();
