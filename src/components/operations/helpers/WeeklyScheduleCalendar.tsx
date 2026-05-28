"use client";

/**
 * WeeklyScheduleCalendar.tsx
 *
 * Shared, public-facing schedule display used by:
 *   - ProviderProfilePage  (provider detail page)
 *   - ProviderPanel        (sidebar inside ServiceDetailPage)
 *
 * Renders:
 *   - A live open/closed status strip (auto-updates every minute)
 *   - A 7-column time-grid calendar (6 AM → 11 PM) with a real-time "now" needle
 *   - A compact legend
 *
 * Does NOT handle editing — that stays in AvailabilityCard (dashboard only).
 */

import { useCallback, useEffect, useState } from "react";
import { Clock, Wifi, WifiOff, AlertCircle } from "lucide-react";
import type { WorkingHours } from "@/types/provider.profile.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Day = (typeof DAYS)[number];

const DAY_ABBR: Record<Day, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** Single-letter labels for narrow columns on very small screens */
const DAY_SHORT: Record<Day, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
};

/** Visible hour range of the grid */
const GRID_START = 6; // 6 AM
const GRID_END = 23; // 11 PM
const GRID_SPAN = GRID_END - GRID_START;

/** Which hours get a horizontal rule + ruler label */
const HOUR_LABELS = [6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** "HH:MM" → percentage position within the visible grid */
function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const mins = (h - GRID_START) * 60 + (m ?? 0);
  return Math.max(0, Math.min(100, (mins / (GRID_SPAN * 60)) * 100));
}

/** Current time → percentage (null when outside the visible grid range) */
function nowToPercent(now: Date): number | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < GRID_START || h >= GRID_END) return null;
  return (((h - GRID_START) * 60 + m) / (GRID_SPAN * 60)) * 100;
}

/** JS `getDay()` (0 = Sun) → DAYS index (0 = Mon) */
function todayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function todayDayName(): Day {
  return DAYS[todayDayIndex()];
}

/** Format "HH:MM" (24 h) → "h:mm AM/PM" */
function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Readable hour ruler label: 12 → "12p", 14 → "2p", 9 → "9a" */
function fmtRuler(h: number): string {
  if (h === 12) return "12p";
  return h > 12 ? `${h - 12}p` : `${h}a`;
}

function isWithinSlot(slot: { start: string; end: string }): boolean {
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return cur >= slot.start && cur <= slot.end;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Recomputes the "now" needle percentage every minute */
function useNowPercent(): number | null {
  const [pct, setPct] = useState<number | null>(() => nowToPercent(new Date()));
  useEffect(() => {
    const tick = () => setPct(nowToPercent(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return pct;
}

// ─── Live status derivation ───────────────────────────────────────────────────

export type LiveStatusVariant = "green" | "amber" | "red" | "gray";

export interface LiveStatus {
  isOpen: boolean;
  label: string;
  variant: LiveStatusVariant;
}

function deriveLiveStatus(
  workingHours: WorkingHours | undefined,
  isAlwaysAvailable: boolean | undefined,
  status: string | undefined,
): LiveStatus {
  const s = status?.toLowerCase();

  if (s === "booked") {
    return { isOpen: false, label: "Currently Booked", variant: "amber" };
  }
  if (s === "closed") {
    return { isOpen: false, label: "Closed", variant: "red" };
  }
  if (isAlwaysAvailable) {
    return { isOpen: true, label: "Always Available", variant: "green" };
  }

  const todayIdx = todayDayIndex();
  const wh = workingHours as
    | Record<string, { start: string; end: string }>
    | undefined;
  const todaySlot = wh?.[todayDayName()];
  const curMins = currentMinutes();

  if (todaySlot) {
    const startMins = timeToMinutes(todaySlot.start);
    const endMins = timeToMinutes(todaySlot.end);

    if (curMins < startMins) {
      // Before today's opening window
      const minsUntilOpen = startMins - curMins;
      if (minsUntilOpen <= 30) {
        return {
          isOpen: false,
          label: `Opens soon · ${fmt12(todaySlot.start)}`,
          variant: "amber",
        };
      }
      return {
        isOpen: false,
        label: `Opens today at ${fmt12(todaySlot.start)}`,
        variant: "gray",
      };
    }

    if (curMins <= endMins) {
      // Currently open — check if closing soon
      const minsLeft = endMins - curMins;
      if (minsLeft <= 30) {
        return {
          isOpen: true,
          label: `Closing soon · ${fmt12(todaySlot.end)}`,
          variant: "amber",
        };
      }
      return {
        isOpen: true,
        label: `Open until ${fmt12(todaySlot.end)}`,
        variant: "green",
      };
    }

    // Past today's closing time — build elapsed label
    const minsSinceClosed = curMins - endMins;
    let closedLabel: string;
    let closedVariant: LiveStatusVariant;
    if (minsSinceClosed < 1) {
      closedLabel = "Closed just now";
      closedVariant = "red";
    } else if (minsSinceClosed < 60) {
      closedLabel = `Closed ${minsSinceClosed}m ago`;
      closedVariant = minsSinceClosed < 30 ? "red" : "gray";
    } else {
      const hrs = Math.floor(minsSinceClosed / 60);
      closedLabel = `Closed ${hrs}h ago`;
      closedVariant = "gray";
    }

    // Append next opening time
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7;
      const day = DAYS[idx];
      const slot = wh?.[day];
      if (slot) {
        const reopenLabel =
          i === 1
            ? `tomorrow at ${fmt12(slot.start)}`
            : `${DAY_ABBR[day]} at ${fmt12(slot.start)}`;
        return {
          isOpen: false,
          label: `${closedLabel} · Opens ${reopenLabel}`,
          variant: closedVariant,
        };
      }
    }
    return { isOpen: false, label: closedLabel, variant: closedVariant };
  }

  // No slot today — find next open day
  for (let i = 1; i <= 7; i++) {
    const idx = (todayIdx + i) % 7;
    const day = DAYS[idx];
    const slot = wh?.[day];
    if (slot) {
      const label =
        i === 1
          ? `Opens tomorrow at ${fmt12(slot.start)}`
          : `Opens ${DAY_ABBR[day]} at ${fmt12(slot.start)}`;
      return { isOpen: false, label, variant: "gray" };
    }
  }

  return { isOpen: false, label: "Closed today", variant: "gray" };
}

/** Live status pill — re-evaluates every minute */
function useLiveStatus(
  workingHours: WorkingHours | undefined,
  isAlwaysAvailable: boolean | undefined,
  status: string | undefined,
): LiveStatus {
  const compute = useCallback(
    () => deriveLiveStatus(workingHours, isAlwaysAvailable, status),
    [workingHours, isAlwaysAvailable, status],
  );

  const [liveStatus, setLiveStatus] = useState<LiveStatus>(compute);

  // Sync immediately when props change
  useEffect(() => {
    setLiveStatus(compute());
  }, [compute]);

  // Re-tick every minute
  useEffect(() => {
    const id = setInterval(() => setLiveStatus(compute()), 60_000);
    return () => clearInterval(id);
  }, [compute]);

  return liveStatus;
}

// ─── Variant style maps ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<LiveStatusVariant, { pill: string; dot: string }> =
  {
    green: {
      pill: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500 animate-pulse",
    },
    amber: {
      pill: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    red: {
      pill: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300",
      dot: "bg-red-500",
    },
    gray: {
      pill: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400",
      dot: "bg-gray-400",
    },
  };

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusStripProps {
  liveStatus: LiveStatus;
  workingHours: WorkingHours | undefined;
  isAlwaysAvailable: boolean | undefined;
}

function StatusStrip({
  liveStatus,
  workingHours,
  isAlwaysAvailable,
}: StatusStripProps) {
  const now = new Date();
  const todaySlot = isAlwaysAvailable
    ? null
    : (
        workingHours as
          | Record<string, { start: string; end: string }>
          | undefined
      )?.[todayDayName()];
  const activeDays = isAlwaysAvailable
    ? 7
    : Object.keys(workingHours ?? {}).length;
  const { pill, dot } = STATUS_STYLES[liveStatus.variant];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* Status pill */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {liveStatus.label}
        </div>
        {!isAlwaysAvailable && (
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-3">
        {isAlwaysAvailable ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Wifi size={12} />
            Available 24 / 7
          </span>
        ) : (
          <>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {activeDays}d / wk
            </span>
            {todaySlot && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {fmt12(todaySlot.start)} – {fmt12(todaySlot.end)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface StatusOverlayNoticeProps {
  status: string | undefined;
}

function StatusOverlayNotice({ status }: StatusOverlayNoticeProps) {
  const s = status?.toLowerCase();
  if (s !== "booked" && s !== "closed") return null;

  const isBooked = s === "booked";
  const cls = isBooked
    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"
    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300";
  const msg = isBooked
    ? "Currently booked — schedule hours still shown below"
    : "Provider is currently closed — check back later";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold mb-3 ${cls}`}>
      <AlertCircle size={13} className="shrink-0" />
      {msg}
    </div>
  );
}

interface TimeGridProps {
  workingHours: WorkingHours | undefined;
  isAlwaysAvailable: boolean | undefined;
  nowPct: number | null;
  gridHeight: number;
}

function TimeGrid({
  workingHours,
  isAlwaysAvailable,
  nowPct,
  gridHeight,
}: TimeGridProps) {
  const todayIdx = todayDayIndex();
  const wh = (workingHours ?? {}) as Record<
    string,
    { start: string; end: string }
  >;
  const isAlways = !!isAlwaysAvailable;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
    <div className="flex gap-0 min-w-[320px]">
      {/* Hour ruler */}
      <div className="relative w-10 shrink-0" style={{ height: gridHeight }}>
        {HOUR_LABELS.map((h) => (
          <div
            key={h}
            className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-gray-400 dark:text-gray-500 font-medium"
            style={{ top: `${((h - GRID_START) / GRID_SPAN) * 100}%` }}>
            {fmtRuler(h)}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex-1 grid grid-cols-7 gap-1">
        {DAYS.map((day, idx) => {
          const slot = isAlways ? { start: "06:00", end: "23:00" } : wh[day];
          const isToday = idx === todayIdx;
          const isOpenNow =
            isToday && (isAlways || (!!slot && isWithinSlot(slot)));

          return (
            <div key={day} className="flex flex-col gap-1">
              {/* Day label */}
              <div
                className={`text-center py-1 rounded-md text-[10px] font-bold tracking-wide transition-colors ${
                  isToday
                    ? "bg-emerald-500 text-white"
                    : slot
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      : "text-gray-300 dark:text-gray-600"
                }`}>
                <span className="hidden sm:block">
                  {DAY_ABBR[day].slice(0, 2)}
                </span>
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
              </div>

              {/* Time column */}
              <div
                className={`relative rounded-lg overflow-hidden ${
                  isToday
                    ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-800"
                    : "bg-gray-50 dark:bg-gray-800/40"
                }`}
                style={{ height: gridHeight }}>
                {/* Horizontal hour lines */}
                {HOUR_LABELS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-200/60 dark:border-gray-700/40"
                    style={{ top: `${((h - GRID_START) / GRID_SPAN) * 100}%` }}
                  />
                ))}

                {/* Working-hours bar */}
                {slot &&
                  (() => {
                    const top = isAlways ? 0 : timeToPercent(slot.start);
                    const bot = isAlways ? 100 : timeToPercent(slot.end);
                    const height = bot - top;

                    return (
                      <div
                        className={`absolute left-0.5 right-0.5 rounded-md ${isAlways ? "top-0.5 bottom-0.5" : ""} ${
                          isOpenNow
                            ? "bg-emerald-500 dark:bg-emerald-600"
                            : isToday
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : "bg-emerald-400/70 dark:bg-emerald-700/70"
                        }`}
                        style={
                          isAlways
                            ? undefined
                            : { top: `${top}%`, height: `${height}%` }
                        }>
                        {/* Start time label */}
                        {!isAlways && height > 14 && (
                          <span className="absolute top-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/90 leading-none">
                            {slot.start}
                          </span>
                        )}
                        {/* End time label */}
                        {!isAlways && height > 18 && (
                          <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80 leading-none">
                            {slot.end}
                          </span>
                        )}
                        {/* Live pulse dot */}
                        {isOpenNow && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                        )}
                      </div>
                    );
                  })()}

                {/* Live "now" needle — today's column only */}
                {isToday && nowPct !== null && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${nowPct}%` }}>
                    <div className="relative flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-0.5 shadow-sm shadow-red-500/50" />
                      <div className="flex-1 h-px bg-red-500/80" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

function CalendarLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap mt-3">
      <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" />
        Working hours
      </span>
      <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="w-3 h-0.5 bg-red-500 inline-block" />
        Current time
      </span>
      <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
        Today
      </span>
    </div>
  );
}

function AlwaysAvailableFallback() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 py-2">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
        <Wifi size={16} className="text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
          Available 24 / 7
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          This provider is always reachable
        </p>
      </div>
    </div>
  );
}

function NoScheduleFallback() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 py-2">
      <WifiOff size={13} />
      No schedule configured
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface WeeklyScheduleCalendarProps {
  workingHours?: WorkingHours;
  isAlwaysAvailable?: boolean;
  /**
   * Optional provider booking/operational status string.
   * Recognised values (case-insensitive): "booked" | "closed"
   * When supplied, an override notice is shown above the grid.
   */
  status?: string;
  /**
   * Pixel height of each day column in the time grid.
   * Use a larger value in wider layouts (e.g. 288 for full-page views),
   * a smaller one for compact sidebars (default: 200).
   */
  gridHeight?: number;
  /** Hide the status strip (open/closed pill + clock). Useful when the
   *  parent already renders its own status indicator. */
  hideStatusStrip?: boolean;
  /** Hide the legend row below the grid. */
  hideLegend?: boolean;
  className?: string;
}

/**
 * WeeklyScheduleCalendar
 *
 * Drop-in, read-only weekly availability display.
 * Handles its own live-status computation and minute-level re-evaluation.
 */
export function WeeklyScheduleCalendar({
  workingHours,
  isAlwaysAvailable,
  status,
  gridHeight = 200,
  hideStatusStrip = false,
  hideLegend = false,
  className,
}: WeeklyScheduleCalendarProps) {
  const liveStatus = useLiveStatus(workingHours, isAlwaysAvailable, status);
  const nowPct = useNowPercent();

  const hasSchedule =
    isAlwaysAvailable || (workingHours && Object.keys(workingHours).length > 0);

  // Always-available with no explicit working hours → simple banner
  if (isAlwaysAvailable && !workingHours) {
    return (
      <div className={className}>
        {!hideStatusStrip && (
          <StatusStrip
            liveStatus={liveStatus}
            workingHours={workingHours}
            isAlwaysAvailable={isAlwaysAvailable}
          />
        )}
        <AlwaysAvailableFallback />
      </div>
    );
  }

  if (!hasSchedule) {
    return (
      <div className={className}>
        <NoScheduleFallback />
      </div>
    );
  }

  return (
    <div className={className}>
      {!hideStatusStrip && (
        <StatusStrip
          liveStatus={liveStatus}
          workingHours={workingHours}
          isAlwaysAvailable={isAlwaysAvailable}
        />
      )}

      <StatusOverlayNotice status={status} />

      <TimeGrid
        workingHours={workingHours}
        isAlwaysAvailable={isAlwaysAvailable}
        nowPct={nowPct}
        gridHeight={gridHeight}
      />

      {!hideLegend && <CalendarLegend />}
    </div>
  );
}

// Re-export helpers that callers may want (e.g. for their own status pills)
export { deriveLiveStatus, fmt12, todayDayName, STATUS_STYLES };
