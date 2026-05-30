"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Loader2 } from "lucide-react";

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

import type {
  ProviderProfile,
  WorkingHours,
  SetAvailabilityBody,
} from "@/types/provider.profile.types";
import { WeeklyScheduleCalendar } from "../helpers/WeeklyScheduleCalendar";
import {
  SectionIcon,
  InlineFeedback,
} from "@/components/operations/profile/shared";

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

const WEEKDAYS: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND: Day[] = ["saturday", "sunday"];

const DEFAULT_HOURS = { start: "08:00", end: "17:00" };

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
}

export function AvailabilityCard({
  profile,
  setAvailability,
  setAvailabilityState,
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
            loading={setAvailabilityState.loading}
            error={setAvailabilityState.error}
            success={setAvailabilityState.success}
            successMsg="Schedule saved"
          />
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={setAvailabilityState.loading}
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white">
              {setAvailabilityState.loading ? (
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
