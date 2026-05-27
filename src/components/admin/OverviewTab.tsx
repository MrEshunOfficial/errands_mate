"use client";

import {
  BookingRowData,
  getServiceTitle,
  getClientName,
  getProviderName,
  formatPrice,
  formatDateTime,
} from "./helpers";

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] text-sm">
      <div className="px-3 pt-2 pb-0.5 sm:py-2 bg-muted/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="px-3 pb-2 pt-0.5 sm:py-2 break-words">{value}</div>
    </div>
  );
}

interface OverviewTabProps {
  booking: BookingRowData;
}

export function OverviewTab({ booking }: OverviewTabProps) {
  const rows: [string, string][] = [
    ["Booking #", booking.bookingNumber ?? "—"],
    ["Service", getServiceTitle(booking)],
    ["Client", getClientName(booking)],
    ["Provider", getProviderName(booking)],
    [
      "Scheduled",
      booking.scheduledDate
        ? new Date(booking.scheduledDate).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—",
    ],
    [
      "Time Slot",
      booking.scheduledTimeSlot
        ? `${booking.scheduledTimeSlot.start}${booking.scheduledTimeSlot.end ? ` – ${booking.scheduledTimeSlot.end}` : ""}`
        : "—",
    ],
    ["Est. Price", formatPrice(booking.estimatedPrice, booking.currency)],
    ["Final Price", formatPrice(booking.finalPrice, booking.currency)],
    [
      "Deposit",
      booking.depositAmount != null
        ? `${formatPrice(booking.depositAmount, booking.currency)} (${booking.depositPaid ? "Paid" : "Unpaid"})`
        : "—",
    ],
    [
      "Deposit Remaining",
      formatPrice(booking.depositRemaining, booking.currency),
    ],
    [
      "Balance Remaining",
      formatPrice(booking.balanceRemaining, booking.currency),
    ],
    [
      "Origin",
      booking.taskId
        ? "Task"
        : booking.serviceRequestId
          ? "Service Request"
          : "Direct",
    ],
    ["Created", formatDateTime(booking.createdAt)],
    ["Updated", formatDateTime(booking.updatedAt)],
    ...(booking.confirmedAt
      ? ([["Confirmed At", formatDateTime(booking.confirmedAt)]] as [
          string,
          string,
        ][])
      : []),
    ...(booking.startedAt
      ? ([["Started At", formatDateTime(booking.startedAt)]] as [
          string,
          string,
        ][])
      : []),
    ...(booking.completedAt
      ? ([["Completed At", formatDateTime(booking.completedAt)]] as [
          string,
          string,
        ][])
      : []),
    ...(booking.cancelledAt
      ? ([["Cancelled At", formatDateTime(booking.cancelledAt)]] as [
          string,
          string,
        ][])
      : []),
    ...(booking.validatedAt
      ? ([["Validated At", formatDateTime(booking.validatedAt)]] as [
          string,
          string,
        ][])
      : []),
    ...(booking.disputedAt
      ? ([["Disputed At", formatDateTime(booking.disputedAt)]] as [
          string,
          string,
        ][])
      : []),
  ];

  return (
    <div className="space-y-3">
      {booking.serviceDescription && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase">
            Service Description
          </p>
          <p className="leading-relaxed">{booking.serviceDescription}</p>
        </div>
      )}

      {booking.specialInstructions && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
          <p className="text-xs font-mono text-amber-600 mb-1 uppercase">
            Special Instructions
          </p>
          <p className="text-amber-900 leading-relaxed">
            {booking.specialInstructions}
          </p>
        </div>
      )}

      {booking.disputeReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
          <p className="text-xs font-mono text-red-500 mb-1 uppercase">
            Dispute Reason
          </p>
          <p className="text-red-900 leading-relaxed">
            {booking.disputeReason}
          </p>
        </div>
      )}

      {booking.rebuttalMessage && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
          <p className="text-xs font-mono text-blue-600 mb-1 uppercase">
            Provider Rebuttal
          </p>
          <p className="text-blue-900 leading-relaxed">
            {booking.rebuttalMessage}
          </p>
          {booking.rebuttalAt && (
            <p className="text-xs text-blue-400 mt-1">
              Submitted: {formatDateTime(booking.rebuttalAt)}
            </p>
          )}
        </div>
      )}

      {booking.providerMessage && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase">
            Provider Message
          </p>
          <p className="leading-relaxed">{booking.providerMessage}</p>
        </div>
      )}

      {booking.cancellationReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
          <p className="text-xs font-mono text-red-500 mb-1 uppercase">
            Cancellation Reason
          </p>
          <p className="text-red-900 leading-relaxed">
            {booking.cancellationReason}
          </p>
          {booking.cancelledBy && (
            <p className="text-xs text-red-400 mt-1">
              Cancelled by: {booking.cancelledBy}
            </p>
          )}
        </div>
      )}

      {booking.customerRating != null && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase">
            Customer Rating
          </p>
          <p className="font-semibold">{booking.customerRating} / 5</p>
          {booking.customerReview && (
            <p className="text-muted-foreground mt-1 text-xs">
              {booking.customerReview}
            </p>
          )}
        </div>
      )}

      {booking.isDeleted && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
          <p className="text-xs font-mono text-destructive mb-1 uppercase">
            ⚠ Soft Deleted
          </p>
          {booking.deletedAt && (
            <p className="text-destructive/80">
              Deleted at: {formatDateTime(booking.deletedAt)}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden divide-y">
        {rows.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
