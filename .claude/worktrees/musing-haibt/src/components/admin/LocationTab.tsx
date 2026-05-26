"use client";

import { MapPin } from "lucide-react";
import { BookingRowData } from "./helpers";

interface InfoRowProps {
  label: string;
  value: string | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] text-sm">
      <div className="py-2 px-3 bg-muted/50 text-xs font-mono text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="py-2 px-3 break-all">{value ?? "—"}</div>
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

  // ServiceLocation from booking.types.ts: { address, city?, country?, coordinates? }
  // The API may also return extended UserLocation fields — rendered if present.
  const extLoc = loc as typeof loc & {
    ghanaPostGPS?: string;
    region?: string;
    district?: string;
    locality?: string;
    streetName?: string;
    houseNumber?: string;
    nearbyLandmark?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
    isAddressVerified?: boolean;
    sourceProvider?: string;
  };

  const fields: [string, string | undefined][] = [
    ["Address", loc.address],
    ["City", loc.city ?? extLoc.locality],
    ["Country", loc.country],
    [
      "Coordinates",
      loc.coordinates
        ? `${loc.coordinates.lat}, ${loc.coordinates.lng}`
        : extLoc.gpsCoordinates
          ? `${extLoc.gpsCoordinates.latitude}, ${extLoc.gpsCoordinates.longitude}`
          : undefined,
    ],
    ["Ghana Post GPS", extLoc.ghanaPostGPS],
    ["Region", extLoc.region],
    ["District", extLoc.district],
    ["Street", extLoc.streetName],
    ["House No.", extLoc.houseNumber],
    ["Landmark", extLoc.nearbyLandmark],
    [
      "Verified",
      extLoc.isAddressVerified !== undefined
        ? extLoc.isAddressVerified
          ? "Yes"
          : "No"
        : undefined,
    ],
    ["Source", extLoc.sourceProvider],
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
      {loc.coordinates && (
        <div className="rounded-lg border overflow-hidden">
          <a
            href={`https://www.google.com/maps?q=${loc.coordinates.lat},${loc.coordinates.lng}`}
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
