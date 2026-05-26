import { BookingStatus } from "./booking.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AttemptStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DISPUTED = "DISPUTED",
  REBUTTAL_PENDING = "REBUTTAL_PENDING",
  ADMIN_RESOLVED = "ADMIN_RESOLVED",
}

export enum AdminResolutionOutcome {
  REDO = "REDO",
  CLIENT_FAVOUR = "CLIENT_FAVOUR",
  PROVIDER_FAVOUR = "PROVIDER_FAVOUR",
  SPLIT = "SPLIT",
}

// ─── Completion Attempt Entity ────────────────────────────────────────────────

export interface CompletionAttempt {
  _id: string;
  id?: string;
  createdAt: string;
  updatedAt: string;

  bookingId: string;
  attemptNumber: number;

  proof: {
    submittedAt: string;
    notes?: string;
    images: string[];
  };

  status: AttemptStatus;

  // Present when status is ACCEPTED or DISPUTED
  clientResponse?: {
    respondedAt: string;
    rating?: number;
    review?: string;
  };

  dispute?: {
    raisedAt: string;
    reason: string;
    evidence?: string[];
  };

  rebuttal?: {
    submittedAt: string;
    message: string;
    attachments?: string[];
  };

  // Written by admin when both parties can't resolve the dispute
  adminResolution?: {
    resolvedAt: string;
    resolvedBy: string;
    outcome: AdminResolutionOutcome;
    notes?: string;
  };
}

// ─── API Request Bodies ───────────────────────────────────────────────────────

// Discriminated union — rating is required on approval, disputeReason on rejection
export type RespondToProofRequestBody =
  | { approved: true; rating: number; review?: string; disputeReason?: never }
  | { approved: false; disputeReason: string; rating?: never; review?: never };

export interface SubmitRebuttalRequestBody {
  message: string;
  attachments?: string[];
}

export interface AdminResolveDisputeRequestBody {
  outcome: AdminResolutionOutcome;
  notes?: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface CompletionAttemptResponse {
  success: boolean;
  message: string;
  attempt?: Partial<CompletionAttempt>;
  // Present when adminResolution.outcome === REDO
  newAttempt?: Partial<CompletionAttempt>;
  bookingStatus?: BookingStatus;
  error?: string;
}

export interface CompletionAttemptListResponse {
  success: boolean;
  message: string;
  attempts: Partial<CompletionAttempt>[];
  error?: string;
}
