"use client";

/**
 * ProviderSettings.tsx  (updated)
 *
 * Root provider settings page.
 *
 * Layout:
 *   Left  — ProviderSidebar  (sticky, standalone component)
 *   Right — BusinessIdentityCard | ServicesCard | AvailabilityCard | LocationCard
 *
 * The legacy inline ProfileSidebar and PageHeader have been removed.
 * All header / sidebar content now lives in <ProviderSidebar />.
 */

import { useState, type ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Pencil,
  Loader2,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type {
  ProviderProfile,
  UpdateBusinessNameBody,
} from "@/types/provider.profile.types";

import { useProviderProfileManager } from "@/hooks/profiles/useProviderProfile";
import { LocationCard } from "./LocationCard";
import { AvailabilityCard } from "./AvailabilityCard";
import { ProviderSidebar, ProviderSidebarSkeleton } from "./ProviderSidebar";
import { ServicesCard } from "./ServicesCard";
import {
  useDeleteService,
  useRestoreService,
} from "@/hooks/services/useServices";
import { useRouter } from "next/navigation";

// ─── Profile completion banner ────────────────────────────────────────────────

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
    { label: "Services", done: (profile.serviceOfferings?.length ?? 0) > 0 },
  ] as const;
  const done = items.filter((i) => i.done).length;
  return { items, done, pct: Math.round((done / items.length) * 100) };
}

function CompletionBanner({ profile }: { profile: ProviderProfile }) {
  const { items, done, pct } = profileCompletion(profile);
  if (pct === 100) return null;

  return (
    <div className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 p-5 text-white shadow-lg shadow-emerald-500/20">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-bold text-base">Complete your profile</p>
          <p className="text-sm text-emerald-100 mt-0.5">
            {done} of {items.length} sections filled in
          </p>
        </div>
        <span className="text-4xl font-black tabular-nums text-white/70 shrink-0">
          {pct}%
        </span>
      </div>

      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-white rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <span
            key={item.label}
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              item.done ? "text-white" : "text-white/50 line-through"
            }`}>
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                item.done ? "bg-white/20 border-white/40" : "border-white/20"
              }`}>
              {item.done && <CheckCircle2 size={10} />}
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
      {children}
    </Label>
  );
}

function ReadValue({
  label,
  value,
  empty = "Not set",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p
        className={
          value
            ? "text-sm font-semibold text-foreground"
            : "text-sm italic text-muted-foreground/60"
        }>
        {value || empty}
      </p>
    </div>
  );
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

// ─── Business Identity Card ───────────────────────────────────────────────────

interface BusinessIdentityCardProps {
  profile: ProviderProfile;
  updateBusinessName: (body: UpdateBusinessNameBody) => Promise<void>;
  updateBusinessNameState: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
}

function BusinessIdentityCard({
  profile,
  updateBusinessName,
  updateBusinessNameState,
}: BusinessIdentityCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.businessName ?? "");

  const openEdit = () => {
    setName(profile.businessName ?? "");
    setEditing(true);
  };

  const cancel = () => {
    setName(profile.businessName ?? "");
    setEditing(false);
  };

  const save = async () => {
    await updateBusinessName({ businessName: name.trim() });
    setEditing(false);
  };

  return (
    <Card className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <SectionIcon
              icon={Building2}
              className="bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900"
            />
            <div>
              <CardTitle className="text-base">Business Identity</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your public-facing business name
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

      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <FieldLabel>Business Name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akua Cleaning Services"
              className="dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>
        ) : (
          <ReadValue label="Business Name" value={profile.businessName} />
        )}
      </CardContent>

      {editing && (
        <CardFooter className="flex justify-between gap-3 pt-0 border-t border-zinc-100 dark:border-zinc-800 mt-2">
          <InlineFeedback
            {...updateBusinessNameState}
            successMsg="Name updated"
          />
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!name.trim() || updateBusinessNameState.loading}
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white">
              {updateBusinessNameState.loading ? (
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function ProviderSettings() {
  const {
    profile,
    loading,
    error,

    updateBusinessName,
    updateBusinessNameState,

    updateLocation,
    updateLocationState,

    setAvailability,
    setAvailabilityState,

    updateWorkingHours,
    updateWorkingHoursState,
  } = useProviderProfileManager();

  console.log("ProviderSettings render", {
    profile,
  });

  const router = useRouter();
  const { mutateAsync: archiveServiceAsync } = useDeleteService();
  const { mutateAsync: restoreServiceAsync } = useRestoreService();

  const handleManageServices = () => {
    router.push("/provider/services");
  };

  const handleArchiveService = async (serviceId: string) => {
    await archiveServiceAsync(serviceId);
  };

  const handleRestoreService = async (serviceId: string) => {
    await restoreServiceAsync(serviceId);
  };

  return (
    <div className="w-full h-full overflow-auto bg-zinc-50 dark:bg-zinc-950 text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-6">
        {/* ── Error alert ──────────────────────────────────────────────── */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle size={14} />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Completion banner ────────────────────────────────────────── */}
        {profile && <CompletionBanner profile={profile} />}

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-76 shrink-0">
            {loading || !profile ? (
              <ProviderSidebarSkeleton />
            ) : (
              <ProviderSidebar profile={profile} />
            )}
          </aside>

          {/* Settings cards stack */}
          <main className="flex-1 min-w-0 space-y-4">
            {loading || !profile ? (
              <SettingsSkeleton />
            ) : (
              <>
                <BusinessIdentityCard
                  profile={profile}
                  updateBusinessName={updateBusinessName}
                  updateBusinessNameState={updateBusinessNameState}
                />

                {/* Services — new card */}
                <ServicesCard
                  profile={profile}
                  onManageServices={handleManageServices}
                  onArchiveService={handleArchiveService}
                  onRestoreService={handleRestoreService}
                />

                <AvailabilityCard
                  profile={profile}
                  setAvailability={setAvailability}
                  setAvailabilityState={setAvailabilityState}
                  updateWorkingHours={updateWorkingHours}
                  updateWorkingHoursState={updateWorkingHoursState}
                />

                <LocationCard
                  profile={profile}
                  updateLocation={updateLocation}
                  updateLocationState={updateLocationState}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
