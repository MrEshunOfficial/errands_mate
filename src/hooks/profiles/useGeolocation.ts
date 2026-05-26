// hooks/useGeolocation.ts
"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Reflects the browser Permissions API `state` values, plus "unknown" for
 * environments where the Permissions API is unavailable (e.g. Firefox < 46,
 * or HTTP pages where the API is blocked before we even query it).
 */
export type GeolocationPermission = "unknown" | "prompt" | "granted" | "denied";

export type GeolocationState =
  | { status: "idle" }
  | { status: "acquiring" }
  | {
      status: "captured";
      coords: {
        latitude: number;
        longitude: number;
        /**
         * Horizontal accuracy in metres as reported by the device.
         * Sent to the server so the enrichment service can apply its
         * ACCURACY_THRESHOLD_M check before trusting the fix.
         */
        accuracy: number;
      };
    }
  | { status: "error"; message: string; code?: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: "Location access denied — allow it in your browser settings",
  2: "Position unavailable — check your device GPS",
  3: "Location request timed out — please try again",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages browser geolocation permission state and coordinate acquisition.
 *
 * Separating this from LocationCard keeps the component focused on UI
 * and makes the geolocation logic independently testable.
 *
 * Permission probing:
 *   On mount we query the Permissions API (when available) to read the
 *   existing state without triggering a browser dialog. This lets the
 *   parent skip the permission step entirely when access is already granted,
 *   or show the blocked UI immediately when it's already denied.
 *
 * Permission change tracking:
 *   We attach an `onchange` listener so the hook stays in sync if the user
 *   changes site permissions in the browser while the page is open.
 */
export function useGeolocation() {
  const [permission, setPermission] =
    useState<GeolocationPermission>("unknown");
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  // ── Probe existing permission on mount ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("permissions" in navigator)) return; // Permissions API unavailable

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        permissionStatus = status;
        setPermission(status.state as GeolocationPermission);

        // Stay in sync if the user changes site settings while on the page
        status.onchange = () => {
          setPermission(status.state as GeolocationPermission);
        };
      })
      .catch(() => {
        // Permissions API blocked or unavailable — will be resolved on first request
        setPermission("unknown");
      });

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  // ── Request location ───────────────────────────────────────────────────────

  /**
   * Triggers `navigator.geolocation.getCurrentPosition`.
   *
   * If permission is already granted this resolves immediately without showing
   * a browser dialog. If it's "prompt", the browser dialog appears. If denied,
   * the error callback fires with code 1.
   *
   * maximumAge: 0  — always acquire a fresh fix; never serve a stale cache
   * timeout: 10 000 — extra headroom for mobile radios warming up
   */
  const requestLocation = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      setState({
        status: "error",
        message: "Location requires a secure connection (HTTPS)",
      });
      return;
    }

    if (!("geolocation" in navigator)) {
      setState({
        status: "error",
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    setState({ status: "acquiring" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        setState({
          status: "captured",
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        });
      },
      (err) => {
        // Update permission state so the UI can immediately show the blocked view
        if (err.code === 1) setPermission("denied");

        setState({
          status: "error",
          message:
            GEOLOCATION_ERRORS[err.code] ?? "Could not determine location",
          code: err.code,
        });
      },
      { timeout: 10_000, maximumAge: 0, enableHighAccuracy: true },
    );
  }, []);

  /** Resets coordinate state without touching permission state. */
  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { permission, state, requestLocation, reset };
}
