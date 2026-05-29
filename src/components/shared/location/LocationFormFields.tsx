"use client";

import { MapPin, Landmark, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoordinatesSection } from "./CoordinatesSection";
import type { GpsStatus } from "@/hooks/profiles/useLocationForm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
      {children}
    </Label>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationFormFieldsProps {
  ghanaPostGPS: string;
  nearbyLandmark: string;
  coordinates: { latitude: number; longitude: number } | null;
  gpsStatus: GpsStatus;
  gpsCodeInvalid: boolean;
  onGhanaPostGPSChange: (v: string) => void;
  onNearbyLandmarkChange: (v: string) => void;
  onCoordinatesChange: (
    c: { latitude: number; longitude: number } | null,
  ) => void;
  onRequestGps: () => void;
  /** Overrides the idle-state prompt message in CoordinatesSection */
  coordinatesIdleDescription?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * The three standard fields shared by every location-bearing operation:
 *   1. Ghana Post GPS code (required)
 *   2. Nearby landmark (optional)
 *   3. GPS coordinates (auto-detected by browser; manual fallback)
 *
 * Fully controlled — no internal state. Wire it up with useLocationForm.
 */
export function LocationFormFields({
  ghanaPostGPS,
  nearbyLandmark,
  coordinates,
  gpsStatus,
  gpsCodeInvalid,
  onGhanaPostGPSChange,
  onNearbyLandmarkChange,
  onCoordinatesChange,
  onRequestGps,
  coordinatesIdleDescription,
}: LocationFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Ghana Post GPS code */}
      <div className="space-y-1.5">
        <FieldLabel>Ghana Post GPS Code *</FieldLabel>
        <div className="relative">
          <Input
            value={ghanaPostGPS}
            onChange={(e) => onGhanaPostGPSChange(e.target.value.toUpperCase())}
            placeholder="e.g. GA-123-4567"
            className={`font-mono dark:bg-zinc-800 dark:border-zinc-700 pr-10 ${
              gpsCodeInvalid
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
        {gpsCodeInvalid ? (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle size={11} />
            Use format XX-123-4567 or XX-1234-5678 (e.g. GA-123-4567)
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Find yours at{" "}
            <span className="text-amber-600 dark:text-amber-400">
              map.ghanapostgps.com
            </span>
          </p>
        )}
      </div>

      {/* Nearby landmark */}
      <div className="space-y-1.5">
        <FieldLabel>
          Nearby Landmark{" "}
          <span className="normal-case font-normal text-muted-foreground">
            (optional)
          </span>
        </FieldLabel>
        <div className="relative">
          <Input
            value={nearbyLandmark}
            onChange={(e) => onNearbyLandmarkChange(e.target.value)}
            placeholder="e.g. Near Accra Mall, Opposite Total station"
            className="dark:bg-zinc-800 dark:border-zinc-700 pr-10"
          />
          <Landmark
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Helps people find you more easily.
        </p>
      </div>

      {/* GPS coordinates */}
      <div className="space-y-1.5">
        <FieldLabel>GPS Coordinates</FieldLabel>
        <CoordinatesSection
          status={gpsStatus}
          coordinates={coordinates}
          onRequestPermission={onRequestGps}
          onCoordinatesChange={onCoordinatesChange}
          onRefetch={onRequestGps}
          idleDescription={coordinatesIdleDescription}
        />
      </div>
    </div>
  );
}
