"use client";

/**
 * LocationCard.tsx
 *
 * Provider location settings card.
 * Flow:
 *   1. User enters Ghana Post GPS code + optional nearby landmark
 *   2. Browser GPS coordinates are auto-captured (manual fallback available)
 *   3. On "Enrich", calls updateLocation — server resolves region/city/district etc.
 *   4. Shows enriched location preview; user confirms with "Save"
 */

import { useState, type ReactNode } from "react";
import {
  MapPin,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Navigation,
  Landmark,
  Sparkles,
  AlertTriangle,
  Globe,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type {
  ProviderProfile,
  UpdateLocationBody,
} from "@/types/provider.profile.types";
import { useLocationForm } from "@/hooks/profiles/useLocationForm";
import { LocationFormFields } from "@/components/shared/location";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationCardProps {
  profile: ProviderProfile;
  updateLocation: (body: UpdateLocationBody) => Promise<void>;
  updateLocationState: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
}

// ─── Small helpers ────────────────────────────────────────────────────────────

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

// ─── Enriched Preview ─────────────────────────────────────────────────────────

function LocationPreview({ profile }: { profile: ProviderProfile }) {
  const loc = profile.locationData;
  if (!loc) return null;

  const lines = [
    loc.houseNumber && loc.streetName
      ? `${loc.houseNumber} ${loc.streetName}`
      : loc.streetName,
    loc.locality,
    loc.district,
    loc.city,
    loc.region,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-linear-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-zinc-200 dark:border-zinc-700">
        <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
          ENRICHED LOCATION DATA
        </p>
        {loc.isAddressVerified && (
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={12} /> Verified
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium">Address</p>
          {lines.length > 0 ? (
            <p className="text-sm font-semibold text-foreground leading-snug">
              {lines.join(", ")}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">
              Address details pending enrichment
            </p>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            { label: "Ghana Post GPS", value: loc.ghanaPostGPS },
            { label: "Region", value: loc.region },
            { label: "City", value: loc.city },
            { label: "District", value: loc.district },
            { label: "Locality", value: loc.locality },
            {
              label: "Source",
              value: loc.sourceProvider
                ? loc.sourceProvider.charAt(0).toUpperCase() +
                  loc.sourceProvider.slice(1)
                : undefined,
            },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                {label}
              </p>
              <p
                className={
                  value
                    ? "text-xs font-medium text-foreground"
                    : "text-xs italic text-muted-foreground/50"
                }>
                {value ?? "—"}
              </p>
            </div>
          ))}
        </div>

        {loc.gpsCoordinates && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <Navigation size={11} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground tabular-nums">
                {loc.gpsCoordinates.latitude.toFixed(6)},{" "}
                {loc.gpsCoordinates.longitude.toFixed(6)}
              </p>
            </div>
          </>
        )}

        {loc.nearbyLandmark && (
          <>
            <Separator />
            <div className="flex items-start gap-2">
              <Landmark
                size={11}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <p className="text-xs text-muted-foreground">
                {loc.nearbyLandmark}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Read-only display when not editing ───────────────────────────────────────

function LocationReadView({ profile }: { profile: ProviderProfile }) {
  const loc = profile.locationData;

  if (!loc) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <MapPin size={18} className="text-zinc-400" />
        </div>
        <p className="text-sm text-muted-foreground">No location set yet</p>
        <p className="text-xs text-muted-foreground/60">
          Add your location details
        </p>
      </div>
    );
  }

  const summary = [loc.locality, loc.city, loc.region]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin
            size={14}
            className="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {summary || loc.ghanaPostGPS}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {loc.ghanaPostGPS}
          </p>
        </div>
        {loc.isAddressVerified && (
          <Badge
            variant="outline"
            className="ml-auto shrink-0 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-xs gap-1">
            <ShieldCheck size={10} /> Verified
          </Badge>
        )}
      </div>

      {loc.nearbyLandmark && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-11">
          <Landmark size={11} />
          {loc.nearbyLandmark}
        </div>
      )}

      {loc.gpsCoordinates && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-11 font-mono">
          <Navigation size={11} />
          {loc.gpsCoordinates.latitude.toFixed(5)},{" "}
          {loc.gpsCoordinates.longitude.toFixed(5)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LocationCard({
  profile,
  updateLocation,
  updateLocationState,
}: LocationCardProps) {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const locationForm = useLocationForm({
    ghanaPostGPS: profile.locationData?.ghanaPostGPS ?? "",
    nearbyLandmark: profile.locationData?.nearbyLandmark ?? "",
    coordinates: profile.locationData?.gpsCoordinates ?? null,
  });

  const openEdit = () => {
    locationForm.reset({
      ghanaPostGPS: profile.locationData?.ghanaPostGPS ?? "",
      nearbyLandmark: profile.locationData?.nearbyLandmark ?? "",
      coordinates: profile.locationData?.gpsCoordinates ?? null,
    });
    setStep("form");
    setEnrichError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setStep("form");
    setEnrichError(null);
  };

  const handleEnrich = async () => {
    if (!locationForm.isValid) return;
    setEnriching(true);
    setEnrichError(null);

    try {
      await updateLocation(locationForm.toPayload());
      setStep("preview");
    } catch {
      setEnrichError("Enrichment failed. Check your GPS code and try again.");
    } finally {
      setEnriching(false);
    }
  };

  const handleSave = () => {
    setEditing(false);
    setStep("form");
  };

  return (
    <Card className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <SectionIcon
              icon={MapPin}
              className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900"
            />
            <div>
              <CardTitle className="text-base">Location</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your location helps customers find you more easily.
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

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <CardContent className="space-y-4">
        {!editing ? (
          <LocationReadView profile={profile} />
        ) : step === "form" ? (
          <div className="space-y-4">
            <LocationFormFields
              ghanaPostGPS={locationForm.ghanaPostGPS}
              nearbyLandmark={locationForm.nearbyLandmark}
              coordinates={locationForm.coordinates}
              gpsStatus={locationForm.gpsStatus}
              gpsCodeInvalid={locationForm.gpsCodeInvalid}
              onGhanaPostGPSChange={locationForm.setGhanaPostGPS}
              onNearbyLandmarkChange={locationForm.setNearbyLandmark}
              onCoordinatesChange={locationForm.setCoordinates}
              onRequestGps={locationForm.requestGps}
              coordinatesIdleDescription="Your device's location helps verify your address and improves search accuracy for nearby customers."
            />

            {enrichError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertTriangle size={13} />
                <AlertDescription className="ml-2 text-xs">
                  {enrichError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* ── Preview step ─────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <CheckCircle2
                  size={12}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Enrichment complete — review your details
              </p>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Confirm the details below look correct, then click Save to keep
              them on your profile.
            </p>
            <LocationPreview profile={profile} />
          </div>
        )}
      </CardContent>

      {/* ── Footer (editing only) ───────────────────────────────────────────── */}
      {editing && (
        <CardFooter className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-4">
          {step === "form" ? (
            <div className="w-full flex justify-between items-center gap-3">
              <InlineFeedback
                {...updateLocationState}
                successMsg="Location enriched"
              />
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={cancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={
                    !locationForm.isValid ||
                    enriching ||
                    updateLocationState.loading
                  }
                  onClick={handleEnrich}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white gap-1.5">
                  {enriching ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {enriching ? "Enriching…" : "Enrich Address"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-between items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("form")}
                className="text-xs">
                ← Edit again
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={cancel}>
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white gap-1.5">
                  <CheckCircle2 size={13} />
                  Save Location
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
