import { APIClient } from "@/lib/api/base/api-client";
import {
  ReviewListResponse,
} from "@/types/review.types";

export class ReviewAPI extends APIClient {
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
