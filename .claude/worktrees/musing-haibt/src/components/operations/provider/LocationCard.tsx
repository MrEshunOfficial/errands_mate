"use client";

/**
 * LocationCard.tsx
 *
 * Provider location settings card.
 * Flow:
 *   1. User enters Ghana Post GPS code + optional nearby landmark
 *   2. Component requests browser geolocation (with permission prompt)
 *   3. On "Enrich", calls updateLocation — server resolves region/city/district etc.
 *   4. Shows enriched location preview; user confirms with "Save"
 *
 * Props mirror the shape expected by ProviderSettings.tsx.
 */

import { useState, useCallback, type ReactNode } from "react";
import {
  MapPin,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Navigation,
  NavigationOff,
  Landmark,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Globe,
  LocateFixed,
  PenLine,
  RefreshCw,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type {
  ProviderProfile,
  UpdateLocationBody,
} from "@/types/provider.profile.types";

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

type GpsPermissionStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

// ─── Small helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
      {children}
    </Label>
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

// ─── Coordinates Section ──────────────────────────────────────────────────────
//
// Three sub-states after permission is granted:
//   "captured"  — auto-detected, read-only display + "Edit" toggle
//   "editing"   — manual lat/lng inputs (pre-filled with auto values)
//   "manual"    — user never granted permission, enters coords by hand
//
// The component is fully controlled: parent owns `coordinates` + `setCoordinates`.

function isValidCoord(val: string, type: "lat" | "lng"): boolean {
  const n = parseFloat(val);
  if (isNaN(n)) return false;
  return type === "lat" ? n >= -90 && n <= 90 : n >= -180 && n <= 180;
}

interface CoordinatesSectionProps {
  status: GpsPermissionStatus;
  coordinates: { latitude: number; longitude: number } | null;
  onRequestPermission: () => void;
  onCoordinatesChange: (
    c: { latitude: number; longitude: number } | null,
  ) => void;
  onRefetch: () => void;
}

function CoordinatesSection({
  status,
  coordinates,
  onRequestPermission,
  onCoordinatesChange,
  onRefetch,
}: CoordinatesSectionProps) {
  // Local edit state — only active when the user wants to override auto values
  const [overriding, setOverriding] = useState(false);
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");

  const openOverride = () => {
    setLatStr(coordinates ? String(coordinates.latitude) : "");
    setLngStr(coordinates ? String(coordinates.longitude) : "");
    setOverriding(true);
  };

  const cancelOverride = () => {
    setOverriding(false);
  };

  const applyOverride = () => {
    if (!isValidCoord(latStr, "lat") || !isValidCoord(lngStr, "lng")) return;
    onCoordinatesChange({
      latitude: parseFloat(latStr),
      longitude: parseFloat(lngStr),
    });
    setOverriding(false);
  };

  const clearCoordinates = () => {
    onCoordinatesChange(null);
    setOverriding(false);
  };

  const latInvalid = latStr !== "" && !isValidCoord(latStr, "lat");
  const lngInvalid = lngStr !== "" && !isValidCoord(lngStr, "lng");
  const canApply = isValidCoord(latStr, "lat") && isValidCoord(lngStr, "lng");

  // ── requesting ──────────────────────────────────────────────────────────────
  if (status === "requesting") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3.5 py-2.5">
        <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
          Waiting for location permission…
        </p>
      </div>
    );
  }

  // ── denied ───────────────────────────────────────────────────────────────────
  if (status === "denied" || status === "unavailable") {
    const isDenied = status === "denied";
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5">
          <NavigationOff
            size={13}
            className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {isDenied ? "Location access denied" : "GPS unavailable"}
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
              {isDenied
                ? "Update your browser's site permissions to enable auto-detect."
                : "GPS is not supported on this device or browser."}
            </p>
          </div>
        </div>

        {/* Manual entry fallback */}
        {!overriding ? (
          <button
            type="button"
            onClick={openOverride}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <PenLine size={11} />
            Enter coordinates manually
          </button>
        ) : (
          <ManualCoordInputs
            latStr={latStr}
            lngStr={lngStr}
            latInvalid={latInvalid}
            lngInvalid={lngInvalid}
            canApply={canApply}
            onLatChange={setLatStr}
            onLngChange={setLngStr}
            onApply={applyOverride}
            onCancel={cancelOverride}
          />
        )}

        {/* Show saved manual coords if any */}
        {!overriding && coordinates && (
          <CapturedCoordBadge
            coordinates={coordinates}
            isManual
            onEdit={openOverride}
            onClear={clearCoordinates}
          />
        )}
      </div>
    );
  }

  // ── granted — show captured coords + optional manual override ────────────────
  if (status === "granted" && coordinates) {
    return (
      <div className="space-y-2.5">
        {!overriding ? (
          <>
            <CapturedCoordBadge
              coordinates={coordinates}
              isManual={false}
              onEdit={openOverride}
              onClear={clearCoordinates}
              onRefetch={onRefetch}
            />
            <p className="text-xs text-muted-foreground pl-0.5">
              Coordinates look wrong?{" "}
              <button
                type="button"
                onClick={openOverride}
                className="underline underline-offset-2 hover:text-foreground transition-colors">
                Edit manually
              </button>{" "}
              or{" "}
              <button
                type="button"
                onClick={onRefetch}
                className="underline underline-offset-2 hover:text-foreground transition-colors">
                re-detect
              </button>
              .
            </p>
          </>
        ) : (
          <ManualCoordInputs
            latStr={latStr}
            lngStr={lngStr}
            latInvalid={latInvalid}
            lngInvalid={lngInvalid}
            canApply={canApply}
            onLatChange={setLatStr}
            onLngChange={setLngStr}
            onApply={applyOverride}
            onCancel={cancelOverride}
          />
        )}
      </div>
    );
  }

  // ── idle — ask for permission ─────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LocateFixed size={12} className="text-muted-foreground" />
              Auto-detect your coordinates?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your device&apos;s location helps verify your address and improves
              search accuracy for nearby customers.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs shrink-0 gap-1.5 h-7 border-zinc-300 dark:border-zinc-600"
            onClick={onRequestPermission}>
            Allow
            <ChevronRight size={11} />
          </Button>
        </div>
      </div>

      {/* Manual entry alternative */}
      {!overriding ? (
        <button
          type="button"
          onClick={openOverride}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <PenLine size={11} />
          Enter coordinates manually instead
        </button>
      ) : (
        <ManualCoordInputs
          latStr={latStr}
          lngStr={lngStr}
          latInvalid={latInvalid}
          lngInvalid={lngInvalid}
          canApply={canApply}
          onLatChange={setLatStr}
          onLngChange={setLngStr}
          onApply={applyOverride}
          onCancel={cancelOverride}
        />
      )}

      {/* Show saved manual coords if any */}
      {!overriding && coordinates && (
        <CapturedCoordBadge
          coordinates={coordinates}
          isManual
          onEdit={openOverride}
          onClear={clearCoordinates}
        />
      )}
    </div>
  );
}

// ── Captured coord display pill ────────────────────────────────────────────────

interface CapturedCoordBadgeProps {
  coordinates: { latitude: number; longitude: number };
  isManual: boolean;
  onEdit: () => void;
  onClear: () => void;
  onRefetch?: () => void;
}

function CapturedCoordBadge({
  coordinates,
  isManual,
  onEdit,
  onClear,
  onRefetch,
}: CapturedCoordBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
      <Navigation
        size={12}
        className="text-emerald-600 dark:text-emerald-400 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
          {isManual ? "Manual coordinates" : "Auto-detected"}
        </p>
        <p className="text-xs tabular-nums text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 truncate">
          {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onRefetch && !isManual && (
          <button
            type="button"
            onClick={onRefetch}
            title="Re-detect location"
            className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
            <RefreshCw size={11} />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          title="Edit coordinates"
          className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
          <PenLine size={11} />
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Remove coordinates"
          className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
          <XCircle size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Manual lat/lng input form ──────────────────────────────────────────────────

interface ManualCoordInputsProps {
  latStr: string;
  lngStr: string;
  latInvalid: boolean;
  lngInvalid: boolean;
  canApply: boolean;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

function ManualCoordInputs({
  latStr,
  lngStr,
  latInvalid,
  lngInvalid,
  canApply,
  onLatChange,
  onLngChange,
  onApply,
  onCancel,
}: ManualCoordInputsProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 space-y-3">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <PenLine size={12} className="text-muted-foreground" />
        Enter coordinates manually
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Latitude
          </label>
          <Input
            type="number"
            step="any"
            value={latStr}
            onChange={(e) => onLatChange(e.target.value)}
            placeholder="e.g. 5.614818"
            className={`font-mono text-xs h-8 dark:bg-zinc-900 dark:border-zinc-700 ${
              latInvalid
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
            }`}
          />
          {latInvalid && (
            <p className="text-[10px] text-destructive">Must be −90 to 90</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Longitude
          </label>
          <Input
            type="number"
            step="any"
            value={lngStr}
            onChange={(e) => onLngChange(e.target.value)}
            placeholder="e.g. −0.205874"
            className={`font-mono text-xs h-8 dark:bg-zinc-900 dark:border-zinc-700 ${
              lngInvalid
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
            }`}
          />
          {lngInvalid && (
            <p className="text-[10px] text-destructive">Must be −180 to 180</p>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        You can get these from Google Maps — long-press your location and copy
        the numbers shown at the top.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
          disabled={!canApply}
          onClick={onApply}>
          <CheckCircle2 size={11} />
          Apply
        </Button>
      </div>
    </div>
  );
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
      {/* Header stripe */}
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
        {/* Address lines */}
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

        {/* Data grid */}
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

        {/* GPS coords */}
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

        {/* Nearby landmark */}
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
          Add your Ghana Post GPS code to appear in local searches
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

  // Form state
  const [ghanaPostGPS, setGhanaPostGPS] = useState(
    profile.locationData?.ghanaPostGPS ?? "",
  );
  const [nearbyLandmark, setNearbyLandmark] = useState(
    profile.locationData?.nearbyLandmark ?? "",
  );

  // GPS permission flow
  const [gpsStatus, setGpsStatus] = useState<GpsPermissionStatus>("idle");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(profile.locationData?.gpsCoordinates ?? null);

  // Step tracking: "form" → user fills in fields / gets GPS
  //               "preview" → enrichment done, show result before save
  const [step, setStep] = useState<"form" | "preview">("form");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  // ── GPS permission + re-detect handler ────────────────────────────────────

  const fetchGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGpsStatus("granted");
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        setGpsStatus(err.code === 1 ? "denied" : "unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0, // ← force a fresh reading every time, no cache
      },
    );
  }, []);

  // Alias used for the initial "Allow" click — same function
  const requestGps = fetchGps;

  // ── Open / close edit ───────────────────────────────────────────────────────

  const openEdit = () => {
    setGhanaPostGPS(profile.locationData?.ghanaPostGPS ?? "");
    setNearbyLandmark(profile.locationData?.nearbyLandmark ?? "");
    setCoordinates(profile.locationData?.gpsCoordinates ?? null);
    setGpsStatus(profile.locationData?.gpsCoordinates ? "granted" : "idle");
    setStep("form");
    setEnrichError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setStep("form");
    setEnrichError(null);
  };

  // ── Enrich (calls the API — server resolves region/city etc.) ───────────────
  // We call updateLocation here which both enriches AND saves server-side.
  // After the call the profile in state is updated via sync() in the hook.
  // We then move to the "preview" step so the user can review before "Save".

  const handleEnrich = async () => {
    if (!ghanaPostGPS.trim()) return;
    setEnriching(true);
    setEnrichError(null);

    const body: UpdateLocationBody = {
      ghanaPostGPS: ghanaPostGPS.trim(),
      ...(nearbyLandmark.trim()
        ? { nearbyLandmark: nearbyLandmark.trim() }
        : {}),
      ...(coordinates ? { gpsCoordinates: coordinates } : {}),
    };

    try {
      await updateLocation(body);
      setStep("preview");
    } catch {
      setEnrichError("Enrichment failed. Check your GPS code and try again.");
    } finally {
      setEnriching(false);
    }
  };

  // ── Final save (profile already updated by enrichment) ──────────────────────

  const handleSave = () => {
    setEditing(false);
    setStep("form");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const gpsInputInvalid =
    ghanaPostGPS.trim().length > 0 &&
    !/^[A-Za-z]{2}-\d{3,4}-\d{4}$/.test(ghanaPostGPS.trim());

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
                Your Ghana Post GPS address — used for discovery and matching
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
            {/* Ghana Post GPS code */}
            <div className="space-y-1.5">
              <FieldLabel>Ghana Post GPS Code *</FieldLabel>
              <div className="relative">
                <Input
                  value={ghanaPostGPS}
                  onChange={(e) =>
                    setGhanaPostGPS(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. GA-123-4567"
                  className={`font-mono dark:bg-zinc-800 dark:border-zinc-700 pr-10 ${
                    gpsInputInvalid
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }`}
                  spellCheck={false}
                />
                <MapPin
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
              {gpsInputInvalid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle size={11} />
                  Format should be like GA-123-4567
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your Ghana Post digital address code. The server will
                resolve your full address from this.
              </p>
            </div>

            {/* Nearby landmark */}
            <div className="space-y-1.5">
              <FieldLabel>Nearby Landmark</FieldLabel>
              <div className="relative">
                <Input
                  value={nearbyLandmark}
                  onChange={(e) => setNearbyLandmark(e.target.value)}
                  placeholder="e.g. Near Accra Mall, Opposite Total station"
                  className="dark:bg-zinc-800 dark:border-zinc-700 pr-10"
                />
                <Landmark
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional — helps customers find you more easily.
              </p>
            </div>

            {/* GPS coordinates */}
            <div className="space-y-1.5">
              <FieldLabel>GPS Coordinates</FieldLabel>
              <CoordinatesSection
                status={gpsStatus}
                coordinates={coordinates}
                onRequestPermission={requestGps}
                onCoordinatesChange={setCoordinates}
                onRefetch={fetchGps}
              />
            </div>

            {/* Enrich error */}
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
                    !ghanaPostGPS.trim() ||
                    gpsInputInvalid ||
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
