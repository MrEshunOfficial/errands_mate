"use client";

import { useState } from "react";
import {
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Loader2,
  Globe,
  AlertTriangle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { LocationLabel } from "@/types/location.types";
import type { Location } from "@/types/location.types";
import { useLocationForm } from "@/hooks/profiles/useLocationForm";
import { LocationFormFields } from "@/components/shared/location";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressFormValues {
  label: LocationLabel;
  customLabel: string;
  ghanaPostGPS: string;
  nearbyLandmark: string;
  isDefault: boolean;
  liveCoords: { latitude: number; longitude: number } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const EMPTY_FORM: AddressFormValues = {
  label: LocationLabel.HOME,
  customLabel: "",
  ghanaPostGPS: "",
  nearbyLandmark: "",
  isDefault: false,
  liveCoords: null,
};

export const LABEL_CONFIG = [
  { value: LocationLabel.HOME, text: "Home", icon: Home },
  { value: LocationLabel.WORK, text: "Work", icon: Briefcase },
  { value: LocationLabel.SCHOOL, text: "School", icon: GraduationCap },
  { value: LocationLabel.OTHER, text: "Other", icon: MapPin },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
      {children}
    </Label>
  );
}

// ─── Address Preview ──────────────────────────────────────────────────────────

function AddressPreview({ address }: { address: Location["address"] }) {
  const hasDetails = !!(
    address.streetName ||
    address.locality ||
    address.city ||
    address.district ||
    address.region
  );
  if (!hasDetails) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-linear-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-zinc-200 dark:border-zinc-700">
        <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
          CURRENT ADDRESS DETAILS
        </p>
      </div>
      <div className="p-3.5 space-y-1">
        {(address.houseNumber || address.streetName) && (
          <p className="text-xs font-medium text-foreground">
            {[address.houseNumber, address.streetName].filter(Boolean).join(" ")}
          </p>
        )}
        {address.locality && (
          <p className="text-xs text-muted-foreground">{address.locality}</p>
        )}
        {(address.city || address.district) && (
          <p className="text-xs text-muted-foreground">
            {[address.city, address.district].filter(Boolean).join(" · ")}
          </p>
        )}
        {address.region && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
            {address.region}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/50 pt-1">
          Re-enriched automatically when the GPS code is updated.
        </p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface ClientAddressFormProps {
  initial: AddressFormValues;
  saving: boolean;
  serverError: string | null;
  onSubmit: (values: AddressFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
  readonlyAddress?: Location["address"];
}

export function ClientAddressForm({
  initial,
  saving,
  serverError,
  onSubmit,
  onCancel,
  submitLabel,
  readonlyAddress,
}: ClientAddressFormProps) {
  const [label, setLabel] = useState(initial.label);
  const [customLabel, setCustomLabel] = useState(initial.customLabel);
  const [isDefault, setIsDefault] = useState(initial.isDefault);

  const locationForm = useLocationForm({
    ghanaPostGPS: initial.ghanaPostGPS,
    nearbyLandmark: initial.nearbyLandmark,
    coordinates: initial.liveCoords,
  });

  const valid =
    locationForm.isValid &&
    (label !== LocationLabel.OTHER || customLabel.trim().length > 0);

  const handleSubmit = () => {
    onSubmit({
      label,
      customLabel,
      isDefault,
      ghanaPostGPS: locationForm.ghanaPostGPS,
      nearbyLandmark: locationForm.nearbyLandmark,
      liveCoords: locationForm.coordinates,
    });
  };

  return (
    <div className="space-y-5">
      {readonlyAddress && <AddressPreview address={readonlyAddress} />}

      {/* Label picker */}
      <div className="space-y-2">
        <FieldLabel>Label</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LABEL_CONFIG.map(({ value, text, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLabel(value)}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                label === value
                  ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-600"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}>
              <Icon size={15} />
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Custom label */}
      {label === LocationLabel.OTHER && (
        <div className="space-y-1.5">
          <FieldLabel>
            Custom name{" "}
            <span className="text-red-400 normal-case font-normal">*</span>
          </FieldLabel>
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. Mum's House, Kantamanto"
            className="h-9 text-sm"
          />
        </div>
      )}

      {/* Shared location fields: GPS code + landmark + coordinates */}
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
        coordinatesIdleDescription="Helps match you to nearby providers when posting a task."
      />

      {/* Is default */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 rounded accent-amber-500"
        />
        <span className="text-sm text-foreground">
          Set as my default address
        </span>
      </label>

      {serverError && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle size={14} />
          <AlertDescription className="text-xs ml-2">
            {serverError}
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={saving || !valid}
          onClick={handleSubmit}
          className="bg-zinc-900 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs gap-1.5">
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={onCancel}
          className="text-xs text-muted-foreground">
          Cancel
        </Button>
      </div>
    </div>
  );
}
