import { ActorRole } from "./base.types";
import { UserLocation } from "./location.types";
import { AdminResolutionOutcome } from "./completion-attempt.types";
import { RequestSource } from "./provider.request.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  AWAITING_VALIDATION = "AWAITING_VALIDATION",
  DISPUTED = "DISPUTED",
  REBUTTAL_SUBMITTED = "REBUTTAL_SUBMITTED",
  COMPLETED = "COMPLETED",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

// ─── Status History ───────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  status: BookingStatus;
  timestamp: string;
  actor?: string;
  actorRole?: ActorRole;
  reason?: string;
  message?: string;
}

// ─── Booking Entity ───────────────────────────────────────────────────────────

export interface Booking {
  _id: string;
  id?: string;
  createdAt: string;
  updatedAt: string;

  // Soft-delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;

  bookingNumber: string;
  providerRequestId: string;

  clientId: string;
  providerId: string;
  providerProfileId: string;
  serviceId: string;

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
  statusHistory: StatusHistoryEntry[];

  attemptCount: number;
  currentAttemptId?: string;

  finalOutcome?: {
    closedAt: string;
    resolution: "completed" | "admin_resolved" | "cancelled";
    adminOutcome?: Exclude<AdminResolutionOutcome, AdminResolutionOutcome.REDO>;
  };

  // Server-computed virtuals — present in API responses
  isActive?: boolean;
  isConfirmed?: boolean;
  isInProgress?: boolean;
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
  durationInDays?: number | null;
}

// ─── API Request Bodies ───────────────────────────────────────────────────────

export interface SubmitProofRequestBody {
  attemptId?: string;
  notes?: string;
  images: string[];
}

export interface RescheduleBookingRequestBody {
  newDate: string;
  newTimeSlot?: { start: string; end: string };
}

export interface CancelBookingRequestBody {
  reason: string;
}

// ─── Booking Detail Context ───────────────────────────────────────────────────

export interface TaskContextSnapshot {
  title?: string;
  description?: string;
  tags?: string[];
  attachments?: Array<{
    _id: string;
    url: string;
    thumbnailUrl?: string;
    fileName?: string;
  }>;
  location?: {
    ghanaPostGPS?: string;
    nearbyLandmark?: string;
    locality?: string;
    city?: string;
    district?: string;
    region?: string;
  };
}

export interface BookingDetailContext {
  viewer: "client" | "provider" | "admin";
  taskContext?: TaskContextSnapshot;
  providerProposedSchedule?: {
    preferredDate: string;
    timeSlot: { start: string; end: string };
    message?: string;
    proposedAt: string;
  };
  providerDetails?: {
    businessName?: string;
    mainContact?: string;
    profilePicture?: { url: string; thumbnailUrl?: string };
  };
  clientDetails?: {
    name?: string;
    mainContact?: string;
    profilePicture?: { url: string; thumbnailUrl?: string };
  };
}

// ─── Booking With Context ─────────────────────────────────────────────────────

export interface BookingWithContext {
  booking: Booking;
  context?: BookingDetailContext;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface BookingResponse {
  success: boolean;
  message: string;
  booking?: Partial<Booking>;
  context?: BookingDetailContext;
  error?: string;
}

export interface BookingListResponse {
  success: boolean;
  message: string;
  bookings?: Partial<Booking>[];
  total?: number;
  error?: string;
}

// ─── Populated Booking ────────────────────────────────────────────────────────

export interface PopulatedBooking
  extends Omit<
    Booking,
    "clientId" | "providerId" | "providerProfileId" | "serviceId" | "providerRequestId"
  > {
  clientId: {
    _id: string;
    email: string;
  };

  providerId: {
    _id: string;
    email: string;
  };

  providerProfileId: {
    _id: string;
    businessName?: string;
    locationData: UserLocation;
    providerStatus: string;
  };

  serviceId: {
    _id: string;
    title: string;
    slug: string;
  };

  providerRequestId: {
    _id: string;
    source: RequestSource;
    taskId?: string;
    serviceId?: string;
    clientMessage?: string;
  };
}
