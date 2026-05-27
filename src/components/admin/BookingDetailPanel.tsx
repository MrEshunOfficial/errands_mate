"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";

import { useBookingById } from "@/hooks/booking/useBookings";
import type {
  ValidateBookingInput,
  ResolveDisputeInput,
  RescheduleBookingInput,
  PaymentStatus,
} from "@/types/booking/booking.types";
import { ActionsTab } from "./ActionsTab";
import { BookingStatusBadge, PaymentStatusBadge } from "./BookingBadges";
import { HistoryTab } from "./HistoryTab";
import { LocationTab } from "./LocationTab";
import { OverviewTab } from "./OverviewTab";
import { getClientId, getProviderId } from "./helpers";

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  danger,
  loading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {danger && (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant={danger ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

// ─── Tab Types ────────────────────────────────────────────────────────────────

type DetailTab = "overview" | "history" | "location" | "actions";

// ─── Pending Confirmation Actions ─────────────────────────────────────────────

type PendingAction =
  | { type: "start" }
  | { type: "cancel" }
  | { type: "delete" }
  | { type: "restore" }
  | { type: "complete"; finalPrice?: number }
  | { type: "validate"; input: ValidateBookingInput }
  | { type: "resolveDispute"; input: ResolveDisputeInput }
  | { type: "rebuttal"; message: string }
  | { type: "paymentStatus"; status: PaymentStatus }
  | { type: "reschedule"; input: RescheduleBookingInput };

function pendingActionLabel(action: PendingAction): string {
  switch (action.type) {
    case "start":          return "Start Service";
    case "cancel":         return "Cancel Booking";
    case "delete":         return "Hard Delete Booking";
    case "restore":        return "Restore Booking";
    case "complete":       return "Mark Complete";
    case "validate":       return action.input.approved ? "Approve Completion" : "Raise Dispute";
    case "resolveDispute": return "Resolve Dispute";
    case "rebuttal":       return "Submit Rebuttal";
    case "paymentStatus":  return "Update Payment Status";
    case "reschedule":     return "Reschedule Booking";
  }
}

function confirmMessage(action: PendingAction): string {
  switch (action.type) {
    case "delete":
      return "Permanently delete this booking? This cannot be undone.";
    case "cancel":
      return "Cancel this booking? Both client and provider will be notified.";
    case "resolveDispute":
      return `Resolve the dispute in favour of ${action.input.resolution === "approve" ? "the client" : "the provider"}? This is final.`;
    case "paymentStatus":
      return `Update payment status to "${action.status}"? This will be reflected in all reports.`;
    default:
      return `Are you sure you want to ${pendingActionLabel(action).toLowerCase()}?`;
  }
}

function isDanger(action: PendingAction): boolean {
  return action.type === "cancel" || action.type === "delete";
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  bookingId: string;
  onClose: () => void;
  onRefetch: () => void;
}

export function BookingDetailPanel({
  bookingId,
  onClose,
  onRefetch,
}: BookingDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const {
    booking,
    loading,
    error,
    mutating,
    mutationError,
    startService,
    completeService,
    validateCompletion,
    cancelBooking,
    rescheduleBooking,
    deleteBooking,
    restoreBooking,
    resolveDispute,
    updatePaymentStatus,
    submitRebuttal,
    isTerminal,
  } = useBookingById(bookingId, { populate: true });

  // Auto-navigate to actions tab when there are urgent actions
  useEffect(() => {
    if (booking && activeTab === "overview") {
      const needsAttention =
        booking.status === "DISPUTED" ||
        booking.status === "REBUTTAL_SUBMITTED";
      if (needsAttention) setActiveTab("actions");
    }
    // Only run on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!booking]);

  // Keyboard: Escape to close, tab cycling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingAction) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, pendingAction]);

  // ── Execute action ────────────────────────────────────────────────────────

  const executeAction = useCallback(async () => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case "start":
        await startService();
        break;
      case "complete":
        await completeService(
          pendingAction.finalPrice != null
            ? { finalPrice: pendingAction.finalPrice }
            : undefined,
        );
        break;
      case "validate":
        await validateCompletion(pendingAction.input);
        break;
      case "cancel":
        await cancelBooking({
          reason: "Cancelled by admin",
          cancelledBy: "admin",
        });
        break;
      case "delete":
        await deleteBooking();
        break;
      case "restore":
        await restoreBooking();
        break;
      case "resolveDispute":
        await resolveDispute(pendingAction.input);
        break;
      case "rebuttal":
        await submitRebuttal({ message: pendingAction.message });
        break;
      case "paymentStatus":
        await updatePaymentStatus({ paymentStatus: pendingAction.status });
        break;
      case "reschedule":
        await rescheduleBooking(pendingAction.input);
        break;
    }

    setPendingAction(null);
    onRefetch();
  }, [
    pendingAction,
    startService,
    completeService,
    validateCompletion,
    cancelBooking,
    deleteBooking,
    restoreBooking,
    resolveDispute,
    submitRebuttal,
    updatePaymentStatus,
    rescheduleBooking,
    onRefetch,
  ]);

  const TABS: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "history", label: "History" },
    { key: "location", label: "Location" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-background/95 backdrop-blur-3xl shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {loading
              ? "Loading booking…"
              : booking
                ? `Booking #${booking.bookingNumber ?? "—"}`
                : "Booking not found"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !booking ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              {error ?? "Booking not found."}
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="px-4 py-3 border-b bg-muted/30 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono text-base font-semibold">
                      #{booking.bookingNumber ?? "—"}
                    </p>
                    <CopyButton text={booking.bookingNumber ?? ""} />
                  </div>
                  {booking.scheduledDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scheduled:{" "}
                      {new Date(booking.scheduledDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                      {booking.scheduledTimeSlot?.start &&
                        ` @ ${booking.scheduledTimeSlot.start}`}
                    </p>
                  )}
                </div>

                {/* Quick links to client/provider */}
                <div className="flex flex-col gap-1 shrink-0 items-end">
                  {getClientId(booking) && (
                    <a
                      href={`/admin/users/${getClientId(booking)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors min-h-[28px] px-1"
                      title="Open client profile"
                    >
                      Client <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {getProviderId(booking) && (
                    <a
                      href={`/admin/providers/${getProviderId(booking)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors min-h-[28px] px-1"
                      title="Open provider profile"
                    >
                      Provider <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={booking.paymentStatus ?? ""} />
                {booking.isDeleted && (
                  <span className="text-xs font-mono text-destructive border border-destructive rounded px-1">
                    DELETED
                  </span>
                )}
                {booking.status === "DISPUTED" && (
                  <span className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border border-amber-300/50 rounded px-1 animate-pulse">
                    ⚠ Needs Resolution
                  </span>
                )}
              </div>
            </div>

            {/* ── Tab Nav ──────────────────────────────────────────────────── */}
            <div className="border-b overflow-x-auto">
              <div className="flex gap-0 px-2 min-w-max">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 sm:px-4 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === t.key
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    {t.key === "history" &&
                      (booking.statusHistory?.length ?? 0) > 0 && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          ({booking.statusHistory!.length})
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Body ────────────────────────────────────────────────── */}
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-4">
                {(mutationError || error) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-xs">
                      {mutationError ?? error}
                    </AlertDescription>
                  </Alert>
                )}

                {activeTab === "overview" && (
                  <OverviewTab booking={booking} />
                )}
                {activeTab === "history" && (
                  <HistoryTab booking={booking} />
                )}
                {activeTab === "location" && (
                  <LocationTab booking={booking} />
                )}
                {activeTab === "actions" && (
                  <ActionsTab
                    booking={booking}
                    isTerminal={isTerminal}
                    mutating={mutating}
                    onStartService={() => setPendingAction({ type: "start" })}
                    onCompleteService={(finalPrice) =>
                      setPendingAction({ type: "complete", finalPrice })
                    }
                    onValidateCompletion={(input) =>
                      setPendingAction({ type: "validate", input })
                    }
                    onCancelBooking={() =>
                      setPendingAction({ type: "cancel" })
                    }
                    onDeleteBooking={() =>
                      setPendingAction({ type: "delete" })
                    }
                    onRestoreBooking={() =>
                      setPendingAction({ type: "restore" })
                    }
                    onResolveDispute={(input) =>
                      setPendingAction({ type: "resolveDispute", input })
                    }
                    onSubmitRebuttal={(message) =>
                      setPendingAction({ type: "rebuttal", message })
                    }
                    onUpdatePaymentStatus={(status) =>
                      setPendingAction({ type: "paymentStatus", status })
                    }
                    onReschedule={(input) =>
                      setPendingAction({ type: "reschedule", input })
                    }
                  />
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>

      {/* ── Confirm Dialog ─────────────────────────────────────────────────── */}
      {pendingAction && (
        <ConfirmDialog
          open
          onClose={() => setPendingAction(null)}
          onConfirm={executeAction}
          title={pendingActionLabel(pendingAction)}
          message={confirmMessage(pendingAction)}
          danger={isDanger(pendingAction)}
          loading={mutating}
        />
      )}
    </Sheet>
  );
}
