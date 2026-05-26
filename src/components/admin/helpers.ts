import type {
  Booking,
  PopulatedBooking,
  PopulatedClient,
  PopulatedProvider,
  PopulatedService,
  PopulatedTask,
  PopulatedServiceRequest,
} from "@/types/booking/booking.types";

export type BookingRowData = Booking | PopulatedBooking;

// ─── Per-field type guards ────────────────────────────────────────────────────

function isPopulatedClient(v: unknown): v is PopulatedClient {
  return typeof v === "object" && v !== null && "_id" in v;
}

function isPopulatedProvider(v: unknown): v is PopulatedProvider {
  return typeof v === "object" && v !== null && "_id" in v;
}

function isPopulatedService(v: unknown): v is PopulatedService {
  return typeof v === "object" && v !== null && "title" in v;
}

function isPopulatedTask(v: unknown): v is PopulatedTask {
  return typeof v === "object" && v !== null && "title" in v;
}

function isPopulatedServiceRequest(v: unknown): v is PopulatedServiceRequest {
  return typeof v === "object" && v !== null && "_id" in v;
}

// ─── Top-level isPopulated ────────────────────────────────────────────────────

export function isPopulated(b: BookingRowData): b is PopulatedBooking {
  return isPopulatedProvider(b.providerId);
}

// ─── Client ───────────────────────────────────────────────────────────────────

export function getClientName(b: BookingRowData): string {
  if (isPopulatedClient(b.clientId)) return b.clientId.name ?? "—";
  if (b.clientId == null) return "—";
  return String(b.clientId);
}

export function getClientEmail(b: BookingRowData): string | undefined {
  if (isPopulatedClient(b.clientId)) return b.clientId.email;
  return undefined;
}

export function getClientId(b: BookingRowData): string | null {
  if (isPopulatedClient(b.clientId)) return b.clientId._id;
  return b.clientId ?? null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function getProviderName(b: BookingRowData): string {
  if (isPopulatedProvider(b.providerId))
    return b.providerId.businessName ?? "—";
  if (!b.providerId) return "—";
  return String(b.providerId);
}

export function getProviderContact(b: BookingRowData): string | undefined {
  if (isPopulatedProvider(b.providerId)) {
    return (
      b.providerId.providerContactInfo?.primaryContact ??
      b.providerId.providerContactInfo?.businessContact
    );
  }
  return undefined;
}

export function getProviderEmail(b: BookingRowData): string | undefined {
  if (isPopulatedProvider(b.providerId)) {
    return b.providerId.providerContactInfo?.businessEmail;
  }
  return undefined;
}

export function getProviderId(b: BookingRowData): string {
  if (isPopulatedProvider(b.providerId)) return b.providerId._id;
  return String(b.providerId);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export function getServiceTitle(b: BookingRowData): string {
  if (isPopulatedService(b.serviceId)) return b.serviceId.title ?? "—";
  return "—";
}

export function getServiceSlug(b: BookingRowData): string | undefined {
  if (isPopulatedService(b.serviceId)) return b.serviceId.slug;
  return undefined;
}

export function getServiceId(b: BookingRowData): string {
  if (isPopulatedService(b.serviceId)) return b.serviceId._id;
  return String(b.serviceId);
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export function getTaskTitle(b: BookingRowData): string | undefined {
  if (b.taskId == null) return undefined;
  if (isPopulatedTask(b.taskId)) return b.taskId.title;
  return undefined;
}

// ─── Service Request ──────────────────────────────────────────────────────────

export function getServiceRequestMessage(b: BookingRowData): string | undefined {
  if (b.serviceRequestId == null) return undefined;
  if (isPopulatedServiceRequest(b.serviceRequestId))
    return b.serviceRequestId.clientMessage;
  return undefined;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatPrice(
  amount: number | undefined | null,
  currency?: string,
  prefix = "",
): string {
  if (amount == null) return "—";
  return `${prefix}${currency ?? ""} ${Number(amount).toLocaleString()}`.trim();
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB");
}

// ─── Revenue helpers ──────────────────────────────────────────────────────────

/** Effective amount for revenue calculations: finalPrice > estimatedPrice */
export function getEffectiveAmount(b: BookingRowData): number | null {
  if (b.finalPrice != null) return b.finalPrice;
  if (b.estimatedPrice != null) return b.estimatedPrice;
  return null;
}

/** Sum of effective amounts across a list */
export function sumRevenue(bookings: BookingRowData[]): number {
  return bookings.reduce((acc, b) => acc + (getEffectiveAmount(b) ?? 0), 0);
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Days since a given ISO timestamp */
export function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Is a scheduled booking overdue (past scheduled date with no completion)? */
export function isOverdue(b: BookingRowData): boolean {
  if (!b.scheduledDate) return false;
  if (b.isCompleted || b.isCancelled) return false;
  return new Date(b.scheduledDate) < new Date();
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function escapeCsv(val: string | number | undefined | null): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  "Booking #",
  "Client",
  "Client Email",
  "Provider",
  "Provider Email",
  "Service",
  "Status",
  "Payment Status",
  "Scheduled Date",
  "Estimated Price",
  "Final Price",
  "Currency",
  "Created At",
  "Is Deleted",
];

export function exportBookingsToCsv(
  bookings: BookingRowData[],
  filename = "bookings-export.csv",
): void {
  const rows = bookings.map((b) => [
    escapeCsv(b.bookingNumber),
    escapeCsv(getClientName(b)),
    escapeCsv(getClientEmail(b)),
    escapeCsv(getProviderName(b)),
    escapeCsv(getProviderEmail(b)),
    escapeCsv(getServiceTitle(b)),
    escapeCsv(b.status),
    escapeCsv(b.paymentStatus),
    escapeCsv(b.scheduledDate ? formatDate(b.scheduledDate) : undefined),
    escapeCsv(b.estimatedPrice),
    escapeCsv(b.finalPrice),
    escapeCsv(b.currency),
    escapeCsv(formatDateTime(b.createdAt)),
    escapeCsv(b.isDeleted ? "Yes" : "No"),
  ]);

  const csvContent = [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Urgency scoring (for sort/priority) ──────────────────────────────────────

import { BookingStatus } from "@/types/booking/booking.types";

const STATUS_URGENCY: Partial<Record<BookingStatus, number>> = {
  [BookingStatus.DISPUTED]: 100,
  [BookingStatus.REBUTTAL_SUBMITTED]: 90,
  [BookingStatus.AWAITING_VALIDATION]: 70,
  [BookingStatus.IN_PROGRESS]: 50,
  [BookingStatus.CONFIRMED]: 30,
};

export function getUrgencyScore(b: BookingRowData): number {
  const base = STATUS_URGENCY[b.status as BookingStatus] ?? 0;
  // Boost if overdue
  const overduePenalty = isOverdue(b) ? 20 : 0;
  return base + overduePenalty;
}
