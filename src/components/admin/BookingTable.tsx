"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { BookingStatusBadge, PaymentStatusBadge } from "./BookingBadges";
import {
  getClientName,
  getClientEmail,
  getProviderName,
  getServiceTitle,
  formatPrice,
  isOverdue,
  type BookingRowData,
} from "./helpers";
import { BookingStatus } from "@/types/booking/booking.types";

// ─── Empty / Error States ─────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      )}
    </div>
  );
}

// ─── Row urgency class ────────────────────────────────────────────────────────

function rowUrgencyClass(booking: BookingRowData, selected: boolean): string {
  if (selected) return "bg-accent";
  if (
    booking.status === BookingStatus.DISPUTED ||
    booking.status === BookingStatus.REBUTTAL_SUBMITTED
  ) {
    return "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/30 border-l-2 border-l-red-400";
  }
  if (isOverdue(booking)) {
    return "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30";
  }
  return "hover:bg-muted/40";
}

// ─── Single Row ───────────────────────────────────────────────────────────────

interface BookingRowProps {
  booking: BookingRowData;
  selected: boolean;
  onSelect: (b: BookingRowData) => void;
}

export function BookingTableRow({ booking, selected, onSelect }: BookingRowProps) {
  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const price =
    booking.finalPrice != null
      ? formatPrice(booking.finalPrice, booking.currency)
      : booking.estimatedPrice != null
        ? formatPrice(booking.estimatedPrice, booking.currency, "~")
        : "—";

  const overdue = isOverdue(booking);

  return (
    <TableRow
      className={`cursor-pointer transition-colors ${rowUrgencyClass(booking, selected)}`}
      onClick={() => onSelect(booking)}
    >
      <TableCell className="font-mono text-xs text-blue-600 font-semibold">
        {booking.bookingNumber ?? "N/A"}
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{getClientName(booking)}</div>
        {getClientEmail(booking) && (
          <div className="text-xs text-muted-foreground">
            {getClientEmail(booking)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm">{getProviderName(booking)}</TableCell>
      <TableCell className="text-sm max-w-32 truncate">
        {getServiceTitle(booking)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <div className="text-sm">{scheduledDate}</div>
          {overdue && (
            <AlertTriangle
              className="h-3 w-3 text-amber-500 shrink-0"
              aria-label="Overdue"
            />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {booking.scheduledTimeSlot?.start ?? ""}
          {booking.scheduledTimeSlot?.end
            ? ` – ${booking.scheduledTimeSlot.end}`
            : ""}
        </div>
      </TableCell>
      <TableCell>
        <BookingStatusBadge status={booking.status} />
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={booking.paymentStatus ?? ""} />
      </TableCell>
      <TableCell className="text-sm font-semibold">{price}</TableCell>
      {booking.isDeleted && (
        <TableCell>
          <span className="text-xs text-destructive font-mono">DELETED</span>
        </TableCell>
      )}
    </TableRow>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

const TABLE_HEADERS = [
  "Booking #",
  "Client",
  "Provider",
  "Service",
  "Scheduled",
  "Status",
  "Payment",
  "Price",
];

interface BookingTableProps {
  bookings: BookingRowData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onSelect: (b: BookingRowData) => void;
  onRetry: () => void;
}

export function BookingTable({
  bookings,
  selectedId,
  loading,
  error,
  emptyMessage,
  onSelect,
  onRetry,
}: BookingTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (bookings.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-muted/50 z-[1]">
        <TableRow>
          {TABLE_HEADERS.map((h) => (
            <TableHead
              key={h}
              className="text-xs font-mono uppercase tracking-wide text-muted-foreground"
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b, i) => (
          <BookingTableRow
            key={String(b._id) || i}
            booking={b}
            selected={selectedId != null && String(b._id) === selectedId}
            onSelect={onSelect}
          />
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface BookingPaginationProps {
  skip: number;
  limit: number;
  total: number;
  onChange: (skip: number) => void;
}

export function BookingPagination({
  skip,
  limit,
  total,
  onChange,
}: BookingPaginationProps) {
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = skip + 1;
  const endItem = Math.min(skip + limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t text-sm text-muted-foreground">
      <span className="text-xs">
        Showing {startItem}–{endItem} of{" "}
        <span className="font-semibold text-foreground">
          {total.toLocaleString()}
        </span>{" "}
        booking{total !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(0, skip - limit))}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <span className="text-xs px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(skip + limit)}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
