"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGeolocation } from "./useGeolocation";
import type { GeolocationState } from "./useGeolocation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GpsStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export interface LocationFormState {
  ghanaPostGPS: string;
  nearbyLandmark: string;
  /** accuracy (metres) is only present when captured by the browser; absent for manual entries */
  coordinates: { latitude: number; longitude: number; accuracy?: number } | null;
}

/** Minimal payload any location-bearing operation submits to the server. */
export interface LocationInput {
  ghanaPostGPS: string;
  nearbyLandmark?: string;
  gpsCoordinates?: { latitude: number; longitude: number; accuracy?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GPS_CODE_PATTERN = /^[A-Z]{2}-\d{3,4}-\d{4}$/;

function deriveGpsStatus(
  permission: string,
  geoState: GeolocationState,
): GpsStatus {
  if (geoState.status === "acquiring") return "requesting";
  if (
    permission === "denied" ||
    (geoState.status === "error" && geoState.code === 1)
  )
    return "denied";
  if (geoState.status === "error") return "unavailable";
  if (geoState.status === "captured") return "granted";
  return "idle";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Centralises all state for any form that collects a Ghana Post GPS code,
 * a nearby landmark, and browser-captured coordinates.
 *
 * Replaces the duplicated fetchGps + state blocks in LocationCard and
 * ClientAddressForm. Internally delegates to useGeolocation so the existing
 * permission-probing and change-listener logic is reused.
 */
export interface UseLocationFormOptions {
  /**
   * Request the browser GPS fix once when the form mounts, so coordinates are
   * usually captured by the time the user submits. Server-side enrichment can
   * only resolve region/city/locality from a coordinate fix (a bare Ghana Post
   * GPS code is not geocodable) — without this the address saves un-enriched.
   *
   * Enable on forms that are mounted on demand (add/edit dialogs, task posting,
   * request composition). Leave off where the hook lives on an always-rendered
   * surface (e.g. a settings card) so we don't prompt for location on page load.
   */
  autoRequestGps?: boolean;
}

export function useLocationForm(
  initial?: Partial<LocationFormState>,
  options?: UseLocationFormOptions,
) {
  const [ghanaPostGPS, setGhanaPostGPS] = useState(
    initial?.ghanaPostGPS ?? "",
  );
  const [nearbyLandmark, setNearbyLandmark] = useState(
    initial?.nearbyLandmark ?? "",
  );
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(initial?.coordinates ?? null);

  const { permission, state: geoState, requestLocation } = useGeolocation();

  // Auto-capture coordinates (including accuracy) the moment the browser returns a position
  useEffect(() => {
    if (geoState.status === "captured") {
      setCoordinates({
        latitude: geoState.coords.latitude,
        longitude: geoState.coords.longitude,
        accuracy: geoState.coords.accuracy,
      });
    }
  }, [geoState]);

  // Optionally kick off a GPS request once on mount. Fired a single time so a
  // user who declines or clears the fix isn't re-prompted on every re-render.
  const autoRequested = useRef(false);
  useEffect(() => {
    if (options?.autoRequestGps && !autoRequested.current) {
      autoRequested.current = true;
      requestLocation();
    }
  }, [options?.autoRequestGps, requestLocation]);

  const gpsStatus = deriveGpsStatus(permission, geoState);

  const gpsCodeInvalid =
    ghanaPostGPS.trim().length > 0 &&
    !GPS_CODE_PATTERN.test(ghanaPostGPS.trim());

  const isValid = ghanaPostGPS.trim().length >= 3 && !gpsCodeInvalid;

  const toPayload = useCallback(
    (): LocationInput => ({
      ghanaPostGPS: ghanaPostGPS.trim(),
      ...(nearbyLandmark.trim() ? { nearbyLandmark: nearbyLandmark.trim() } : {}),
      ...(coordinates ? { gpsCoordinates: coordinates } : {}),
    }),
    [ghanaPostGPS, nearbyLandmark, coordinates],
  );

  const reset = useCallback((to?: Partial<LocationFormState>) => {
    setGhanaPostGPS(to?.ghanaPostGPS ?? "");
    setNearbyLandmark(to?.nearbyLandmark ?? "");
    setCoordinates(to?.coordinates ?? null);
  }, []);

  return {
    ghanaPostGPS,
    nearbyLandmark,
    coordinates,
    gpsStatus,
    gpsCodeInvalid,
    isValid,
    setGhanaPostGPS,
    setNearbyLandmark,
    setCoordinates,
    requestGps: requestLocation,
    toPayload,
    reset,
  };
}
