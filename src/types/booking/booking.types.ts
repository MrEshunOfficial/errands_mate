// Admin-extended booking types
// These extend the base types in @/types/booking.types with additional admin-only
// fields and richer populated shapes returned by admin API endpoints.

import { UserLocation } from "@/types/location.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  RESCHEDULE_REQUESTED = "RESCHEDULE_REQUESTED",
  IN_PROGRESS = "IN_PROGRESS",
  AWAITING_VALIDATION = "AWAITING_VALIDATION",
  VALIDATED = "VALIDATED",
  DISPUTED = "DISPUTED",
  REBUTTAL_SUBMITTED = "REBUTTAL_SUBMITTED",
  COMPLETED = "COMPLETED",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  DEPOSIT_PAID = "DEPOSIT_PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}

// ─── Populated sub-types ──────────────────────────────────────────────────────

export interface PopulatedClient {
  _id: string;
  email: string;
  name?: string;
}

export interface PopulatedProvider {
  _id: string;
  businessName?: string;
  providerStatus?: string;
  locationData?: UserLocation;
  providerContactInfo?: {
    primaryContact?: string;
    businessContact?: string;
    businessEmail?: string;
  };
}

export interface PopulatedService {
  _id: string;
  title: string;
  slug: string;
}

export interface PopulatedTask {
  _id: string;
  title: string;
}

export interface PopulatedServiceRequest {
  _id: string;
  clientMessage?: string;
  source?: string;
}

// ─── Core Booking entity (admin-enriched) ─────────────────────────────────────

export interface Booking {
  _id: string;
  id?: string;
  createdAt: string;
  updatedAt: string;

  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;

  bookingNumber: string;
  providerRequestId: string | PopulatedServiceRequest;

  clientId: string | PopulatedClient;
  providerId: string | PopulatedProvider;
  providerProfileId: string | PopulatedProvider;
  serviceId: string | PopulatedService;
  taskId?: string | PopulatedTask;
  serviceRequestId?: string | PopulatedServiceRequest;

  serviceLocation: UserLocation;
  scheduledDate: string;
  scheduledTimeSlot: { start: string; end: string };
  serviceDescription: string;
  specialInstructions?: string;

  estimatedPrice?: number;
  finalPrice?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  currency: string;

  status: BookingStatus;
  paymentStatus?: PaymentStatus;

  // Dispute/rebuttal snapshots (may be present in admin-populated responses)
  disputeReason?: string;
  rebuttalMessage?: string;

  attemptCount: number;
  currentAttemptId?: string;

  finalOutcome?: {
    closedAt: string;
    resolution: "completed" | "admin_resolved" | "cancelled";
    adminOutcome?: string;
  };

  isActive?: boolean;
  isCompleted?: boolean;
  isCancelled?: boolean;
  isAwaitingValidation?: boolean;
  isDisputed?: boolean;
  isUpcoming?: boolean;
  isPastDue?: boolean;

  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;

  validatedAt?: string;
  disputedAt?: string;
  rebuttalAt?: string;

  depositRemaining?: number;
  balanceRemaining?: number;

  providerMessage?: string;
  customerRating?: number;
  customerReview?: string;

  statusHistory?: Array<{
    status: string;
    timestamp: string;
    actorRole?: string;
    actor?: string;
    reason?: string;
    message?: string;
  }>;
}

// ─── Populated Booking ────────────────────────────────────────────────────────

export interface PopulatedBooking extends Omit<Booking, "clientId" | "providerId" | "providerProfileId" | "serviceId"> {
  clientId: PopulatedClient;
  providerId: PopulatedProvider;
  providerProfileId: PopulatedProvider;
  serviceId: PopulatedService;
}

// ─── API Params ───────────────────────────────────────────────────────────────

export interface BookingListParams {
  status?: BookingStatus | string;
  paymentStatus?: PaymentStatus | string;
  clientId?: string;
  providerId?: string;
  includeDeleted?: boolean;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface BookingListResponse {
  success: boolean;
  message?: string;
  bookings?: Partial<Booking>[];
  total?: number;
  error?: string;
}

export interface BookingDetailResponse {
  success: boolean;
  message?: string;
  booking?: Booking | PopulatedBooking;
  error?: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface BookingStats {
  total: number;
  CONFIRMED?: number;
  RESCHEDULE_REQUESTED?: number;
  IN_PROGRESS?: number;
  AWAITING_VALIDATION?: number;
  VALIDATED?: number;
  DISPUTED?: number;
  REBUTTAL_SUBMITTED?: number;
  COMPLETED?: number;
  RESOLVED?: number;
  CANCELLED?: number;
  openDisputes?: number;
  pendingRebuttals?: number;
}

export interface BookingStatsResponse {
  success: boolean;
  stats: BookingStats;
}

// ─── Action Input Types ───────────────────────────────────────────────────────

export interface ValidateBookingInput {
  approved: boolean;
  rating?: number;
  review?: string;
  disputeReason?: string;
}

export interface ResolveDisputeInput {
  resolution: "approve" | "complete";
  notes?: string;
}

export interface ProposeRescheduleInput {
  newDate: string;
  newTimeSlot?: { start: string; end: string };
  message?: string;
}
