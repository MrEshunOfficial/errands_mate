export interface Review {
  _id: string;
  bookingId: string;
  clientId: { _id: string; email: string } | string;
  providerId: string;
  providerProfileId: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResponse {
  success: boolean;
  message: string;
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}


