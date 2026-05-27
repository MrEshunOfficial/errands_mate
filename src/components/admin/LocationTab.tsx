"use client";

import { MapPin } from "lucide-react";
import { BookingRowData } from "./helpers";

interface InfoRowProps {
  label: string;
  value: string | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] text-sm">
      <div className="px-3 pt-2 pb-0.5 sm:py-2 bg-muted/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="px-3 pb-2 pt-0.5 sm:py-2 break-words">{value ?? "—"}</div>
    </div>
  );
}

interface LocationTabProps {
  booking: BookingRowData;
}

export function LocationTab({ booking }: LocationTabProps) {
  const loc = booking.serviceLocation;

  if (!loc) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No service location recorded.
      </div>
    );
  }

  const fields: [string, string | undefined][] = [
    ["Ghana Post GPS", loc.ghanaPostGPS],
    ["City", loc.city ?? loc.locality],
    ["Region", loc.region],
    ["District", loc.district],
    ["Street", loc.streetName],
    ["House No.", loc.houseNumber],
    ["Landmark", loc.nearbyLandmark],
    [
      "Coordinates",
      loc.gpsCoordinates
        ? `${loc.gpsCoordinates.latitude}, ${loc.gpsCoordinates.longitude}`
        : undefined,
    ],
    [
      "Verified",
      loc.isAddressVerified !== undefined
        ? loc.isAddressVerified
          ? "Yes"
          : "No"
        : undefined,
    ],
  ];

  if (fields.every(([, v]) => !v)) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No location details available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loc.gpsCoordinates && (
        <div className="rounded-lg border overflow-hidden">
          <a
            href={`https://www.google.com/maps?q=${loc.gpsCoordinates.latitude},${loc.gpsCoordinates.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-muted/40 transition-colors">
            <MapPin className="h-3.5 w-3.5" />
            View on Google Maps
          </a>
        </div>
      )}
      <div className="rounded-lg border overflow-hidden divide-y">
        {fields.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
