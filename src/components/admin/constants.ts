import { BookingStatus, PaymentStatus } from "@/types/booking/booking.types";

// ─── Badge Variant Maps ───────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BookingStatusMeta {
  variant: BadgeVariant;
  label: string;
  color: string;         // Tailwind text color for timeline / charts
  bgColor: string;       // Tailwind bg for chips
  icon: string;          // Emoji fallback icon for plain-text contexts
  description: string;   // Human-readable for admin tooltips
  isTerminal: boolean;
  allowedTransitions: BookingStatus[];
}

export interface PaymentStatusMeta {
  variant: BadgeVariant;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, BookingStatusMeta> = {
  [BookingStatus.CONFIRMED]: {
    variant: "default",
    label: "Confirmed",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    icon: "✅",
    description: "Booking confirmed, awaiting service start",
    isTerminal: false,
    allowedTransitions: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  },
  [BookingStatus.IN_PROGRESS]: {
    variant: "secondary",
    label: "In Progress",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    icon: "▶️",
    description: "Service is currently being delivered",
    isTerminal: false,
    allowedTransitions: [BookingStatus.AWAITING_VALIDATION, BookingStatus.CANCELLED],
  },
  [BookingStatus.AWAITING_VALIDATION]: {
    variant: "outline",
    label: "Awaiting Validation",
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-950",
    icon: "👁️",
    description: "Service completed — waiting for client to validate",
    isTerminal: false,
    allowedTransitions: [BookingStatus.VALIDATED, BookingStatus.DISPUTED],
  },
  [BookingStatus.VALIDATED]: {
    variant: "default",
    label: "Validated",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    icon: "✔️",
    description: "Client approved — moving to payment / completion",
    isTerminal: false,
    allowedTransitions: [BookingStatus.COMPLETED],
  },
  [BookingStatus.DISPUTED]: {
    variant: "destructive",
    label: "Disputed",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-950",
    icon: "⚠️",
    description: "Client raised a dispute — requires admin resolution",
    isTerminal: false,
    allowedTransitions: [BookingStatus.VALIDATED, BookingStatus.COMPLETED, BookingStatus.REBUTTAL_SUBMITTED],
  },
  [BookingStatus.REBUTTAL_SUBMITTED]: {
    variant: "outline",
    label: "Rebuttal Submitted",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    icon: "📝",
    description: "Provider submitted a rebuttal — admin review pending",
    isTerminal: false,
    allowedTransitions: [BookingStatus.VALIDATED, BookingStatus.COMPLETED],
  },
  [BookingStatus.COMPLETED]: {
    variant: "secondary",
    label: "Completed",
    color: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-950",
    icon: "🎉",
    description: "Booking fully completed and closed",
    isTerminal: true,
    allowedTransitions: [],
  },
  [BookingStatus.CANCELLED]: {
    variant: "outline",
    label: "Cancelled",
    color: "text-zinc-500",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    icon: "🚫",
    description: "Booking was cancelled",
    isTerminal: true,
    allowedTransitions: [],
  },
  [BookingStatus.RESOLVED]: {
    variant: "secondary",
    label: "Resolved",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-950",
    icon: "⚖️",
    description: "Dispute resolved by admin",
    isTerminal: true,
    allowedTransitions: [],
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusMeta> = {
  [PaymentStatus.PENDING]: {
    variant: "outline",
    label: "Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    icon: "⏳",
  },
  [PaymentStatus.DEPOSIT_PAID]: {
    variant: "secondary",
    label: "Deposit Paid",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    icon: "💰",
  },
  [PaymentStatus.PARTIALLY_PAID]: {
    variant: "outline",
    label: "Partial",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    icon: "🔶",
  },
  [PaymentStatus.PAID]: {
    variant: "default",
    label: "Paid",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    icon: "✅",
  },
  [PaymentStatus.REFUNDED]: {
    variant: "secondary",
    label: "Refunded",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    icon: "↩️",
  },
  [PaymentStatus.FAILED]: {
    variant: "destructive",
    label: "Failed",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-950",
    icon: "❌",
  },
};

export const ALL_BOOKING_STATUSES = Object.values(BookingStatus);
export const ALL_PAYMENT_STATUSES = Object.values(PaymentStatus);

// ─── Terminal statuses that block transitions ─────────────────────────────────

export const TERMINAL_STATUSES = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
]);

// ─── Priority ordering for admin attention ────────────────────────────────────
// Lower index = higher urgency shown first in admin views

export const ADMIN_PRIORITY_ORDER: BookingStatus[] = [
  BookingStatus.DISPUTED,
  BookingStatus.REBUTTAL_SUBMITTED,
  BookingStatus.AWAITING_VALIDATION,
  BookingStatus.IN_PROGRESS,
  BookingStatus.CONFIRMED,
  BookingStatus.VALIDATED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
];
