"use client";

import Link from "next/link";
import {
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  Inbox,
  Shield,
  Clock,
} from "lucide-react";
import { useAdminPendingRebuttals } from "@/hooks/bookings/useCompletionAttempt";
import { CompletionAttempt } from "@/types/completion-attempt.types";

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

// ─── Attempt card ─────────────────────────────────────────────────────────────

function RebuttalCard({ attempt }: { attempt: CompletionAttempt }) {
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
            <span className="font-mono">{attempt.bookingId.slice(-8).toUpperCase()}</span>
          </p>
          <Link
            href={`/admin/bookings/${attempt.bookingId}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-violet-300 dark:hover:border-violet-700/50 hover:text-violet-700 dark:hover:text-violet-400 text-stone-600 dark:text-stone-300 text-[11px] font-semibold transition-colors"
          >
            <ExternalLink size={11} />
            View booking
          </Link>
        </div>
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
          <div className="flex items-center gap-2 px-1 mb-2">
            <Shield size={12} className="text-stone-400" />
            <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Review both sides, then resolve via the booking page
            </p>
          </div>
          {rebuttals.map((attempt) => (
            <RebuttalCard key={attempt._id} attempt={attempt} />
          ))}
        </div>
      )}
    </div>
  );
}
