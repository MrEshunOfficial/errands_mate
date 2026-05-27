"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  Inbox,
  Shield,
  Clock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminPendingRebuttals, useAdminResolveDispute } from "@/hooks/bookings/useCompletionAttempt";
import { CompletionAttempt, AdminResolutionOutcome } from "@/types/completion-attempt.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const OUTCOME_CONFIG: Record<
  AdminResolutionOutcome,
  { label: string; description: string; className: string }
> = {
  [AdminResolutionOutcome.PROVIDER_FAVOUR]: {
    label: "Uphold Rebuttal",
    description: "Provider wins — mark booking complete",
    className:
      "border-violet-300 dark:border-violet-700/60 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40",
  },
  [AdminResolutionOutcome.CLIENT_FAVOUR]: {
    label: "Reject Rebuttal",
    description: "Client wins — refund / dispute resolved for client",
    className:
      "border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40",
  },
  [AdminResolutionOutcome.REDO]: {
    label: "Order Redo",
    description: "Provider must redo the errand",
    className:
      "border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40",
  },
  [AdminResolutionOutcome.SPLIT]: {
    label: "Split Payment",
    description: "Partial refund — split between both parties",
    className:
      "border-blue-300 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40",
  },
};

// ─── Resolve Panel (inline per card) ─────────────────────────────────────────

function ResolvePanel({
  attemptId,
  onResolved,
}: {
  attemptId: string;
  onResolved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] =
    useState<AdminResolutionOutcome | null>(null);
  const [notes, setNotes] = useState("");

  const { mutate, loading } = useAdminResolveDispute({
    onSuccess: () => {
      toast.success("Rebuttal resolved successfully");
      onResolved();
    },
    onError: (err) => toast.error(err),
  });

  const handleConfirm = async () => {
    if (!selectedOutcome) return;
    await mutate({
      attemptId,
      outcome: selectedOutcome,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="border-t border-stone-100 dark:border-stone-800 mt-1 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <Shield size={11} />
        Admin Resolution
        <ChevronDown
          size={11}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Outcome buttons */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(OUTCOME_CONFIG) as AdminResolutionOutcome[]).map(
              (outcome) => {
                const cfg = OUTCOME_CONFIG[outcome];
                const isSelected = selectedOutcome === outcome;
                return (
                  <button
                    key={outcome}
                    onClick={() =>
                      setSelectedOutcome(isSelected ? null : outcome)
                    }
                    className={`rounded-xl border px-3 py-2 text-left transition-all text-[11px] font-semibold ${cfg.className} ${
                      isSelected ? "ring-2 ring-offset-1 ring-current" : ""
                    }`}
                  >
                    <span className="block">{cfg.label}</span>
                    <span className="block font-normal opacity-70 mt-0.5 leading-tight">
                      {cfg.description}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 dark:text-stone-500 mb-1">
              Admin notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add resolution notes for the record…"
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-600 resize-none"
            />
          </div>

          {/* Confirm */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={!selectedOutcome || loading}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold transition-colors"
            >
              {loading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Shield size={11} />
              )}
              {loading ? "Resolving…" : "Confirm Resolution"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setSelectedOutcome(null);
                setNotes("");
              }}
              className="h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attempt card ─────────────────────────────────────────────────────────────

function RebuttalCard({
  attempt,
  onResolved,
}: {
  attempt: CompletionAttempt;
  onResolved: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="h-0.5 bg-linear-to-r from-violet-400 to-purple-400" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                Rebuttal Submitted
              </span>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                Attempt #{attempt.attemptNumber}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
              {attempt._id}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
            <Clock size={11} />
            {fmtDateTime(attempt.rebuttal?.submittedAt)}
          </div>
        </div>

        {attempt.proof.notes && (
          <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 mb-1">
              Proof notes
            </p>
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {attempt.proof.notes}
            </p>
          </div>
        )}

        {attempt.dispute && (
          <div className="rounded-xl border border-red-100 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1">
              Client&apos;s dispute
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              {attempt.dispute.reason}
            </p>
          </div>
        )}

        {attempt.rebuttal && (
          <div className="rounded-xl border border-violet-100 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 mb-1">
              Provider&apos;s rebuttal
            </p>
            <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
              {attempt.rebuttal.message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-stone-400 dark:text-stone-500">
            Booking:{" "}
            <span className="font-mono">
              {attempt.bookingId.slice(-8).toUpperCase()}
            </span>
          </p>
          <Link
            href={`/admin/bookings/${attempt.bookingId}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-violet-300 dark:hover:border-violet-700/50 hover:text-violet-700 dark:hover:text-violet-400 text-stone-600 dark:text-stone-300 text-[11px] font-semibold transition-colors"
          >
            <ExternalLink size={11} />
            View booking
          </Link>
        </div>

        <ResolvePanel attemptId={attempt._id} onResolved={onResolved} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRebuttalsPage() {
  const { data: rebuttals, loading, error, refetch } = useAdminPendingRebuttals();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <MessageSquare size={18} className="text-violet-500" />
            Pending Rebuttals
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Disputed attempts where the provider has submitted a rebuttal
          </p>
        </div>
        {rebuttals && rebuttals.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50">
            <MessageSquare size={11} />
            {rebuttals.length} pending
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (!rebuttals || rebuttals.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Inbox size={24} className="text-stone-400 dark:text-stone-500" />
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
            No pending rebuttals
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
            Provider rebuttals waiting for admin review will appear here.
          </p>
        </div>
      )}

      {!loading && !error && rebuttals && rebuttals.length > 0 && (
        <div className="space-y-3">
          {rebuttals.map((attempt) => (
            <RebuttalCard key={attempt._id} attempt={attempt} onResolved={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
