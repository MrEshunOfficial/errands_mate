import { Badge } from "@/components/ui/badge";
import {
  BookingStatus,
  PaymentStatus,
} from "@/types/booking/booking.types";
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "./constants";

export function BookingStatusBadge({ status }: { status: BookingStatus | string }) {
  const meta = BOOKING_STATUS_CONFIG[status as BookingStatus];
  if (!meta) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const meta = PAYMENT_STATUS_CONFIG[status as PaymentStatus];
  if (!meta) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
