"use client";

/**
 * AvailabilityCard.tsx
 *
 * Standalone availability / schedule card with a real-time weekly calendar.
 *
 * Read view  — A 7-column week grid (Mon–Sun) showing working-hour blocks as
 *              coloured bars, a live "now" needle on today's column, and a
 *              real-time open / closed status pill that auto-updates every minute.
 *
 * Edit view  — Unchanged UX: always-on toggle, weekday/weekend/custom presets,
 *              per-day time pickers.
 */

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Pencil,
  Loader2,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Moon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  ProviderProfile,
  WorkingHours,
  UpdateWorkingHoursBody,
  SetAvailabilityBody,
} from "@/types/provider.profile.types";
import { WeeklyScheduleCalendar } from "../helpers/WeeklyScheduleCalendar";

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

const DAY_SHORT: Record<Day, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
};

const WEEKDAYS: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const WEEKEND: Day[] = ["saturday", "sunday"];

const DEFAULT_HOURS = { start: "08:00", end: "17:00" };

/** Calendar grid: 6 AM → 11 PM (17 hours visible) */
const GRID_START = 6;
const GRID_END = 23;
const GRID_SPAN = GRID_END - GRID_START;

/** Hour labels shown on the left ruler */
const HOUR_LABELS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

// ─── Presets ──────────────────────────────────────────────────────────────────

type Preset = "weekdays" | "weekends" | "custom";

function detectPreset(hours: WorkingHours, always: boolean): Preset {
  if (always) return "custom";
  const active = Object.keys(hours) as Day[];
  if (active.length === 0) return "custom";
  const isWeekdays =
    active.length === 5 && active.every((d) => WEEKDAYS.includes(d));
  const isWeekend =
    active.length === 2 && active.every((d) => WEEKEND.includes(d));
  if (isWeekdays) return "weekdays";
  if (isWeekend) return "weekends";
  return "custom";
}

function applyPreset(preset: Preset, current: WorkingHours): WorkingHours {
  if (preset === "weekdays")
    return Object.fromEntries(
      WEEKDAYS.map((d) => [d, current[d] ?? DEFAULT_HOURS]),
    ) as WorkingHours;
  if (preset === "weekends")
    return Object.fromEntries(
      WEEKEND.map((d) => [d, current[d] ?? DEFAULT_HOURS]),
    ) as WorkingHours;
  return current;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Convert "HH:MM" → percentage of the visible grid height */
function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const mins = (h - GRID_START) * 60 + (m ?? 0);
  return Math.max(0, Math.min(100, (mins / (GRID_SPAN * 60)) * 100));
}

/** Convert a Date → percentage of the visible grid height */
function nowToPercent(now: Date): number | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < GRID_START || h >= GRID_END) return null;
  const mins = (h - GRID_START) * 60 + m;
  return (mins / (GRID_SPAN * 60)) * 100;
}

/** JS getDay() (0=Sun) → DAYS index */
function todayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
}

/** Format 24h "HH:MM" → "h:mm AM/PM" */
function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Live status hook ─────────────────────────────────────────────────────────

function useLiveStatus(profile: ProviderProfile) {
  const compute = useCallback(() => {
    if (profile.isAlwaysAvailable)
      return { isOpen: true, label: "Always open" };
    const now = new Date();
    const idx = todayDayIndex();
    const day = DAYS[idx];
    const hrs = profile.workingHours?.[day];
    if (!hrs) return { isOpen: false, label: "Closed today" };
    const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const open = cur >= hrs.start && cur <= hrs.end;
    return {
      isOpen: open,
      label: open
        ? `Open until ${fmt12(hrs.end)}`
        : `Opens ${fmt12(hrs.start)}`,
    };
  }, [profile]);

  const [status, setStatus] = useState(compute); // `compute` as lazy initializer seeds the correct value

  useEffect(() => {
    const id = setInterval(() => setStatus(compute()), 60_000);
    return () => clearInterval(id);
  }, [compute]);

  return status;
}

/** Live "now" percentage — re-evaluates every minute */
function useNowPercent() {
  const [pct, setPct] = useState(() => nowToPercent(new Date()));
  useEffect(() => {
    const tick = () => setPct(nowToPercent(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return pct;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

interface InlineFeedbackProps {
  loading: boolean;
  error: string | null;
  success: boolean;
  successMsg?: string;
}

function InlineFeedback({
  loading,
  error,
  success,
  successMsg = "Saved",
}: InlineFeedbackProps) {
  if (loading)
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  if (error)
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle size={12} /> {error}
      </span>
    );
  if (success)
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={12} /> {successMsg}
      </span>
    );
  return null;
}

function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${className}`}>
      <Icon size={16} />
    </span>
  );
}

// ─── Weekly Calendar (read-only) ──────────────────────────────────────────────

interface WeeklyCalendarProps {
  profile: ProviderProfile;
}

function WeeklyCalendar({ profile }: WeeklyCalendarProps) {
  const nowPct = useNowPercent();
  const todayIdx = todayDayIndex();
  const wh = profile.workingHours ?? {};
  const isAlways = profile.isAlwaysAvailable;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
    <div className="flex gap-0 select-none min-w-[320px]">
      {/* ── Hour ruler (left) ── */}
      <div className="relative w-10 shrink-0" style={{ height: 288 }}>
        {HOUR_LABELS.map((h) => {
          const top = ((h - GRID_START) / GRID_SPAN) * 100;
          return (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground/50 font-medium"
              style={{ top: `${top}%` }}>
              {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
            </div>
          );
        })}
      </div>

      {/* ── Day columns ── */}
      <div className="flex-1 grid grid-cols-7 gap-1">
        {DAYS.map((day, idx) => {
          const slot = isAlways ? { start: "06:00", end: "23:00" } : wh[day];
          const isToday = idx === todayIdx;

          return (
            <div key={day} className="flex flex-col gap-1">
              {/* Day label */}
              <div
                className={`text-center py-1 rounded-md text-[10px] font-bold tracking-wide transition-colors ${
                  isToday
                    ? "bg-emerald-500 text-white"
                    : slot
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                      : "text-muted-foreground/40"
                }`}>
                <span className="hidden sm:block">{DAY_ABBR[day]}</span>
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
              </div>

              {/* Time column */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative rounded-lg overflow-hidden cursor-default transition-colors ${
                        isToday
                          ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-800"
                          : "bg-zinc-50 dark:bg-zinc-800/40"
                      }`}
                      style={{ height: 288 }}>
                      {/* Hour grid lines */}
                      {HOUR_LABELS.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-zinc-200/60 dark:border-zinc-700/40"
                          style={{
                            top: `${((h - GRID_START) / GRID_SPAN) * 100}%`,
                          }}
                        />
                      ))}

                      {/* Working-hours block */}
                      {slot &&
                        (() => {
                          const top = timeToPercent(slot.start);
                          const bot = timeToPercent(slot.end);
                          const height = bot - top;

                          return (
                            <div
                              className={`absolute left-0.5 right-0.5 rounded-md transition-all ${
                                isAlways
                                  ? "bg-linear-to-b from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-700 opacity-90"
                                  : isToday
                                    ? "bg-linear-to-b from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700"
                                    : "bg-linear-to-b from-emerald-400/70 to-emerald-500/70 dark:from-emerald-700/70 dark:to-emerald-800/70"
                              }`}
                              style={{ top: `${top}%`, height: `${height}%` }}>
                              {/* Start time label inside block */}
                              {height > 14 && (
                                <span className="absolute top-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/90 leading-none">
                                  {slot.start}
                                </span>
                              )}
                              {/* End time label inside block */}
                              {height > 18 && (
                                <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80 leading-none">
                                  {slot.end}
                                </span>
                              )}
                            </div>
                          );
                        })()}

                      {/* Live "now" needle — only on today's column */}
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
                  </TooltipTrigger>

                  {slot && (
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{DAY_ABBR[day]}</p>
                      <p className="text-muted-foreground">
                        {isAlways
                          ? "24 / 7"
                          : `${fmt12(slot.start)} – ${fmt12(slot.end)}`}
                      </p>
                    </TooltipContent>
                  )}
                  {!slot && (
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{DAY_ABBR[day]}</p>
                      <p className="text-muted-foreground">Closed</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

// ─── Schedule legend + status strip ──────────────────────────────────────────

function ScheduleStatusStrip({ profile }: { profile: ProviderProfile }) {
  const { isOpen, label } = useLiveStatus(profile);
  const now = new Date();
  const todayIdx = todayDayIndex();
  const todayDay = DAYS[todayIdx];
  const todaySlot = profile.isAlwaysAvailable
    ? null
    : profile.workingHours?.[todayDay];

  const activeDays = profile.isAlwaysAvailable
    ? 7
    : Object.keys(profile.workingHours ?? {}).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* Status pill */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
            isOpen
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
          }`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOpen ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
            }`}
          />
          {label}
        </div>

        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock size={10} />
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-3">
        {profile.isAlwaysAvailable ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Wifi size={12} />
            Always available
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sun size={11} />
              {activeDays}d / wk
            </span>
            {todaySlot && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Moon size={11} />
                {fmt12(todaySlot.start)} – {fmt12(todaySlot.end)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function CalendarLegend({ profile }: { profile: ProviderProfile }) {
  const activeDays = Object.keys(profile.workingHours ?? {}) as Day[];

  if (profile.isAlwaysAvailable) {
    return (
      <p className="text-xs text-muted-foreground mt-3 text-center italic">
        All days are fully open — no fixed schedule
      </p>
    );
  }

  if (activeDays.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <WifiOff size={12} />
        No working days configured
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mt-3 flex-wrap justify-center">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" />
        Working hours
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="w-3 h-0.5 bg-red-500 inline-block" />
        Current time
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
        Today
      </span>
    </div>
  );
}

// ─── Edit: preset pill ────────────────────────────────────────────────────────

function PresetPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
        ${
          active
            ? "bg-emerald-600 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-700 text-white shadow-sm"
            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-foreground"
        }
      `}>
      {children}
    </button>
  );
}

// ─── Edit: working hours grid ─────────────────────────────────────────────────

function WorkingHoursGrid({
  hours,
  onChange,
}: {
  hours: WorkingHours;
  onChange: (h: WorkingHours) => void;
}) {
  const toggle = (day: Day) => {
    const next = { ...hours };
    if (next[day]) delete next[day];
    else next[day] = { ...DEFAULT_HOURS };
    onChange(next);
  };

  const update = (day: Day, field: "start" | "end", val: string) =>
    onChange({ ...hours, [day]: { ...hours[day], [field]: val } });

  return (
    <div className="space-y-1.5">
      {DAYS.map((day) => {
        const on = !!hours[day];
        return (
          <div
            key={day}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 border transition-colors ${
              on
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
            }`}>
            <Switch
              checked={on}
              onCheckedChange={() => toggle(day)}
              className="scale-75 origin-left"
            />
            <span
              className={`text-xs font-bold w-7 shrink-0 ${
                on ? "text-foreground" : "text-muted-foreground"
              }`}>
              {DAY_ABBR[day]}
            </span>

            {on ? (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="time"
                  value={hours[day].start}
                  onChange={(e) => update(day, "start", e.target.value)}
                  className="text-xs px-2 py-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground rounded-lg outline-none focus:border-emerald-400 transition-colors"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <input
                  type="time"
                  value={hours[day].end}
                  onChange={(e) => update(day, "end", e.target.value)}
                  className="text-xs px-2 py-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground rounded-lg outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            ) : (
              <span className="ml-auto text-xs text-muted-foreground italic">
                Closed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Edit: full form ──────────────────────────────────────────────────────────

function ScheduleEditForm({
  always,
  setAlways,
  preset,
  setPreset,
  hours,
  setHours,
}: {
  always: boolean;
  setAlways: (v: boolean) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
  hours: WorkingHours;
  setHours: (h: WorkingHours) => void;
}) {
  const handlePreset = (p: Preset) => {
    setPreset(p);
    setHours(applyPreset(p, hours));
  };

  return (
    <div className="space-y-5">
      {/* Always-on toggle */}
      <div
        className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
          always
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
        }`}>
        <div>
          <p className="text-sm font-semibold">Always Available</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {always
              ? "Your status will always show as Available"
              : "Status follows the schedule below"}
          </p>
        </div>
        <Switch
          checked={always}
          onCheckedChange={setAlways}
          className="shrink-0"
        />
      </div>

      {/* Schedule — only when not always-on */}
      {!always && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Quick select
            </p>
            <div className="flex gap-2 flex-wrap">
              <PresetPill
                active={preset === "weekdays"}
                onClick={() => handlePreset("weekdays")}>
                Weekdays
              </PresetPill>
              <PresetPill
                active={preset === "weekends"}
                onClick={() => handlePreset("weekends")}>
                Weekends
              </PresetPill>
              <PresetPill
                active={preset === "custom"}
                onClick={() => handlePreset("custom")}>
                Custom
              </PresetPill>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {preset === "custom"
                ? "Select days & set hours"
                : "Adjust hours for each day"}
            </p>
            <WorkingHoursGrid
              hours={hours}
              onChange={(h) => {
                setHours(h);
                setPreset(detectPreset(h, false));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export interface AvailabilityCardProps {
  profile: ProviderProfile;
  setAvailability: (body: SetAvailabilityBody) => Promise<void>;
  setAvailabilityState: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  updateWorkingHours: (body: UpdateWorkingHoursBody) => Promise<void>;
  updateWorkingHoursState: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
}

export function AvailabilityCard({
  profile,
  setAvailability,
  setAvailabilityState,
  updateWorkingHoursState,
}: AvailabilityCardProps) {
  const [editing, setEditing] = useState(false);

  const [always, setAlways] = useState(profile.isAlwaysAvailable);
  const [hours, setHours] = useState<WorkingHours>({
    ...(profile.workingHours ?? {}),
  });
  const [preset, setPreset] = useState<Preset>(
    detectPreset(profile.workingHours ?? {}, profile.isAlwaysAvailable),
  );

  const openEdit = () => {
    setAlways(profile.isAlwaysAvailable);
    setHours({ ...(profile.workingHours ?? {}) });
    setPreset(
      detectPreset(profile.workingHours ?? {}, profile.isAlwaysAvailable),
    );
    setEditing(true);
  };

  const cancel = () => {
    setAlways(profile.isAlwaysAvailable);
    setHours({ ...(profile.workingHours ?? {}) });
    setPreset(
      detectPreset(profile.workingHours ?? {}, profile.isAlwaysAvailable),
    );
    setEditing(false);
  };

  const save = async () => {
    if (always) {
      await setAvailability({ isAlwaysAvailable: true });
    } else {
      await setAvailability({ isAlwaysAvailable: false, workingHours: hours });
    }
    setEditing(false);
  };

  const isMutating =
    setAvailabilityState.loading || updateWorkingHoursState.loading;
  const mutationError =
    setAvailabilityState.error ?? updateWorkingHoursState.error;
  const mutationSuccess =
    setAvailabilityState.success || updateWorkingHoursState.success;

  return (
    <Card className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <SectionIcon
              icon={CalendarDays}
              className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
            />
            <div>
              <CardTitle className="text-base">
                Availability & Schedule
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Live status derived from this schedule · updates in real time
              </CardDescription>
            </div>
          </div>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 shrink-0"
              onClick={openEdit}>
              <Pencil size={12} />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {editing ? (
          <ScheduleEditForm
            always={always}
            setAlways={setAlways}
            preset={preset}
            setPreset={setPreset}
            hours={hours}
            setHours={setHours}
          />
        ) : (
          <WeeklyScheduleCalendar
            workingHours={profile.workingHours}
            isAlwaysAvailable={profile.isAlwaysAvailable}
            gridHeight={288}
          />
        )}
      </CardContent>

      {editing && (
        <CardFooter className="flex justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-4">
          <InlineFeedback
            loading={isMutating}
            error={mutationError}
            success={mutationSuccess}
            successMsg="Schedule saved"
          />
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isMutating}
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white">
              {isMutating ? (
                <Loader2 size={13} className="animate-spin mr-1.5" />
              ) : null}
              Save
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
