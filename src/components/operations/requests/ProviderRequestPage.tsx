"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  Home,
  Users,
  ChevronRight,
  Layers,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Flame,
  Timer,
  ChevronsUp,
  Phone,
  Mail,
  Circle,
  Shield,
  Tag,
  FileText,
  Bookmark,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import {
  useProviderProfile,
  useServiceOfferings,
} from "@/hooks/profiles/useProviderProfile";
import { WeeklyScheduleCalendar } from "@/components/operations/helpers/WeeklyScheduleCalendar";
import {
  useCreateServiceBrowseRequest,
  useCreateTaskMatchRequest,
  useCreateTaskInterestRequest,
} from "@/hooks/requests/useProviderRequest";
import { useTaskById } from "@/hooks/tasks/useTasks";
import { useClientPreference } from "@/hooks/profiles/useClientPreference";
import { useLocationForm } from "@/hooks/profiles/useLocationForm";
import { profilePictureAPI } from "@/lib/api/files/profile/profile-picture.api";
import { TaskPriority } from "@/types/task.types";
import type { Task } from "@/types/task.types";
import { RequestSource } from "@/types/provider.request.types";
import { ProviderStatus } from "@/types/provider.profile.types";
import { LocationLabel } from "@/types/location.types";
import type { Location } from "@/types/location.types";
import type { Service } from "@/types/services/service.types";
import { LocationFormFields } from "@/components/shared/location";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  serviceId: string;
  priority: TaskPriority;
  preferredDate: string;
  flexibleDates: boolean;
  timeStart: string;
  timeEnd: string;
  clientMessage: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  locationMode: "existing" | "new";
  existingLocationId: string;
  saveNewLocation: boolean;
  newLocationLabel: LocationLabel;
  newLocationCustomLabel: string;
}

const INITIAL_FORM: FormState = {
  serviceId: "",
  priority: TaskPriority.MEDIUM,
  preferredDate: "",
  flexibleDates: false,
  timeStart: "",
  timeEnd: "",
  clientMessage: "",
  budgetMin: "",
  budgetMax: "",
  currency: "GHS",
  locationMode: "existing",
  existingLocationId: "",
  saveNewLocation: false,
  newLocationLabel: LocationLabel.HOME,
  newLocationCustomLabel: "",
};

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: TaskPriority.LOW,
    label: "Low",
    icon: <Timer size={13} />,
    color:
      "bg-stone-50 border-stone-200 text-stone-600 dark:bg-stone-800/40 dark:border-stone-700 dark:text-stone-400",
  },
  {
    value: TaskPriority.MEDIUM,
    label: "Medium",
    icon: <Zap size={13} />,
    color:
      "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-400",
  },
  {
    value: TaskPriority.HIGH,
    label: "High",
    icon: <Flame size={13} />,
    color:
      "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700/50 dark:text-orange-400",
  },
  {
    value: TaskPriority.URGENT,
    label: "Urgent",
    icon: <ChevronsUp size={13} />,
    color:
      "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-400",
  },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SectionCard({
  icon,
  title,
  children,
  iconBg = "bg-amber-100 dark:bg-amber-900/30",
  iconColor = "text-amber-600 dark:text-amber-400",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

// ─── Service option row ───────────────────────────────────────────────────────

function ServiceOption({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}) {
  const pricing = service.servicePricing;
  const priceLabel = pricing?.basePrice
    ? `${pricing.currency ?? "GHS"} ${pricing.basePrice} / ${pricing.unit ?? "session"}`
    : pricing?.pricingModel === "negotiable"
      ? "Negotiable"
      : pricing?.pricingModel === "free"
        ? "Free"
        : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm"
          : "border-stone-100 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800 hover:border-amber-200 dark:hover:border-amber-700/50"
      }`}>
      <div className="w-9 h-9 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
        <Layers size={15} className="text-stone-400 dark:text-stone-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            selected
              ? "text-amber-700 dark:text-amber-400"
              : "text-stone-800 dark:text-stone-100"
          }`}>
          {service.title}
        </p>
        {service.description && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
            {service.description}
          </p>
        )}
        {priceLabel && (
          <span className="inline-block text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full mt-1">
            {priceLabel}
          </span>
        )}
      </div>
      <div
        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          selected
            ? "border-amber-500 bg-amber-500"
            : "border-stone-300 dark:border-stone-600"
        }`}>
        {selected && <CheckCircle2 size={10} className="text-white" />}
      </div>
    </button>
  );
}

// ─── Provider hero — left panel ───────────────────────────────────────────────

function getStatusVisual(status: ProviderStatus) {
  switch (status) {
    case ProviderStatus.Available:
      return {
        label: "Available",
        dot: "text-emerald-500 fill-emerald-500",
        classes:
          "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
      };
    case ProviderStatus.Booked:
      return {
        label: "Currently booked",
        dot: "text-amber-500 fill-amber-500",
        classes:
          "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50",
      };
    case ProviderStatus.Requested:
      return {
        label: "Requested",
        dot: "text-sky-500 fill-sky-500",
        classes:
          "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",
      };
    case ProviderStatus.Closed:
      return {
        label: "Closed",
        dot: "text-stone-400 fill-stone-400",
        classes:
          "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700",
      };
    default:
      return null;
  }
}

interface ProviderHeroProps {
  businessName?: string;
  status: ProviderStatus;
  contactInfo?: {
    mainContact?: string | null;
    businessEmail?: string | null;
  } | null;
  locationData?: {
    locality?: string;
    city?: string;
    region?: string;
    ghanaPostGPS?: string;
    isAddressVerified?: boolean;
  } | null;
  isAlwaysAvailable: boolean;
  workingHours?: Record<string, { start: string; end: string }>;
  isAddressVerified?: boolean;
  profilePictureUrl?: string | null;
}

function ProviderHero({
  businessName,
  status,
  contactInfo,
  locationData,
  isAlwaysAvailable,
  workingHours,
  isAddressVerified,
  profilePictureUrl,
}: ProviderHeroProps) {
  const sv = getStatusVisual(status);
  const phone = contactInfo?.mainContact;
  const email = contactInfo?.businessEmail;
  const loc = locationData;
  const locationParts = [loc?.locality, loc?.city, loc?.region]
    .filter(Boolean)
    .join(", ");
  const addressVerified = isAddressVerified ?? loc?.isAddressVerified;
  const initials = businessName
    ? businessName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center gap-4 border-b border-stone-100 dark:border-stone-800">
        <div className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm">
          {profilePictureUrl ? (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <Image
                src={profilePictureUrl}
                alt={businessName ?? "Provider"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate">
            {businessName ?? "Provider"}
          </p>
          {sv && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${sv.classes}`}>
              <Circle size={6} className={sv.dot} />
              {sv.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {(phone || email) && (
          <div className="space-y-1.5">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Phone
                  size={13}
                  className="text-stone-400 dark:text-stone-500 shrink-0"
                />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Mail
                  size={13}
                  className="text-stone-400 dark:text-stone-500 shrink-0"
                />
                <span className="truncate">{email}</span>
              </a>
            )}
          </div>
        )}

        {loc && (
          <div className="flex items-start gap-2">
            <MapPin
              size={13}
              className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5"
            />
            <div className="space-y-0.5 min-w-0">
              {locationParts && (
                <p className="text-sm text-stone-700 dark:text-stone-200">
                  {locationParts}
                </p>
              )}
              {loc.ghanaPostGPS && (
                <p className="text-xs font-mono text-stone-400 dark:text-stone-500">
                  {loc.ghanaPostGPS}
                </p>
              )}
              {addressVerified && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <Shield size={10} />
                  Address verified
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-stone-100 dark:border-stone-800 pt-4 -mx-5 px-5">
          <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
            Availability
          </p>
          <WeeklyScheduleCalendar
            workingHours={workingHours}
            isAlwaysAvailable={isAlwaysAvailable}
            status={status}
            gridHeight={160}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Task context card — left panel ──────────────────────────────────────────

function TaskContextCard({ task }: { task: Task | null | undefined }) {
  if (!task) return null;

  const ctx = task.locationContext;
  const locationLine = [ctx?.ghanaPostGPS, ctx?.nearbyLandmark]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200/60 dark:border-amber-700/30 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <FileText size={12} className="text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
          Your Task
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug">
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}
        {locationLine && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <MapPin
              size={11}
              className="text-stone-400 dark:text-stone-500 shrink-0"
            />
            <span className="font-mono">{locationLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Selected service card — left panel (browse mode) ────────────────────────

function SelectedServiceCard({
  service,
}: {
  service: Service | null | undefined;
}) {
  if (!service) return null;

  const pricing = service.servicePricing;
  const priceLabel = pricing?.basePrice
    ? `${pricing.currency ?? "GHS"} ${pricing.basePrice} / ${pricing.unit ?? "session"}`
    : pricing?.pricingModel === "negotiable"
      ? "Negotiable"
      : pricing?.pricingModel === "free"
        ? "Free"
        : null;

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-700/40 bg-violet-50/60 dark:bg-violet-900/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-200/60 dark:border-violet-700/30 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <Layers size={12} className="text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-xs font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wide">
          Selected Service
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {service.title}
        </p>
        {service.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        )}
        {priceLabel && (
          <span className="inline-block text-[11px] font-bold text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-700/40">
            {priceLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Location section — service browse mode ───────────────────────────────────

interface LocationSectionProps {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: Partial<Record<keyof FormState, string>>;
  locations: Location[];
  isLoadingLocations: boolean;
  locationForm: ReturnType<typeof useLocationForm>;
}

function LocationSection({
  form,
  set,
  errors,
  locations,
  isLoadingLocations,
  locationForm,
}: LocationSectionProps) {
  const labelText: Record<LocationLabel, string> = {
    [LocationLabel.HOME]: "Home",
    [LocationLabel.WORK]: "Work",
    [LocationLabel.SCHOOL]: "School",
    [LocationLabel.OTHER]: "Other",
  };

  const labelIcon: Record<LocationLabel, React.ReactNode> = {
    [LocationLabel.HOME]: "🏠",
    [LocationLabel.WORK]: "💼",
    [LocationLabel.SCHOOL]: "🎓",
    [LocationLabel.OTHER]: "📍",
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set("locationMode", "existing")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
            form.locationMode === "existing"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
              : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
          }`}>
          <Bookmark size={12} />
          Saved address
        </button>
        <button
          type="button"
          onClick={() => set("locationMode", "new")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
            form.locationMode === "new"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
              : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
          }`}>
          <MapPin size={12} />
          New address
        </button>
      </div>

      {/* ── Existing addresses ────────────────────────────────────────────── */}
      {form.locationMode === "existing" && (
        <div className="space-y-2">
          {isLoadingLocations ? (
            <div className="flex items-center gap-2 py-4 text-stone-400 dark:text-stone-500">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Loading saved addresses…</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                No saved addresses.
              </p>
              <button
                type="button"
                onClick={() => set("locationMode", "new")}
                className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                Enter a new address instead
              </button>
            </div>
          ) : (
            locations.map((loc) => {
              const id = String(loc._id);
              const selected = form.existingLocationId === id;
              const label =
                loc.label === LocationLabel.OTHER && loc.customLabel
                  ? loc.customLabel
                  : labelText[loc.label];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("existingLocationId", id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                      : "border-stone-100 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800"
                  }`}>
                  <span className="text-lg leading-none shrink-0">
                    {labelIcon[loc.label]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${selected ? "text-amber-700 dark:text-amber-400" : "text-stone-800 dark:text-stone-100"}`}>
                      {label}
                    </p>
                    <p className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
                      {loc.address?.ghanaPostGPS}
                    </p>
                    {loc.address?.nearbyLandmark && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 truncate">
                        {loc.address.nearbyLandmark}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      selected
                        ? "border-amber-500 bg-amber-500"
                        : "border-stone-300 dark:border-stone-600"
                    }`}>
                    {selected && (
                      <CheckCircle2 size={10} className="text-white" />
                    )}
                  </div>
                </button>
              );
            })
          )}
          {errors.existingLocationId && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle size={11} />
              {errors.existingLocationId}
            </p>
          )}
        </div>
      )}

      {/* ── New address — shared enrichment flow ──────────────────────────── */}
      {form.locationMode === "new" && (
        <div className="space-y-3.5">
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
            coordinatesIdleDescription="Allows the provider to verify your location and estimate travel distance."
          />

          {/* Save for later */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Save this address
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                Add to your saved addresses for future use
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.saveNewLocation}
              onClick={() => set("saveNewLocation", !form.saveNewLocation)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                form.saveNewLocation
                  ? "bg-amber-500"
                  : "bg-stone-200 dark:bg-stone-700"
              }`}>
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  form.saveNewLocation ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {form.saveNewLocation && (
            <div className="space-y-2.5">
              <FieldLabel>Address Label</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    LocationLabel.HOME,
                    LocationLabel.WORK,
                    LocationLabel.SCHOOL,
                    LocationLabel.OTHER,
                  ] as LocationLabel[]
                ).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => set("newLocationLabel", lbl)}
                    className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      form.newLocationLabel === lbl
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400"
                    }`}>
                    <span>{labelIcon[lbl]}</span>
                    {labelText[lbl]}
                  </button>
                ))}
              </div>
              {form.newLocationLabel === LocationLabel.OTHER && (
                <input
                  type="text"
                  placeholder="e.g. Mum's House"
                  value={form.newLocationCustomLabel}
                  onChange={(e) =>
                    set("newLocationCustomLabel", e.target.value)
                  }
                  className="w-full h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/40 focus:border-amber-400 transition-all"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inner component (needs Suspense for useSearchParams) ─────────────────────

function ProviderRequestInner() {
  const { id: providerId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const taskId = searchParams.get("taskId") ?? undefined;
  const serviceIdFromQuery = searchParams.get("serviceId") ?? undefined;
  const sourceParam = searchParams.get("source") ?? undefined;
  const isTaskMode = !!taskId;
  const isTaskInterest = isTaskMode && sourceParam === "task_interest";

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );

  // ── Shared location form ──────────────────────────────────────────────────
  const locationForm = useLocationForm();

  // Auto-capture browser GPS on mount so coordinates are ready when submitting
  useEffect(() => {
    locationForm.requestGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: profile, loading: profileLoading } = useProviderProfile(
    providerId ?? null,
    { populate: true },
  );

  const { data: task, loading: taskLoading } = useTaskById(
    isTaskMode ? taskId : null,
  );

  const { data: services, loading: servicesLoading } = useServiceOfferings(
    isTaskMode ? null : (providerId ?? null),
  );

  const { locations, isLoadingLocations, saveAddress } = useClientPreference();

  const { mutate: sendBrowseRequest, loading: browseSubmitting } =
    useCreateServiceBrowseRequest({ onError: (err) => toast.error(err) });

  const { mutate: sendTaskMatchRequest, loading: taskMatchSubmitting } =
    useCreateTaskMatchRequest({ onError: (err) => toast.error(err) });

  const { mutate: sendTaskInterestRequest, loading: taskInterestSubmitting } =
    useCreateTaskInterestRequest({ onError: (err) => toast.error(err) });

  const submitting = browseSubmitting || taskMatchSubmitting || taskInterestSubmitting;
  const isClosed = profile?.status === ProviderStatus.Closed;

  const outOfHoursWarning = useMemo(() => {
    if (!profile || profile.isAlwaysAvailable) return null;
    if (!form.preferredDate || !form.timeStart) return null;
    const DAY_NAMES = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName =
      DAY_NAMES[new Date(form.preferredDate + "T12:00:00").getDay()];
    const hours = profile.workingHours?.[dayName];
    if (!hours)
      return `${profile.businessName ?? "This provider"} is not available on ${dayName}s.`;
    if (form.timeStart < hours.start || form.timeStart > hours.end)
      return `Your selected time (${form.timeStart}) is outside working hours (${hours.start}–${hours.end}) on ${dayName}s.`;
    return null;
  }, [profile, form.preferredDate, form.timeStart]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!profile) return;
    const raw = profile as unknown as Record<string, unknown>;
    const userProfile = raw.profile as Record<string, unknown> | undefined;
    const pic = userProfile?.profilePictureId;
    if (pic && typeof pic === "object" && "url" in (pic as object)) {
      const p = pic as { url: string; thumbnailUrl?: string };
      setProfilePictureUrl(p.thumbnailUrl ?? p.url);
      return;
    }
    const userId = (userProfile?.userId as Record<string, unknown> | undefined)
      ?._id as string | undefined;
    if (!userId) return;
    let cancelled = false;
    profilePictureAPI
      .getPublicRecord(userId)
      .then((file) => {
        if (!cancelled && file?.url)
          setProfilePictureUrl(file.thumbnailUrl ?? file.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Pre-fill location form from task data in task mode
  useEffect(() => {
    if (!isTaskMode || !task?.locationContext) return;
    const ctx = task.locationContext as Record<string, unknown>;
    const nested = ctx?.registeredLocation as
      | Record<string, unknown>
      | undefined;
    const gps = (ctx?.ghanaPostGPS ?? nested?.ghanaPostGPS) as
      | string
      | undefined;
    const landmark = (ctx?.nearbyLandmark ?? nested?.nearbyLandmark) as
      | string
      | undefined;
    if (gps || landmark) {
      locationForm.reset({ ghanaPostGPS: gps ?? "", nearbyLandmark: landmark ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, isTaskMode]);

  // Default to first saved address if available (browse mode only)
  useEffect(() => {
    if (isTaskMode || form.existingLocationId || locations.length === 0) return;
    const defaultLoc = locations.find((l) => l.isDefault) ?? locations[0];
    if (defaultLoc) set("existingLocationId", String(defaultLoc._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, isTaskMode]);

  // Auto-select service from URL param
  useEffect(() => {
    if (!serviceIdFromQuery || isTaskMode) return;
    const active = (services ?? []).filter((s) => s.isActive !== false);
    const match = active.find((s) => String(s._id) === serviceIdFromQuery);
    if (match) set("serviceId", serviceIdFromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdFromQuery, services, isTaskMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const businessName = profile?.businessName ?? "Provider";

  const activeServices: Service[] = (services ?? []).filter(
    (s) => s.isActive !== false,
  );

  const selectedService = form.serviceId
    ? (activeServices.find((s) => String(s._id) === form.serviceId) ?? null)
    : null;

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!isTaskMode && !form.serviceId)
      next.serviceId = "Please select a service.";

    if (!isTaskMode) {
      if (form.locationMode === "existing" && !form.existingLocationId)
        next.existingLocationId = "Please select a saved address.";
      if (form.locationMode === "new" && !locationForm.isValid) {
        toast.error("Please enter a valid Ghana Post GPS address.");
        return false;
      }
    }

    if (!form.priority) next.priority = "Please choose a priority level.";
    if (!form.flexibleDates && !form.preferredDate)
      next.preferredDate = "Choose a preferred date or mark as flexible.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Resolve service location — always includes GPS coordinates when available
    let locationPayload: {
      ghanaPostGPS: string;
      nearbyLandmark?: string;
      gpsCoordinates?: { latitude: number; longitude: number; accuracy?: number };
    };

    if (isTaskMode || form.locationMode === "new") {
      locationPayload = locationForm.toPayload();
    } else {
      const loc = locations.find(
        (l) => String(l._id) === form.existingLocationId,
      );
      locationPayload = {
        ghanaPostGPS: loc?.address?.ghanaPostGPS ?? "",
        nearbyLandmark: loc?.address?.nearbyLandmark || undefined,
        ...(loc?.address?.gpsCoordinates
          ? { gpsCoordinates: loc.address.gpsCoordinates }
          : {}),
      };
    }

    const schedulePayload = {
      priority: form.priority,
      preferredDate: form.flexibleDates
        ? undefined
        : form.preferredDate || undefined,
      flexibleDates: form.flexibleDates,
      timeSlot: form.timeStart
        ? { start: form.timeStart, end: form.timeEnd || undefined }
        : undefined,
    };

    const budgetPayload =
      form.budgetMin || form.budgetMax
        ? {
            min: form.budgetMin ? Number(form.budgetMin) : undefined,
            max: form.budgetMax ? Number(form.budgetMax) : undefined,
            currency: form.currency,
          }
        : undefined;

    const result = isTaskMode
      ? isTaskInterest
        ? await sendTaskInterestRequest({
            source: RequestSource.TASK_INTEREST,
            providerId: providerId!,
            taskId: taskId!,
            serviceLocation: locationPayload,
            schedule: schedulePayload,
            clientMessage: form.clientMessage.trim() || undefined,
            estimatedBudget: budgetPayload,
            discoveryContext: { source: "task_interest" },
          })
        : await sendTaskMatchRequest({
            source: RequestSource.TASK_MATCH,
            providerId: providerId!,
            taskId: taskId!,
            serviceLocation: locationPayload,
            schedule: schedulePayload,
            clientMessage: form.clientMessage.trim() || undefined,
            estimatedBudget: budgetPayload,
            discoveryContext: { source: "task_match" },
          })
      : await sendBrowseRequest({
          source: RequestSource.SERVICE_BROWSE,
          providerId: providerId!,
          serviceId: form.serviceId,
          serviceLocation: locationPayload,
          schedule: schedulePayload,
          clientMessage: form.clientMessage.trim() || undefined,
          estimatedBudget: budgetPayload,
          discoveryContext: {
            source: locationForm.coordinates ? "gps_browse" : "manual",
          },
        });

    if (!result) return;

    // Save enriched location from the response — avoids a second GPS lookup
    if (!isTaskMode && form.locationMode === "new" && form.saveNewLocation) {
      void saveAddress({
        label: form.newLocationLabel,
        customLabel:
          form.newLocationLabel === LocationLabel.OTHER
            ? form.newLocationCustomLabel.trim() || undefined
            : undefined,
        ghanaPostGPS: result.serviceLocation.ghanaPostGPS,
        nearbyLandmark: result.serviceLocation.nearbyLandmark,
        liveCoordinates: result.serviceLocation.gpsCoordinates,
      }).catch(() => {});
    }

    toast.success("Request sent! The provider will respond shortly.");
    router.push(`/requests/${result._id}`);
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (profileLoading || (isTaskMode && taskLoading)) {
    return <LoadingOverlay message="Loading…" show />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Sticky nav ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                  <Home size={12} />
                  <span className="hidden xs:inline">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/providers"
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                  <Users size={12} />
                  <span className="hidden sm:inline">Providers</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/providers/${providerId}`}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors max-w-24 sm:max-w-36 truncate block">
                  {businessName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Request
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors shrink-0 py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <ArrowLeft size={13} /> Back
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
            Request{" "}
            <span className="text-amber-600 dark:text-amber-400">
              {businessName}
            </span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Fill in your service details. The provider will review and respond
            to your request.
          </p>
        </div>

        {/* ── Two-column grid ──────────────────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8 lg:items-start">
          {/* ── Left panel ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-20 space-y-4 mb-6 lg:mb-0">
            {profile && (
              <ProviderHero
                businessName={profile.businessName}
                status={profile.status}
                contactInfo={profile.contactInfo}
                locationData={profile.locationData}
                isAlwaysAvailable={profile.isAlwaysAvailable}
                workingHours={profile.workingHours}
                isAddressVerified={profile.isAddressVerified}
                profilePictureUrl={profilePictureUrl}
              />
            )}

            {isTaskMode ? (
              <TaskContextCard task={task} />
            ) : selectedService ? (
              <SelectedServiceCard service={selectedService} />
            ) : null}
          </div>

          {/* ── Right panel — form ────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {isClosed && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700">
                <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle
                    size={15}
                    className="text-stone-500 dark:text-stone-400"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                    {businessName} is currently closed
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    This provider is not accepting new requests right now.
                    Please check back later or{" "}
                    <Link
                      href="/providers"
                      className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                      browse other providers
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* ── Service selection — browse mode only ─────────────── */}
            {!isTaskMode && (
              <SectionCard icon={<Layers size={14} />} title="Select a Service">
                {servicesLoading ? (
                  <div className="flex items-center gap-2 py-4 text-stone-400 dark:text-stone-500">
                    <Loader2 size={15} className="animate-spin" />
                    <span className="text-sm">Loading services…</span>
                  </div>
                ) : activeServices.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Layers
                        size={18}
                        className="text-stone-300 dark:text-stone-600"
                      />
                    </div>
                    <p className="text-sm text-stone-400 dark:text-stone-500">
                      This provider has no active services.
                    </p>
                    <Link
                      href={`/providers/${providerId}`}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                      Go back to profile <ChevronRight size={11} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeServices.map((s) => (
                      <ServiceOption
                        key={String(s._id)}
                        service={s}
                        selected={form.serviceId === String(s._id)}
                        onSelect={() => set("serviceId", String(s._id))}
                      />
                    ))}
                    {errors.serviceId && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                        <AlertCircle size={11} />
                        {errors.serviceId}
                      </p>
                    )}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Location ─────────────────────────────────────────── */}
            <SectionCard
              icon={<MapPin size={14} />}
              title="Service Location"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400">
              {isTaskMode ? (
                /* Task mode — pre-filled from task, editable, GPS auto-captured */
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
                  coordinatesIdleDescription="Confirms where the service will take place."
                />
              ) : (
                /* Service browse mode — existing saved address or new address */
                <LocationSection
                  form={form}
                  set={set}
                  errors={errors}
                  locations={locations}
                  isLoadingLocations={isLoadingLocations}
                  locationForm={locationForm}
                />
              )}
            </SectionCard>

            {/* ── Schedule ─────────────────────────────────────────── */}
            <SectionCard
              icon={<Calendar size={14} />}
              title="Schedule"
              iconBg="bg-violet-100 dark:bg-violet-900/30"
              iconColor="text-violet-600 dark:text-violet-400">
              <div className="space-y-4">
                {/* Flexible toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Flexible dates
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      I don&apos;t have a specific date in mind
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.flexibleDates}
                    onClick={() => set("flexibleDates", !form.flexibleDates)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                      form.flexibleDates
                        ? "bg-amber-500"
                        : "bg-stone-200 dark:bg-stone-700"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        form.flexibleDates ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Preferred date */}
                {!form.flexibleDates && (
                  <div>
                    <FieldLabel required>Preferred Date</FieldLabel>
                    <input
                      type="date"
                      value={form.preferredDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => set("preferredDate", e.target.value)}
                      className={`w-full h-10 px-3.5 rounded-xl border text-sm bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 outline-none focus:ring-2 transition-all ${
                        errors.preferredDate
                          ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40"
                          : "border-stone-200 dark:border-stone-700 focus:ring-amber-200 dark:focus:ring-amber-900/40 focus:border-amber-400"
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                        <AlertCircle size={11} />
                        {errors.preferredDate}
                      </p>
                    )}
                  </div>
                )}

                {/* Time slot */}
                <div>
                  <FieldLabel>Preferred Time Slot</FieldLabel>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/40 focus-within:border-amber-400 transition-all">
                        <Clock size={12} className="text-stone-400 shrink-0" />
                        <input
                          type="time"
                          value={form.timeStart}
                          onChange={(e) => set("timeStart", e.target.value)}
                          className="flex-1 text-sm bg-transparent text-stone-800 dark:text-stone-100 outline-none"
                        />
                      </div>
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                      to
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/40 focus-within:border-amber-400 transition-all">
                        <Clock size={12} className="text-stone-400 shrink-0" />
                        <input
                          type="time"
                          value={form.timeEnd}
                          onChange={(e) => set("timeEnd", e.target.value)}
                          className="flex-1 text-sm bg-transparent text-stone-800 dark:text-stone-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {outOfHoursWarning && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40">
                    <AlertCircle
                      size={14}
                      className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      {outOfHoursWarning} You can still send the request — the
                      provider may accommodate you.
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── Message ─────────────────────────────────────────── */}
            <SectionCard
              icon={<MessageSquare size={14} />}
              title="Message to Provider"
              iconBg="bg-sky-100 dark:bg-sky-900/30"
              iconColor="text-sky-600 dark:text-sky-400">
              <div>
                <FieldLabel>Your message</FieldLabel>
                <textarea
                  rows={4}
                  placeholder="Describe what you need, any special requirements, or ask questions…"
                  value={form.clientMessage}
                  onChange={(e) => set("clientMessage", e.target.value)}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/40 focus:border-amber-400 transition-all resize-none"
                />
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 text-right">
                  {form.clientMessage.length} / 1000
                </p>
              </div>
            </SectionCard>

            {/* ── Budget ──────────────────────────────────────────── */}
            <SectionCard
              icon={<Wallet size={14} />}
              title="Estimated Budget"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400">
              <div className="space-y-3.5">
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Optional. Helps the provider understand your expectations.
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <FieldLabel>Min</FieldLabel>
                    <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/40 focus-within:border-amber-400 transition-all">
                      <span className="text-xs font-bold text-stone-400 shrink-0">
                        {form.currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.budgetMin}
                        onChange={(e) => set("budgetMin", e.target.value)}
                        className="flex-1 text-sm bg-transparent text-stone-800 dark:text-stone-100 outline-none"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0 mt-5">
                    —
                  </span>
                  <div className="flex-1">
                    <FieldLabel>Max</FieldLabel>
                    <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/40 focus-within:border-amber-400 transition-all">
                      <span className="text-xs font-bold text-stone-400 shrink-0">
                        {form.currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.budgetMax}
                        onChange={(e) => set("budgetMax", e.target.value)}
                        className="flex-1 text-sm bg-transparent text-stone-800 dark:text-stone-100 outline-none"
                      />
                    </div>
                  </div>
                  <div className="shrink-0 mt-5">
                    <select
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                      className="h-10 px-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-bold text-stone-700 dark:text-stone-300 outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/40 focus:border-amber-400 transition-all">
                      <option value="GHS">GHS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Submit ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  (!isTaskMode && activeServices.length === 0) ||
                  isClosed
                }
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white text-sm font-bold shadow-lg shadow-amber-900/20 disabled:shadow-none transition-all active:scale-[0.99]">
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Public export with Suspense (required for useSearchParams) ───────────────

export default function ProviderRequestPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading…" show />}>
      <ProviderRequestInner />
    </Suspense>
  );
}
