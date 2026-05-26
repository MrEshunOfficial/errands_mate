import { APIClient } from "@/lib/api/base/api-client";
import {
  ReviewListResponse,
  ReviewResponse,
  SubmitReviewBody,
} from "@/types/review.types";

export class ReviewAPI extends APIClient {
  async submitReview(
    bookingId: string,
    body: SubmitReviewBody,
  ): Promise<ReviewResponse> {
    return this.post<ReviewResponse>(
      `/api/bookings/${bookingId}/review`,
      body,
    );
  }

  async getProviderReviews(
    providerProfileId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ReviewListResponse> {
    return this.get<ReviewListResponse>(
      `/api/providers/${providerProfileId}/reviews`,
      params,
    );
  }
}

export const reviewAPI = new ReviewAPI();
