"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Clock,
  CreditCard,
  MessageSquareWarning,
  BadgeCheck,
} from "lucide-react";
import {
  BookingStatus,
  PaymentStatus,
  type ValidateBookingInput,
  type ResolveDisputeInput,
  type RescheduleBookingInput,
} from "@/types/booking/booking.types";
import { ALL_PAYMENT_STATUSES, PAYMENT_STATUS_CONFIG, BOOKING_STATUS_CONFIG } from "./constants";
import { BookingRowData, formatPrice, isOverdue, daysSince } from "./helpers";

// ─── Section Box ──────────────────────────────────────────────────────────────

function SectionBox({
  title,
  icon: Icon,
  children,
  variant = "default",
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  variant?: "default" | "danger" | "warning" | "success";
}) {
  const variantStyles = {
    default: "border bg-muted/20",
    danger: "border border-destructive/30 bg-destructive/5",
    warning: "border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20",
    success: "border border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-950/20",
  };

  return (
    <div className={`rounded-lg p-3 space-y-3 ${variantStyles[variant]}`}>
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Booking quick-facts strip ────────────────────────────────────────────────

function BookingQuickFacts({ booking }: { booking: BookingRowData }) {
  const overdue = isOverdue(booking);
  const age = daysSince(booking.createdAt);
  const statusMeta = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-0.5">
        <p className="text-muted-foreground font-mono uppercase tracking-wide text-[10px]">
          Booking Age
        </p>
        <p className="font-semibold">{age != null ? `${age}d` : "—"}</p>
      </div>
      <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-0.5">
        <p className="text-muted-foreground font-mono uppercase tracking-wide text-[10px]">
          Status
        </p>
        <p className={`font-semibold ${statusMeta?.color ?? ""}`}>
          {statusMeta?.label ?? booking.status}
        </p>
      </div>
      <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-0.5">
        <p className="text-muted-foreground font-mono uppercase tracking-wide text-[10px]">
          Effective Price
        </p>
        <p className="font-semibold">
          {formatPrice(booking.finalPrice ?? booking.estimatedPrice, booking.currency)}
        </p>
      </div>
      <div
        className={`rounded-md px-2.5 py-2 space-y-0.5 ${
          overdue
            ? "bg-red-100 dark:bg-red-950/40"
            : "bg-muted/40"
        }`}
      >
        <p className="text-muted-foreground font-mono uppercase tracking-wide text-[10px]">
          Overdue
        </p>
        <p className={`font-semibold ${overdue ? "text-red-600" : ""}`}>
          {overdue ? "⚠ Yes" : "No"}
        </p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActionsTabProps {
  booking: BookingRowData;
  isTerminal: boolean;
  mutating: boolean;
  onStartService: () => void;
  onCompleteService: (finalPrice?: number) => void;
  onCancelBooking: () => void;
  onDeleteBooking: () => void;
  onRestoreBooking: () => void;
  onValidateCompletion: (input: ValidateBookingInput) => void;
  onResolveDispute: (input: ResolveDisputeInput) => void;
  onSubmitRebuttal: (message: string) => void;
  onUpdatePaymentStatus: (status: PaymentStatus) => void;
  onReschedule: (input: RescheduleBookingInput) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActionsTab({
  booking,
  isTerminal,
  mutating,
  onStartService,
  onCompleteService,
  onCancelBooking,
  onDeleteBooking,
  onRestoreBooking,
  onValidateCompletion,
  onResolveDispute,
  onSubmitRebuttal,
  onUpdatePaymentStatus,
  onReschedule,
}: ActionsTabProps) {
  const status = booking.status;

  // ── State ──────────────────────────────────────────────────────────────────
  const [finalPrice, setFinalPrice] = useState(
    booking.estimatedPrice != null ? String(booking.estimatedPrice) : "",
  );
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus | "">(
    "",
  );

  // Validate completion form
  const [validateApproved, setValidateApproved] = useState<"true" | "false">(
    "true",
  );
  const [validateRating, setValidateRating] = useState("5");
  const [validateReview, setValidateReview] = useState("");
  const [validateDisputeReason, setValidateDisputeReason] = useState("");

  // Resolve dispute
  const [resolveResolution, setResolveResolution] = useState<
    "approve" | "complete"
  >("approve");
  const [resolveNotes, setResolveNotes] = useState("");

  // Rebuttal
  const [rebuttalMessage, setRebuttalMessage] = useState("");

  // Reschedule
  const [rescheduleDate, setRescheduleDate] = useState(
    booking.scheduledDate ? booking.scheduledDate.slice(0, 10) : "",
  );
  const [rescheduleStart, setRescheduleStart] = useState(
    booking.scheduledTimeSlot?.start ?? "",
  );
  const [rescheduleEnd, setRescheduleEnd] = useState(
    booking.scheduledTimeSlot?.end ?? "",
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleValidate = () => {
    if (validateApproved === "true") {
      onValidateCompletion({
        approved: true,
        rating: Number(validateRating),
        review: validateReview || undefined,
      });
    } else {
      if (!validateDisputeReason.trim()) return;
      onValidateCompletion({
        approved: false,
        disputeReason: validateDisputeReason,
      });
    }
  };

  const handleResolveDispute = () => {
    onResolveDispute({
      resolution: resolveResolution,
      notes: resolveNotes || undefined,
    });
  };

  const handleReschedule = () => {
    if (!rescheduleDate) return;
    onReschedule({
      newDate: rescheduleDate,
      newTimeSlot: rescheduleStart
        ? {
            start: rescheduleStart,
            end: rescheduleEnd || rescheduleStart,
          }
        : undefined,
      actorRole: "admin",
    });
  };

  const canReschedule = [
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
  ].includes(status as BookingStatus);

  const isDifferentPaymentStatus =
    newPaymentStatus && newPaymentStatus !== booking.paymentStatus;

  return (
    <div className="space-y-3">
      {/* ── Quick Facts ─────────────────────────────────────────────────────── */}
      <BookingQuickFacts booking={booking} />

      {/* ── Status Transitions ─────────────────────────────────────────────── */}
      <SectionBox title="Status Transitions" icon={Play}>
        <div className="flex flex-col gap-3">
          {status === BookingStatus.CONFIRMED && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Mark service as started. Provider will be notified.
              </p>
              <Button
                size="sm"
                variant="secondary"
                disabled={mutating}
                onClick={onStartService}
              >
                {mutating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                )}
                Start Service
              </Button>
            </div>
          )}

          {status === BookingStatus.IN_PROGRESS && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Record final price and mark as complete. Client validation period begins.
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder={`Final price (est. ${booking.currency} ${booking.estimatedPrice ?? "—"})`}
                  type="number"
                  min={0}
                  className="h-8 text-sm flex-1"
                />
                <span className="text-xs text-muted-foreground shrink-0">
                  {booking.currency}
                </span>
              </div>
              <Button
                size="sm"
                disabled={mutating}
                onClick={() =>
                  onCompleteService(
                    finalPrice ? Number(finalPrice) : undefined,
                  )
                }
              >
                {mutating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark Complete → Awaiting Validation
              </Button>
            </div>
          )}

          {isTerminal && (
            <p className="text-xs text-muted-foreground">
              Booking is in a terminal state (
              <span className="font-mono">{status}</span>) — no further
              transitions available.
            </p>
          )}

          {!isTerminal &&
            status !== BookingStatus.CONFIRMED &&
            status !== BookingStatus.IN_PROGRESS &&
            status !== BookingStatus.AWAITING_VALIDATION &&
            status !== BookingStatus.DISPUTED &&
            status !== BookingStatus.REBUTTAL_SUBMITTED && (
              <p className="text-xs text-muted-foreground">
                No direct transitions available from{" "}
                <span className="font-mono">{status}</span>.
              </p>
            )}
        </div>
      </SectionBox>

      {/* ── Validate Completion ─────────────────────────────────────────────── */}
      {status === BookingStatus.AWAITING_VALIDATION && (
        <SectionBox
          title="Validate Completion (On Behalf of Client)"
          icon={BadgeCheck}
          variant="warning"
        >
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Admin can approve or raise a dispute on behalf of the client.
            </p>
            <Select
              value={validateApproved}
              onValueChange={(v) =>
                setValidateApproved(v as "true" | "false")
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">✅ Approve Completion</SelectItem>
                <SelectItem value="false">❌ Raise Dispute</SelectItem>
              </SelectContent>
            </Select>

            {validateApproved === "true" ? (
              <>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">
                    Rating
                  </span>
                  <Select value={validateRating} onValueChange={setValidateRating}>
                    <SelectTrigger className="h-8 text-sm flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {"★".repeat(n)}
                          {"☆".repeat(5 - n)} ({n}/5)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <textarea
                  value={validateReview}
                  onChange={(e) => setValidateReview(e.target.value)}
                  placeholder="Optional review comment…"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </>
            ) : (
              <textarea
                value={validateDisputeReason}
                onChange={(e) => setValidateDisputeReason(e.target.value)}
                placeholder="Dispute reason (required)…"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            )}

            <Button
              size="sm"
              disabled={
                mutating ||
                (validateApproved === "false" &&
                  !validateDisputeReason.trim())
              }
              onClick={handleValidate}
              variant={validateApproved === "false" ? "destructive" : "default"}
            >
              {mutating && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              {validateApproved === "true"
                ? "Approve & Validate"
                : "Raise Dispute"}
            </Button>
          </div>
        </SectionBox>
      )}

      {/* ── Submit Rebuttal ─────────────────────────────────────────────────── */}
      {status === BookingStatus.AWAITING_VALIDATION && (
        <SectionBox
          title="Submit Provider Rebuttal"
          icon={MessageSquareWarning}
        >
          <p className="text-xs text-muted-foreground">
            Submit a rebuttal on behalf of the provider if the client is
            unresponsive or their dispute seems unfounded.
          </p>
          <textarea
            value={rebuttalMessage}
            onChange={(e) => setRebuttalMessage(e.target.value)}
            placeholder="Provider rebuttal message…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            disabled={!rebuttalMessage.trim() || mutating}
            onClick={() => onSubmitRebuttal(rebuttalMessage)}
          >
            {mutating && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Submit Rebuttal
          </Button>
        </SectionBox>
      )}

      {/* ── Resolve Dispute ─────────────────────────────────────────────────── */}
      {(status === BookingStatus.DISPUTED ||
        status === BookingStatus.REBUTTAL_SUBMITTED) && (
        <SectionBox
          title="Resolve Dispute"
          icon={ShieldAlert}
          variant="danger"
        >
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Admin resolution is final. Choose who the ruling favours.
            </p>

            {booking.disputeReason && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200/50 px-2.5 py-2 text-xs text-red-700 dark:text-red-400">
                <span className="font-mono uppercase text-[10px] tracking-wide block mb-0.5">
                  Client dispute:
                </span>
                {booking.disputeReason}
              </div>
            )}

            {booking.rebuttalMessage && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 px-2.5 py-2 text-xs text-blue-700 dark:text-blue-400">
                <span className="font-mono uppercase text-[10px] tracking-wide block mb-0.5">
                  Provider rebuttal:
                </span>
                {booking.rebuttalMessage}
              </div>
            )}

            <Select
              value={resolveResolution}
              onValueChange={(v) =>
                setResolveResolution(v as "approve" | "complete")
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">
                  👤 Favour Client (Approve dispute)
                </SelectItem>
                <SelectItem value="complete">
                  🔧 Favour Provider (Mark complete)
                </SelectItem>
              </SelectContent>
            </Select>

            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Admin resolution notes (recommended for audit trail)…"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />

            <Button size="sm" disabled={mutating} onClick={handleResolveDispute}>
              {mutating && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Resolve Dispute
            </Button>
          </div>
        </SectionBox>
      )}

      {/* ── Reschedule ──────────────────────────────────────────────────────── */}
      {canReschedule && (
        <SectionBox title="Reschedule Booking" icon={Clock}>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Current: {booking.scheduledDate?.slice(0, 10)}{" "}
              {booking.scheduledTimeSlot?.start &&
                `@ ${booking.scheduledTimeSlot.start}`}
            </p>
            <div>
              <p className="text-xs text-muted-foreground mb-1">New Date</p>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-8 text-sm"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Start</p>
                <Input
                  type="time"
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">End</p>
                <Input
                  type="time"
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!rescheduleDate || mutating}
              onClick={handleReschedule}
            >
              {mutating && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Reschedule
            </Button>
          </div>
        </SectionBox>
      )}

      {/* ── Payment Status ──────────────────────────────────────────────────── */}
      <SectionBox title="Update Payment Status" icon={CreditCard}>
        <div className="space-y-2">
          <div className="flex gap-2 items-end">
            <Select
              value={newPaymentStatus}
              onValueChange={(v) =>
                setNewPaymentStatus(v as PaymentStatus | "")
              }
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select new status…" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PAYMENT_STATUSES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {PAYMENT_STATUS_CONFIG[v].icon}{" "}
                    {PAYMENT_STATUS_CONFIG[v].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!isDifferentPaymentStatus || mutating}
              onClick={() =>
                newPaymentStatus &&
                onUpdatePaymentStatus(newPaymentStatus as PaymentStatus)
              }
            >
              {mutating && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Update
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current:{" "}
            <span className="font-mono font-semibold">
              {PAYMENT_STATUS_CONFIG[booking.paymentStatus as PaymentStatus]?.label ??
                booking.paymentStatus}
            </span>
          </p>
          {newPaymentStatus &&
            newPaymentStatus === booking.paymentStatus && (
              <p className="text-xs text-amber-600">
                ⚠ Same as current status — no change needed.
              </p>
            )}
        </div>
      </SectionBox>

      {/* ── Cancel ──────────────────────────────────────────────────────────── */}
      {!isTerminal && (
        <SectionBox title="Cancel Booking" variant="danger">
          <p className="text-xs text-muted-foreground">
            Cancels the booking and notifies client and provider. This action
            cannot be undone unless restored.
          </p>
          <Button
            size="sm"
            variant="destructive"
            disabled={mutating}
            onClick={onCancelBooking}
          >
            {mutating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
            )}
            Cancel Booking
          </Button>
        </SectionBox>
      )}

      {/* ── Restore ─────────────────────────────────────────────────────────── */}
      {booking.isDeleted && (
        <SectionBox title="Restore Deleted Booking" variant="success">
          <p className="text-xs text-muted-foreground">
            Re-activates the soft-deleted booking. Status will remain as it was
            before deletion.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={onRestoreBooking}
          >
            {mutating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Restore Booking
          </Button>
        </SectionBox>
      )}

      {/* ── Hard Delete ─────────────────────────────────────────────────────── */}
      <SectionBox title="Permanent Actions" variant="danger">
        <p className="text-xs text-muted-foreground">
          Hard delete permanently removes this booking from the database. This{" "}
          <strong>cannot be undone</strong>.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive hover:bg-destructive hover:text-white"
          disabled={mutating}
          onClick={onDeleteBooking}
        >
          {mutating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          Hard Delete Booking
        </Button>
      </SectionBox>
    </div>
  );
}
