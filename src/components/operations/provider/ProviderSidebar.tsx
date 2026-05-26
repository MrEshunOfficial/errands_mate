"use client";

/**
 * ProviderSidebar.tsx
 *
 * Merged sidebar for the Provider Settings page.
 * Layout follows ProviderSidebar; enriched with ProfileSidebar's
 * refresh button, profile-completion block, and member-since date.
 */

import type { ReactNode } from "react";
import {
  Clock,
  Briefcase,
  Calendar,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronRight,
  Zap,
  AlertCircle,
  Star,
  Phone,
  Mail,
  PhoneCall,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  PopulatedUserProfile,
  ProviderProfile,
} from "@/types/provider.profile.types";
import { ProviderStatus } from "@/types/provider.profile.types";

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

const DAY_LABELS: Record<Day, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(profile: ProviderProfile): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  dot: string;
  isOpen: boolean;
  icon: ReactNode;
} {
  if (profile.status === ProviderStatus.Booked)
    return {
      label: "Booked",
      variant: "secondary",
      dot: "bg-amber-400",
      isOpen: false,
      icon: <Clock size={10} />,
    };

  if (profile.isAlwaysAvailable)
    return {
      label: "Always Available",
      variant: "default",
      dot: "bg-emerald-500",
      isOpen: true,
      icon: <Zap size={10} />,
    };

  const now = new Date();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const day = DAYS[dayIdx];
  const hrs = profile.workingHours?.[day];

  if (!hrs)
    return {
      label: "Closed Today",
      variant: "outline",
      dot: "bg-zinc-400",
      isOpen: false,
      icon: <AlertCircle size={10} />,
    };

  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const open = cur >= hrs.start && cur <= hrs.end;
  return {
    label: open ? "Open Now" : "Closed",
    variant: open ? "default" : "outline",
    dot: open ? "bg-emerald-500" : "bg-zinc-400",
    isOpen: open,
    icon: open ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />,
  };
}

function businessInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function profileCompletion(profile: ProviderProfile) {
  const items = [
    { label: "Business name", done: !!profile.businessName },
    { label: "Location", done: !!profile.locationData },
    {
      label: "Schedule",
      done:
        profile.isAlwaysAvailable ||
        Object.keys(profile.workingHours ?? {}).length > 0,
    },
  ] as const;
  const done = items.filter((i) => i.done).length;
  return { items, done, pct: Math.round((done / items.length) * 100) };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={13} className="shrink-0 text-muted-foreground/70" />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ScheduleChips({ profile }: { profile: ProviderProfile }) {
  if (profile.isAlwaysAvailable) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
        <Wifi size={12} />
        Always available — no fixed schedule
      </div>
    );
  }

  const wh = profile.workingHours ?? {};
  if (Object.keys(wh).length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
        <WifiOff size={12} />
        No schedule set
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((day) => {
        const slot = wh[day];
        return (
          <span
            key={day}
            title={slot ? `${slot.start} – ${slot.end}` : "Closed"}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border transition-colors ${
              slot
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
            }`}>
            {DAY_LABELS[day]}
            {slot && (
              <span className="block text-[9px] font-normal opacity-70 leading-none mt-0.5">
                {slot.start}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ProfileCompletion({ profile }: { profile: ProviderProfile }) {
  const { items, pct } = profileCompletion(profile);
  if (pct === 100) return null;

  return (
    <>
      <Separator className="mb-4" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Star size={11} />
            Profile completion
          </p>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            {pct}%
          </span>
        </div>
        <Progress value={pct} className="h-1.5 [&>div]:bg-emerald-500" />
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  item.done
                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}>
                {item.done ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <ChevronRight size={10} />
                )}
              </span>
              <span
                className={`text-xs ${
                  item.done
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ProviderSidebarSkeleton() {
  return (
    <Card className="overflow-hidden dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <div className="h-24 bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700" />
      <CardContent className="pt-0 -mt-10 space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <Skeleton className="w-20 h-20 rounded-2xl ring-4 ring-background" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <Separator />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface ProviderSidebarProps {
  profile: ProviderProfile;
}

export function ProviderSidebar({ profile }: ProviderSidebarProps) {
  const st = deriveStatus(profile);

  const contactInfo =
    typeof profile.profile === "object" && profile.profile !== null
      ? ((profile.profile as PopulatedUserProfile).contactInfo ?? null)
      : null;
  const serviceCount = profile.serviceOfferings?.length ?? 0;
  const workingDays = profile.isAlwaysAvailable
    ? "24/7"
    : `${Object.keys(profile.workingHours ?? {}).length}d/wk`;

  return (
    <Card className="overflow-hidden bg-white/10 dark:bg-zinc-900/10 backdrop-blur-2xl shadow-lg border border-white/20 dark:border-white/10 sticky top-6">
      <CardContent className="pt-0 pb-5 backdrop-blur-2xl">
        {/* ── Avatar + identity ────────────────────────────────────────── */}
        <div className=" mb-3 flex flex-col items-center text-center gap-2">
          {/* ── Page heading ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-1.5">
                {profile.businessName}&apos;s Business Profile
              </p>
              <h1 className="text-2xl font-black text-foreground leading-tight">
                {profile?.businessName ?? "Your Business"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <Badge
            variant={st.variant}
            className={`text-xs gap-1 ${
              st.isOpen
                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                : ""
            }`}>
            {st.icon}
            {st.label}
          </Badge>
        </div>

        <Separator className="mb-4" />

        {/* ── Contact Info ─────────────────────────────────────────────── */}
        {contactInfo ? (
          <div className="mb-3 space-y-1.5">
            {contactInfo.mainContact && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone
                  size={13}
                  className="shrink-0 text-muted-foreground/60"
                />
                <span>{contactInfo.mainContact}</span>
              </div>
            )}
            {contactInfo.additionalContact && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneCall
                  size={13}
                  className="shrink-0 text-muted-foreground/60"
                />
                <span>{contactInfo.additionalContact}</span>
              </div>
            )}
            {contactInfo.businessEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={13} className="shrink-0 text-muted-foreground/60" />
                <span className="truncate">{contactInfo.businessEmail}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mb-3">
            No contact info set
          </p>
        )}

        <Separator className="mb-4" />

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="space-y-0.5 mb-4">
          <StatRow
            icon={Briefcase}
            label="Services"
            value={`${serviceCount} offering${serviceCount !== 1 ? "s" : ""}`}
          />
          <StatRow icon={Calendar} label="Schedule" value={workingDays} />
        </div>
      </CardContent>
    </Card>
  );
}
