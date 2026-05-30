"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { useAccountDeletion } from "@/hooks/auth/useAccDeletion";
import { useAuth } from "@/hooks/auth/useAuth";
import type { DeletionEventStatus } from "@/types/user.types";
import { accountDeletionAPI } from "@/lib/api/auth/account.deletion.api";
import type { APIError } from "@/lib/api/base/api-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DeletionEventStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  grace_period: {
    label: "Grace Period",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: DeletionEventStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={11} className={status === "processing" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

// ─── What gets deleted list ───────────────────────────────────────────────────

const DELETION_SCOPE = [
  "Your profile and provider profile",
  "All tasks you have posted",
  "All services you have listed",
  "All booking history (as client and provider)",
  "All requests and provider requests",
  "All saved addresses and preferences",
  "All uploaded files and images",
  "Your account login credentials",
];

// ─── Confirmation dialog ──────────────────────────────────────────────────────

function ConfirmDeletionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const [phrase, setPhrase] = useState("");
  const required = "DELETE MY ACCOUNT";
  const canConfirm = phrase === required && !isLoading;

  const handleClose = () => {
    setPhrase("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert size={20} />
            Confirm account deletion
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                Your account will enter a grace period before permanent deletion.
                You can cancel at any time before processing starts.
              </p>

              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-4 space-y-2">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  The following will be permanently deleted:
                </p>
                <ul className="space-y-1">
                  {DELETION_SCOPE.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400/80">
                      <ChevronRight size={11} className="shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Type{" "}
                  <span className="font-mono font-bold text-foreground">
                    {required}
                  </span>{" "}
                  to confirm.
                </p>
                <input
                  type="text"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder={required}
                  autoComplete="off"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 placeholder:text-muted-foreground/50 font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Keep my account
          </AlertDialogCancel>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete my account
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountDeletionPage() {
  const router = useRouter();
  const { logout, deleteAccount } = useAuth();
  const { cancelDeletion } = useAccountDeletion();

  const [deletionStatus, setDeletionStatus] =
    useState<DeletionEventStatus | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await accountDeletionAPI.getDeletionStatus();
      setDeletionStatus(res.status ?? null);
      setScheduledAt(res.scheduledAt ?? null);
    } catch (err) {
      // 404 = no deletion event on record — treat as "no pending deletion"
      if ((err as APIError).status !== 404) {
        console.error("Failed to fetch deletion status", err);
      }
      setDeletionStatus(null);
      setScheduledAt(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRequestDeletion = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted. Sign back in within the grace period to restore it.");
      setConfirmOpen(false);
      window.location.href = "/login";
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    const res = await cancelDeletion();
    setCancelling(false);
    if (res?.success) {
      toast.success("Account deletion cancelled. Your account is safe.");
      setDeletionStatus(null);
      setScheduledAt(null);
    } else {
      toast.error("Failed to cancel deletion. Please try again.");
    }
  };

  const handleLogoutAfterDeletion = async () => {
    await logout();
    router.push("/");
  };

  const isPendingDeletion =
    deletionStatus === "pending" || deletionStatus === "grace_period";
  const isProcessing = deletionStatus === "processing";
  const canCancel = isPendingDeletion;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account and data.
          </p>
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">

          {/* ── Deletion status card (shown when deletion is in progress) ── */}
          {statusLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Checking account status…
            </div>
          ) : deletionStatus && deletionStatus !== "cancelled" ? (
            <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/10 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <Clock size={17} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Deletion Scheduled
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {scheduledAt
                        ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}`
                        : "Your account is queued for deletion."}
                    </p>
                  </div>
                </div>
                <StatusBadge status={deletionStatus} />
              </div>

              <Separator className="opacity-50" />

              {canCancel ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Changed your mind? Cancel before the grace period ends.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancelling}
                    onClick={handleCancelDeletion}
                    className="shrink-0 text-xs gap-1.5 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                    {cancelling ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <X size={12} />
                    )}
                    Cancel deletion
                  </Button>
                </div>
              ) : isProcessing ? (
                <p className="text-xs text-muted-foreground">
                  Deletion is currently processing. You can no longer cancel.
                </p>
              ) : null}

              {deletionStatus === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogoutAfterDeletion}
                  className="w-full text-xs">
                  Sign out
                </Button>
              )}
            </div>
          ) : null}

          {/* ── Danger zone ───────────────────────────────────────────────── */}
          {!statusLoading && !isPendingDeletion && !isProcessing && deletionStatus !== "completed" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Section header */}
              <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Danger Zone
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Irreversible actions that affect your account permanently.
                  </p>
                </div>
              </div>

              {/* Delete account row */}
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Delete account
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Permanently delete your account and all associated data.
                    A grace period lets you cancel before deletion is processed.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  className="shrink-0 text-xs gap-1.5 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-400">
                  <Trash2 size={12} />
                  Delete account
                </Button>
              </div>
            </div>
          )}

          {/* ── Grace period explanation ──────────────────────────────────── */}
          {!statusLoading && !isPendingDeletion && !isProcessing && (
            <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                How deletion works
              </p>
              <ol className="space-y-2 text-xs text-muted-foreground list-none">
                {[
                  "You request deletion — your account enters a grace period.",
                  "You can cancel any time during the grace period.",
                  "After the grace period, all your data is permanently removed.",
                  "This includes profiles, tasks, bookings, files, and more.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      </div>

      <ConfirmDeletionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleRequestDeletion}
        isLoading={isDeleting}
      />
    </div>
  );
}
