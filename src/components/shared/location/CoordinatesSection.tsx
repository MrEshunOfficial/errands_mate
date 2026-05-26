"use client";

import { useState } from "react";
import {
  Navigation,
  NavigationOff,
  Loader2,
  PenLine,
  RefreshCw,
  XCircle,
  CheckCircle2,
  LocateFixed,
  ChevronRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GpsStatus } from "@/hooks/profiles/useLocationForm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isValidCoord(val: string, type: "lat" | "lng"): boolean {
  const n = parseFloat(val);
  if (isNaN(n)) return false;
  return type === "lat" ? n >= -90 && n <= 90 : n >= -180 && n <= 180;
}

// ─── Manual lat/lng inputs ────────────────────────────────────────────────────

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
        Long-press your spot in Google Maps to copy the numbers at the top.
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

// ─── Captured coordinate pill ─────────────────────────────────────────────────

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

// ─── Main export ──────────────────────────────────────────────────────────────

export interface CoordinatesSectionProps {
  status: GpsStatus;
  coordinates: { latitude: number; longitude: number } | null;
  onRequestPermission: () => void;
  onCoordinatesChange: (
    c: { latitude: number; longitude: number } | null,
  ) => void;
  onRefetch: () => void;
  /** Context-appropriate label for the idle state prompt */
  idleDescription?: string;
}

/**
 * Renders the GPS coordinates sub-section for any location form.
 * Handles all states: idle prompt, acquiring, captured (auto or manual),
 * denied, and unavailable — with a manual lat/lng override path for each.
 */
export function CoordinatesSection({
  status,
  coordinates,
  onRequestPermission,
  onCoordinatesChange,
  onRefetch,
  idleDescription = "Your device's location helps verify your address and improves accuracy.",
}: CoordinatesSectionProps) {
  const [overriding, setOverriding] = useState(false);
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");

  const openOverride = () => {
    setLatStr(coordinates ? String(coordinates.latitude) : "");
    setLngStr(coordinates ? String(coordinates.longitude) : "");
    setOverriding(true);
  };

  const cancelOverride = () => setOverriding(false);

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

  if (status === "requesting") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3.5 py-2.5">
        <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
          Detecting location…
        </p>
      </div>
    );
  }

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

  // idle — prompt to allow
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
              {idleDescription}
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
