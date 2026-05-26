"use client";

import { BookingStatus } from "@/types/booking/booking.types";
import { History } from "lucide-react";
import { BOOKING_STATUS_CONFIG } from "./constants";
import { BookingRowData, formatDateTime } from "./helpers";

interface HistoryTabProps {
  booking: BookingRowData;
}

const ACTOR_COLORS: Record<string, string> = {
  admin:    "text-violet-600",
  customer: "text-blue-600",
  provider: "text-emerald-600",
  system:   "text-slate-500",
};

function durationLabel(fromIso: string, toIso: string): string {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (ms < 0) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(ms / 3600000);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export function HistoryTab({ booking }: HistoryTabProps) {
  const history = booking.statusHistory ?? [];

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No status history recorded.
      </div>
    );
  }

  return (
    <div className="relative pl-5 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

      {history.map((entry, i) => {
        const meta = BOOKING_STATUS_CONFIG[entry.status as BookingStatus];
        const actorColor = ACTOR_COLORS[entry.actorRole ?? ""] ?? "text-muted-foreground";
        const next = history[i + 1];
        const duration = next ? durationLabel(entry.timestamp, next.timestamp) : null;
        const isLatest = i === history.length - 1;

        return (
          <div key={i} className="relative">
            {/* Timeline dot */}
            <div
              className={`absolute -left-3.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                isLatest ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            />

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">
                  {meta?.icon} {meta?.label ?? entry.status}
                </p>
                {isLatest && (
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    current
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.timestamp)}
                {entry.actorRole && (
                  <>
                    {" · by "}
                    <span className={`font-semibold ${actorColor}`}>
                      {entry.actorRole}
                    </span>
                  </>
                )}
                {entry.actor && (
                  <span className="text-muted-foreground/70"> ({entry.actor})</span>
                )}
              </p>

              {entry.reason && (
                <p className="text-xs text-muted-foreground italic mt-1 bg-muted/30 rounded px-2 py-1">
                  "{entry.reason}"
                </p>
              )}

              {entry.message && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.message}
                </p>
              )}

              {/* Time between steps */}
              {duration && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  ↓ {duration} until next step
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
