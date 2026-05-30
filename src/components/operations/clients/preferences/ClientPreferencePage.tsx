"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  Navigation,
  ShieldCheck,
  Heart,
  Tag,
  ArrowUpRight,
  Folder,
  Users,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  X,
  Calendar,
  DollarSign,
  SlidersHorizontal,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useClientPreference } from "@/hooks/profiles/useClientPreference";
import { LocationLabel } from "@/types/location.types";
import type { Location } from "@/types/location.types";
import type {
  ServiceSummary,
  ProviderSummary,
  CategorySummary,
  FavoriteProviderEntry,
  DayOfWeek,
  TimeSlot,
  ProviderGender,
} from "@/types/clientPreferences.types";
import type {
  SaveAddressBody,
  UpdateAddressBody,
} from "@/lib/api/profile/client.preference.api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResolvedServiceCoverUrl } from "@/hooks/files/useResolvedFileUrl";

import {
  ClientAddressForm,
  EMPTY_FORM,
  LABEL_CONFIG,
} from "./ClientAddressForm";
import type { AddressFormValues } from "./ClientAddressForm";
import ClientProfileTab from "./ClientProfileTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | "profile"
  | "addresses"
  | "services"
  | "providers"
  | "categories"
  | "notifications"
  | "scheduling"
  | "budget"
  | "service"
  | "privacy";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_META: Record<Tab, { title: string; description: string }> = {
  profile: {
    title: "My Profile",
    description: "Update your profile picture and contact information.",
  },
  addresses: {
    title: "Saved Addresses",
    description: "Your default address is pre-filled when posting a task.",
  },
  services: {
    title: "Saved Services",
    description: "Services you liked while browsing.",
  },
  providers: {
    title: "Saved Providers",
    description: "Providers you liked while browsing.",
  },
  categories: {
    title: "Preferred Categories",
    description: "Categories that match your interests.",
  },
  notifications: {
    title: "Notification Preferences",
    description: "Choose how you want to hear from us.",
  },
  scheduling: {
    title: "Scheduling",
    description: "Set your preferred days, time slots, and booking lead time.",
  },
  budget: {
    title: "Budget",
    description: "Set your preferred budget range for bookings.",
  },
  service: {
    title: "Service Settings",
    description: "Preferences for provider distance, gender, and language.",
  },
  privacy: {
    title: "Privacy",
    description: "Control your profile and location visibility.",
  },
};

// ─── Scheduling / Budget / Service constants ──────────────────────────────────

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const TIME_SLOTS: { value: TimeSlot; label: string; desc: string }[] = [
  { value: "morning", label: "Morning", desc: "6 am – 12 pm" },
  { value: "afternoon", label: "Afternoon", desc: "12 pm – 5 pm" },
  { value: "evening", label: "Evening", desc: "5 pm – 9 pm" },
];

const GENDER_OPTIONS: { value: ProviderGender; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

// ─── Normalisation Helpers ────────────────────────────────────────────────────

function normaliseService(raw: unknown): ServiceSummary {
  if (typeof raw === "string") return { _id: raw, name: "Service", isActive: true };
  const s = raw as Record<string, unknown>;
  return {
    _id: String(s._id ?? ""),
    name: String(s.title ?? s.name ?? "Service"),
    slug: (s.slug as string | undefined) ?? undefined,
    description: undefined,
    imageUrl: undefined,
    isActive: (s.isActive as boolean | undefined) ?? true,
  };
}

function normaliseProvider(raw: unknown): ProviderSummary {
  if (typeof raw === "string") return { _id: raw, displayName: "Provider" };
  const p = raw as FavoriteProviderEntry;
  const profilePic = p.profile?.profilePictureId;
  return {
    _id: String(p._id ?? ""),
    displayName: p.businessName ?? "Provider",
    avatarUrl: profilePic?.thumbnailUrl ?? profilePic?.url ?? undefined,
    rating: p.rating,
  };
}

function normaliseCategory(raw: unknown): CategorySummary {
  if (typeof raw === "string") return { _id: raw, name: "Category", slug: "" };
  const c = raw as Record<string, unknown>;
  const cover = c.catCoverId as Record<string, unknown> | null | undefined;
  return {
    _id: String(c._id ?? ""),
    name: String(c.catName ?? c.name ?? "Category"),
    slug: String(c.slug ?? ""),
    iconUrl: (cover?.url as string | undefined) ?? undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelText(loc: Location): string {
  return loc.label === LocationLabel.OTHER && loc.customLabel
    ? loc.customLabel
    : loc.label.charAt(0) + loc.label.slice(1).toLowerCase();
}

function LabelIcon({ label }: { label: LocationLabel }) {
  const cfg = LABEL_CONFIG.find((l) => l.value === label);
  const Icon = cfg?.icon ?? MapPin;
  return <Icon size={13} />;
}

function editInitialValues(loc: Location): AddressFormValues {
  return {
    label: loc.label,
    customLabel: loc.customLabel ?? "",
    ghanaPostGPS: loc.address.ghanaPostGPS,
    nearbyLandmark: loc.address.nearbyLandmark ?? "",
    isDefault: loc.isDefault,
    liveCoords: loc.address.gpsCoordinates
      ? {
          latitude: loc.address.gpsCoordinates.latitude,
          longitude: loc.address.gpsCoordinates.longitude,
        }
      : null,
  };
}

// ─── Sidebar Tab Button ───────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
  compact?: boolean;
}) {
  const badge = count != null && count > 0 && (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        active
          ? "bg-white/25 text-white"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}>
      {count}
    </span>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
          active
            ? "bg-amber-500 text-white"
            : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
        }`}>
        <Icon size={14} className="shrink-0" />
        {label}
        {badge}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
        active
          ? "bg-amber-500 text-white"
          : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
      }`}>
      <Icon size={15} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon size={24} className="text-zinc-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {description}
        </p>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
          {linkLabel}
          <ArrowUpRight size={13} />
        </Link>
      )}
    </div>
  );
}

// ─── Address Row (Desktop Table) ──────────────────────────────────────────────

function AddressRow({
  loc,
  onEdit,
  onDelete,
  onSetDefault,
  onUnsetDefault,
  onReEnrich,
  isSettingDefault,
  isUnsettingDefault,
  isDeleting,
  isReEnriching,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
}: {
  loc: Location;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUnsetDefault: () => void;
  onReEnrich: () => void;
  isSettingDefault: boolean;
  isUnsettingDefault: boolean;
  isDeleting: boolean;
  isReEnriching: boolean;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  const { address } = loc;
  const needsEnrichment = !(
    address.streetName ||
    address.locality ||
    address.city ||
    address.district ||
    address.region
  );

  const addressSummary = [
    address.houseNumber && address.streetName
      ? `${address.houseNumber} ${address.streetName}`
      : address.streetName,
    address.locality,
    address.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <TableRow
        className={
          isConfirmingDelete
            ? "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/10"
            : undefined
        }>
        <TableCell className="pl-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                loc.isDefault
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}>
              <LabelIcon label={loc.label} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold">{labelText(loc)}</span>
                {loc.isDefault && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-xs font-mono text-foreground">
            {address.ghanaPostGPS}
          </p>
          {addressSummary && (
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
              {addressSummary}
            </p>
          )}
          {needsEnrichment && (
            <button
              type="button"
              onClick={onReEnrich}
              disabled={isReEnriching}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 mt-0.5">
              {isReEnriching ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Sparkles size={10} />
              )}
              {isReEnriching ? "Enriching…" : "Enrich"}
            </button>
          )}
        </TableCell>
        <TableCell>
          {address.isAddressVerified ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <ShieldCheck size={9} className="mr-0.5" /> Verified
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </TableCell>
        <TableCell className="pr-4">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={loc.isDefault ? onUnsetDefault : onSetDefault}
              disabled={isSettingDefault || isUnsettingDefault}
              title={loc.isDefault ? "Remove as default" : "Set as default"}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                loc.isDefault
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              }`}>
              {isSettingDefault || isUnsettingDefault ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Star
                  size={14}
                  className={loc.isDefault ? "fill-amber-500" : ""}
                />
              )}
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-7 px-2.5 text-xs gap-1 shrink-0">
              <Pencil size={11} /> Edit
            </Button>
            <button
              type="button"
              onClick={isConfirmingDelete ? onCancelDelete : onRequestDelete}
              title={isConfirmingDelete ? "Cancel" : "Remove address"}
              disabled={isDeleting}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                isConfirmingDelete
                  ? "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}>
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isConfirmingDelete ? (
                <X size={14} />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </TableCell>
      </TableRow>
      {isConfirmingDelete && (
        <TableRow className="bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/40 dark:hover:bg-red-950/10">
          <TableCell colSpan={4} className="py-2 pl-4">
            <div className="flex items-center gap-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                Remove this address?
              </p>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-xs font-semibold text-red-600 dark:text-red-400 underline underline-offset-2 disabled:opacity-50">
                {isDeleting ? "Removing…" : "Yes, remove"}
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Address Card (Mobile) ────────────────────────────────────────────────────

function AddressMobileCard({
  loc,
  onEdit,
  onDelete,
  onSetDefault,
  onUnsetDefault,
  onReEnrich,
  isSettingDefault,
  isUnsettingDefault,
  isDeleting,
  isReEnriching,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
}: {
  loc: Location;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUnsetDefault: () => void;
  onReEnrich: () => void;
  isSettingDefault: boolean;
  isUnsettingDefault: boolean;
  isDeleting: boolean;
  isReEnriching: boolean;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  const { address } = loc;
  const needsEnrichment = !(
    address.streetName ||
    address.locality ||
    address.city ||
    address.district ||
    address.region
  );

  return (
    <div
      className={`rounded-2xl border bg-card p-4 transition-all ${
        isConfirmingDelete
          ? "border-red-200 dark:border-red-800/50"
          : "border-border hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}>
      {/* Top: icon + label + badges */}
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            loc.isDefault
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          }`}>
          <LabelIcon label={loc.label} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{labelText(loc)}</span>
            {loc.isDefault && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Default
              </Badge>
            )}
            {address.isAddressVerified && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <ShieldCheck size={9} className="mr-0.5" /> Verified
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {address.ghanaPostGPS}
          </p>
        </div>
      </div>

      {/* Address detail lines */}
      <div className="mt-2.5 pl-12 space-y-0.5">
        {(address.houseNumber || address.streetName) && (
          <p className="text-xs text-foreground/80">
            {[address.houseNumber, address.streetName]
              .filter(Boolean)
              .join(" ")}
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
        {address.nearbyLandmark && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin size={10} className="shrink-0" /> Near{" "}
            {address.nearbyLandmark}
          </p>
        )}
        {address.gpsCoordinates && (
          <p className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1 pt-0.5">
            <Navigation size={9} />
            {address.gpsCoordinates.latitude.toFixed(5)},{" "}
            {address.gpsCoordinates.longitude.toFixed(5)}
          </p>
        )}
        {needsEnrichment && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <p className="text-xs italic text-muted-foreground/60">
              Address details unavailable
            </p>
            <button
              type="button"
              onClick={onReEnrich}
              disabled={isReEnriching}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50">
              {isReEnriching ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} />
              )}
              {isReEnriching ? "Enriching…" : "Enrich details"}
            </button>
          </div>
        )}
      </div>

      {/* Action bar — always fully visible */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <button
          type="button"
          onClick={loc.isDefault ? onUnsetDefault : onSetDefault}
          disabled={isSettingDefault || isUnsettingDefault}
          title={loc.isDefault ? "Remove as default" : "Set as default"}
          className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
            loc.isDefault
              ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          }`}>
          {isSettingDefault || isUnsettingDefault ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Star
              size={16}
              className={loc.isDefault ? "fill-amber-500" : ""}
            />
          )}
        </button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1 gap-1.5 text-xs">
          <Pencil size={13} /> View & Edit
        </Button>
        <button
          type="button"
          onClick={isConfirmingDelete ? onCancelDelete : onRequestDelete}
          disabled={isDeleting}
          title={isConfirmingDelete ? "Cancel delete" : "Remove address"}
          className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
            isConfirmingDelete
              ? "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          }`}>
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isConfirmingDelete ? (
            <X size={16} />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Delete confirmation */}
      {isConfirmingDelete && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Remove this address?
          </p>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-xs font-semibold text-red-600 dark:text-red-400 underline underline-offset-2 disabled:opacity-50">
            {isDeleting ? "Removing…" : "Yes, remove"}
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Favourite Service Card ───────────────────────────────────────────────────

function accentFromName(name: string): string {
  const palette = [
    "from-amber-400 to-orange-500",
    "from-sky-400 to-blue-500",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-rose-400 to-pink-500",
    "from-cyan-400 to-sky-500",
    "from-lime-400 to-green-500",
    "from-fuchsia-400 to-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export function ServiceFavoriteCard({
  service,
  onRemove,
  removing,
}: {
  service: ServiceSummary;
  onRemove: () => void;
  removing: boolean;
}) {
  const { url: resolvedUrl, loading: resolving } = useResolvedServiceCoverUrl(
    service.imageUrl ? null : service._id,
  );

  const displayUrl = service.imageUrl ?? resolvedUrl;
  const initial = service.name.trim()[0]?.toUpperCase() ?? "S";
  const gradient = accentFromName(service.name);
  const href = `/services/${service.slug ?? service._id}`;

  return (
    <Link
      href={href}
      className="group relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700/60 transition-all active:scale-[0.99]">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={service.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-linear-to-br ${gradient} flex items-center justify-center`}>
            {resolving ? (
              <Loader2 size={14} className="text-white/80 animate-spin" />
            ) : (
              <span className="text-white text-lg font-black leading-none">
                {initial}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {service.name}
        </p>
        {service.slug && (
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
            /{service.slug}
          </p>
        )}
        {!service.isActive && (
          <Badge
            variant="secondary"
            className="mt-1 text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Inactive
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        disabled={removing}
        title="Remove from saved"
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
        {removing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </Link>
  );
}

// ─── Favourite Provider Card ──────────────────────────────────────────────────

function ProviderFavoriteCard({
  provider,
  onRemove,
  removing,
}: {
  provider: ProviderSummary;
  onRemove: () => void;
  removing: boolean;
}) {
  function initials(name: string) {
    const words = name.trim().split(/\s+/);
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  return (
    <Link
      href={`/providers/${provider._id}`}
      className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700/60 transition-all active:scale-[0.99]">
      <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden">
        {provider.avatarUrl ? (
          <Image
            src={provider.avatarUrl}
            alt={provider.displayName}
            fill
            className="object-cover"
          />
        ) : (
          <span>{initials(provider.displayName)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {provider.displayName}
        </p>
        {provider.rating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} fill="currentColor" className="text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {provider.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        disabled={removing}
        title="Remove from saved"
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
        {removing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </Link>
  );
}

// ─── Preferred Category Card ──────────────────────────────────────────────────

function CategoryFavoriteCard({
  category,
  onRemove,
  removing,
}: {
  category: CategorySummary;
  onRemove: () => void;
  removing: boolean;
}) {
  const href = category.slug
    ? `/categories/${category.slug}`
    : `/categories`;

  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700/60 transition-all active:scale-[0.99]">
      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
        {category.iconUrl ? (
          <Image
            src={category.iconUrl}
            alt={category.name}
            fill
            className="object-cover"
          />
        ) : (
          <Folder size={18} className="text-zinc-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {category.name}
        </p>
        {category.slug && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            /{category.slug}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        disabled={removing}
        title="Remove from saved"
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
        {removing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </Link>
  );
}

// ─── Communication Toggle Row ─────────────────────────────────────────────────

function CommToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700"
        }`}>
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientPreferencePage() {
  const {
    preference,
    isLoading: prefLoading,
    isSaving,
    locations: rawLocations,
    isLoadingLocations,
    isSavingLocation,
    saveAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    unsetDefaultAddress,
    refreshLocations,
    updateCommunication,
    updateScheduling,
    updateBudget,
    updateService,
    updatePrivacy,
    removeFavoriteService,
    removeFavoriteProvider,
    removeFavoriteCategory,
  } = useClientPreference(true);

  const locations = Array.isArray(rawLocations) ? rawLocations : [];

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // ── Address dialogs ───────────────────────────────────────────────────────
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogError, setAddDialogError] = useState<string | null>(null);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [deletingConfirmId, setDeletingConfirmId] = useState<string | null>(null);

  // ── Removing favorites ────────────────────────────────────────────────────
  const [removingServiceId, setRemovingServiceId] = useState<string | null>(null);
  const [removingProviderId, setRemovingProviderId] = useState<string | null>(null);
  const [removingCategoryId, setRemovingCategoryId] = useState<string | null>(null);

  // ── Deleting / setting / unsetting default address ───────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [unsettingDefaultId, setUnsettingDefaultId] = useState<string | null>(null);
  const [reEnrichingId, setReEnrichingId] = useState<string | null>(null);

  // ── Communication preferences ─────────────────────────────────────────────
  const commSettings = useMemo(
    () =>
      preference?.communicationPreferences ?? {
        emailNotifications: false,
        smsNotifications: false,
        pushNotifications: false,
      },
    [preference?.communicationPreferences],
  );

  const handleToggleComm = useCallback(
    async (key: keyof typeof commSettings) => {
      const next = { ...commSettings, [key]: !commSettings[key] };
      await updateCommunication(next);
      toast.success("Notification preference saved.");
    },
    [commSettings, updateCommunication],
  );

  // ── Scheduling form state ─────────────────────────────────────────────────
  const [schedDays, setSchedDays] = useState<DayOfWeek[]>([]);
  const [schedSlots, setSchedSlots] = useState<TimeSlot[]>([]);
  const [leadTime, setLeadTime] = useState<string>("");

  // ── Budget form state ─────────────────────────────────────────────────────
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [budgetCurrency, setBudgetCurrency] = useState<string>("GHS");

  // ── Service form state ────────────────────────────────────────────────────
  const [maxDistance, setMaxDistance] = useState<string>("");
  const [providerGender, setProviderGender] = useState<ProviderGender>("any");
  const [providerLanguage, setProviderLanguage] = useState<string>("");

  // ── Init form state from preference once ─────────────────────────────────
  const prefsInitRef = useRef(false);
  useEffect(() => {
    if (!preference || prefsInitRef.current) return;
    prefsInitRef.current = true;
    const s = preference.schedulingPreferences;
    if (s) {
      setSchedDays(s.preferredDays ?? []);
      setSchedSlots(s.preferredTimeSlots ?? []);
      if (s.advanceBookingLeadTime != null)
        setLeadTime(String(s.advanceBookingLeadTime));
    }
    const b = preference.budgetPreferences;
    if (b) {
      if (b.min != null) setBudgetMin(String(b.min));
      if (b.max != null) setBudgetMax(String(b.max));
      if (b.currency) setBudgetCurrency(b.currency);
    }
    const sv = preference.servicePreferences;
    if (sv) {
      if (sv.maxProviderDistance != null)
        setMaxDistance(String(sv.maxProviderDistance));
      if (sv.preferredProviderGender) setProviderGender(sv.preferredProviderGender);
      if (sv.preferredLanguage) setProviderLanguage(sv.preferredLanguage);
    }
  }, [preference]);

  // ── Privacy settings ──────────────────────────────────────────────────────
  const privacySettings = useMemo(
    () =>
      preference?.privacyPreferences ?? {
        profileVisibility: "public" as const,
        shareLocationWithProviders: true,
      },
    [preference?.privacyPreferences],
  );

  const handleTogglePrivacy = useCallback(
    async (key: "profileVisibility" | "shareLocationWithProviders") => {
      const current = privacySettings;
      const next =
        key === "profileVisibility"
          ? {
              ...current,
              profileVisibility:
                current.profileVisibility === "public" ? "private" as const : "public" as const,
            }
          : {
              ...current,
              shareLocationWithProviders: !current.shareLocationWithProviders,
            };
      await updatePrivacy(next);
      toast.success("Privacy preference saved.");
    },
    [privacySettings, updatePrivacy],
  );

  // ── Scheduling handlers ───────────────────────────────────────────────────
  const handleToggleDay = useCallback((day: DayOfWeek) => {
    setSchedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, []);

  const handleToggleSlot = useCallback((slot: TimeSlot) => {
    setSchedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }, []);

  const handleSaveScheduling = useCallback(async () => {
    await updateScheduling({
      preferredDays: schedDays,
      preferredTimeSlots: schedSlots,
      advanceBookingLeadTime: leadTime !== "" ? Number(leadTime) : undefined,
    });
    toast.success("Scheduling preferences saved.");
  }, [updateScheduling, schedDays, schedSlots, leadTime]);

  // ── Budget handlers ───────────────────────────────────────────────────────
  const handleSaveBudget = useCallback(async () => {
    const min = budgetMin !== "" ? Number(budgetMin) : undefined;
    const max = budgetMax !== "" ? Number(budgetMax) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      toast.error("Min budget cannot exceed max.");
      return;
    }
    await updateBudget({
      min,
      max,
      currency: budgetCurrency || undefined,
    });
    toast.success("Budget preferences saved.");
  }, [updateBudget, budgetMin, budgetMax, budgetCurrency]);

  // ── Service settings handlers ─────────────────────────────────────────────
  const handleSaveService = useCallback(async () => {
    await updateService({
      maxProviderDistance: maxDistance !== "" ? Number(maxDistance) : undefined,
      preferredProviderGender: providerGender,
      preferredLanguage: providerLanguage || undefined,
    });
    toast.success("Service preferences saved.");
  }, [updateService, maxDistance, providerGender, providerLanguage]);

  // ── Normalise favorites ────────────────────────────────────────────────────
  const favoriteServices: ServiceSummary[] = (
    preference?.favoriteServices ?? []
  ).map(normaliseService);

  const favoriteProviders: ProviderSummary[] = (
    preference?.favoriteProviders ?? []
  ).map(normaliseProvider);

  const preferredCategories: CategorySummary[] = (
    preference?.preferredCategories ?? []
  ).map(normaliseCategory);

  // ── Address handlers ──────────────────────────────────────────────────────
  const handleAdd = useCallback(
    async (values: AddressFormValues) => {
      setAddDialogError(null);
      const body: SaveAddressBody = {
        label: values.label,
        ...(values.label === LocationLabel.OTHER &&
          values.customLabel && { customLabel: values.customLabel }),
        ghanaPostGPS: values.ghanaPostGPS.trim(),
        ...(values.nearbyLandmark.trim() && {
          nearbyLandmark: values.nearbyLandmark.trim(),
        }),
        ...(values.liveCoords && { liveCoordinates: values.liveCoords }),
        isDefault: values.isDefault,
      };
      const result = await saveAddress(body);
      if (result) {
        toast.success("Address saved.");
        setAddDialogOpen(false);
        refreshLocations();
      } else {
        setAddDialogError("Failed to save address. Please try again.");
      }
    },
    [saveAddress, refreshLocations],
  );

  const handleUpdate = useCallback(
    async (loc: Location, values: AddressFormValues): Promise<boolean> => {
      const id = loc._id.toString();
      const body: UpdateAddressBody = {
        label: values.label,
        ...(values.label === LocationLabel.OTHER && {
          customLabel: values.customLabel,
        }),
        ghanaPostGPS: values.ghanaPostGPS.trim(),
        ...(values.nearbyLandmark.trim() && {
          nearbyLandmark: values.nearbyLandmark.trim(),
        }),
        ...(values.liveCoords && { liveCoordinates: values.liveCoords }),
        isDefault: values.isDefault,
      };
      const result = await updateAddress(id, body);
      if (result) {
        toast.success("Address updated.");
        refreshLocations();
        return true;
      }
      return false;
    },
    [updateAddress, refreshLocations],
  );

  const handleDelete = useCallback(
    async (locationId: string) => {
      setDeletingId(locationId);
      setDeletingConfirmId(null);
      try {
        await removeAddress(locationId);
        toast.success("Address removed.");
      } catch {
        toast.error("Failed to remove address. Please try again.");
      } finally {
        setDeletingId(null);
      }
    },
    [removeAddress],
  );

  const handleSetDefault = useCallback(
    async (locationId: string) => {
      setSettingDefaultId(locationId);
      try {
        await setDefaultAddress(locationId);
        toast.success("Default address updated.");
      } catch {
        toast.error("Failed to update default. Please try again.");
      } finally {
        setSettingDefaultId(null);
      }
    },
    [setDefaultAddress],
  );

  const handleUnsetDefault = useCallback(
    async (locationId: string) => {
      setUnsettingDefaultId(locationId);
      try {
        await unsetDefaultAddress(locationId);
        toast.success("Default address cleared.");
      } catch {
        toast.error("Failed to clear default. Please try again.");
      } finally {
        setUnsettingDefaultId(null);
      }
    },
    [unsetDefaultAddress],
  );

  // Re-run server-side OSM enrichment for an address that was saved without it
  // (e.g. older records, or those persisted via the task-posting flow).
  const handleReEnrich = useCallback(
    async (loc: Location) => {
      const id = loc._id.toString();
      setReEnrichingId(id);
      const result = await updateAddress(id, {
        ghanaPostGPS: loc.address.ghanaPostGPS,
      });
      if (result) {
        toast.success("Address details enriched.");
        refreshLocations();
      } else {
        toast.error("Couldn't enrich this address. Please try again.");
      }
      setReEnrichingId(null);
    },
    [updateAddress, refreshLocations],
  );

  const handleEditSubmit = useCallback(
    async (values: AddressFormValues) => {
      if (!editingLoc) return;
      setEditDialogError(null);
      const ok = await handleUpdate(editingLoc, values);
      if (ok) {
        setEditingLoc(null);
      } else {
        setEditDialogError("Failed to update address. Please try again.");
      }
    },
    [editingLoc, handleUpdate],
  );

  // ── Favorites handlers ────────────────────────────────────────────────────
  const handleRemoveService = useCallback(
    async (id: string) => {
      setRemovingServiceId(id);
      try {
        const ok = await removeFavoriteService(id);
        if (ok) toast.success("Removed from saved services.");
        else toast.error("Failed to remove service.");
      } catch {
        toast.error("Failed to remove service.");
      } finally {
        setRemovingServiceId(null);
      }
    },
    [removeFavoriteService],
  );

  const handleRemoveProvider = useCallback(
    async (id: string) => {
      setRemovingProviderId(id);
      try {
        const ok = await removeFavoriteProvider(id);
        if (ok) toast.success("Removed from saved providers.");
        else toast.error("Failed to remove provider.");
      } catch {
        toast.error("Failed to remove provider.");
      } finally {
        setRemovingProviderId(null);
      }
    },
    [removeFavoriteProvider],
  );

  const handleRemoveCategory = useCallback(
    async (id: string) => {
      setRemovingCategoryId(id);
      try {
        const ok = await removeFavoriteCategory(id);
        if (ok) toast.success("Removed from saved categories.");
        else toast.error("Failed to remove category.");
      } catch {
        toast.error("Failed to remove category.");
      } finally {
        setRemovingCategoryId(null);
      }
    },
    [removeFavoriteCategory],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* ── Sticky full-width page header ─────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Preferences
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your saved addresses and favorites.
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 lg:py-8">
          {/* Mobile horizontal tab strip */}
          <div className="flex lg:hidden gap-1 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-none">
            <TabButton compact active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profile" />
            <TabButton compact active={activeTab === "addresses"} onClick={() => setActiveTab("addresses")} icon={MapPin} label="Addresses" count={locations.length} />
            <TabButton compact active={activeTab === "services"} onClick={() => setActiveTab("services")} icon={Tag} label="Services" count={favoriteServices.length} />
            <TabButton compact active={activeTab === "providers"} onClick={() => setActiveTab("providers")} icon={Users} label="Providers" count={favoriteProviders.length} />
            <TabButton compact active={activeTab === "categories"} onClick={() => setActiveTab("categories")} icon={Folder} label="Categories" count={preferredCategories.length} />
            <TabButton compact active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={Bell} label="Notifications" />
            <TabButton compact active={activeTab === "scheduling"} onClick={() => setActiveTab("scheduling")} icon={Calendar} label="Scheduling" />
            <TabButton compact active={activeTab === "budget"} onClick={() => setActiveTab("budget")} icon={DollarSign} label="Budget" />
            <TabButton compact active={activeTab === "service"} onClick={() => setActiveTab("service")} icon={SlidersHorizontal} label="Service" />
            <TabButton compact active={activeTab === "privacy"} onClick={() => setActiveTab("privacy")} icon={Lock} label="Privacy" />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-52 shrink-0 bg-white dark:bg-zinc-900 rounded-2xl border border-border p-2 sticky top-4">
              <nav className="flex flex-col gap-0.5">
                <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profile" />
                <TabButton active={activeTab === "addresses"} onClick={() => setActiveTab("addresses")} icon={MapPin} label="Addresses" count={locations.length} />
                <TabButton active={activeTab === "services"} onClick={() => setActiveTab("services")} icon={Tag} label="Services" count={favoriteServices.length} />
                <TabButton active={activeTab === "providers"} onClick={() => setActiveTab("providers")} icon={Users} label="Providers" count={favoriteProviders.length} />
                <TabButton active={activeTab === "categories"} onClick={() => setActiveTab("categories")} icon={Folder} label="Categories" count={preferredCategories.length} />
                <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={Bell} label="Notifications" />
                <TabButton active={activeTab === "scheduling"} onClick={() => setActiveTab("scheduling")} icon={Calendar} label="Scheduling" />
                <TabButton active={activeTab === "budget"} onClick={() => setActiveTab("budget")} icon={DollarSign} label="Budget" />
                <TabButton active={activeTab === "service"} onClick={() => setActiveTab("service")} icon={SlidersHorizontal} label="Service" />
                <TabButton active={activeTab === "privacy"} onClick={() => setActiveTab("privacy")} icon={Lock} label="Privacy" />
              </nav>
            </aside>

            {/* Right content panel */}
            <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden">
              {/* Panel header */}
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <p className="text-base font-semibold text-foreground">
                  {TAB_META[activeTab].title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TAB_META[activeTab].description}
                </p>
              </div>
              <Separator />

              {/* Panel content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6">

                {/* ══ Profile ═════════════════════════════════════════════════ */}
                {activeTab === "profile" && <ClientProfileTab />}

                {/* ══ Addresses ══════════════════════════════════════════════ */}
                {activeTab === "addresses" && (
                  <div className="space-y-4">
                    {/* Toolbar: count + add button */}
                    {!isLoadingLocations && (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          {locations.length === 0
                            ? "No saved addresses yet."
                            : `${locations.length} address${locations.length !== 1 ? "es" : ""} saved`}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs shrink-0"
                          onClick={() => setAddDialogOpen(true)}>
                          <Plus size={13} /> Add address
                        </Button>
                      </div>
                    )}

                    {isLoadingLocations && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading addresses…
                      </div>
                    )}

                    {!isLoadingLocations && locations.length === 0 && (
                      <EmptyState
                        icon={MapPin}
                        title="No saved addresses"
                        description="Save an address to speed up task posting."
                      />
                    )}

                    {!isLoadingLocations && locations.length > 0 && (
                      <>
                        {/* Desktop table (md+) */}
                        <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                                <TableHead className="pl-4">Label</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {locations.map((loc) => {
                                const id = loc._id.toString();
                                return (
                                  <AddressRow
                                    key={id}
                                    loc={loc}
                                    onEdit={() => setEditingLoc(loc)}
                                    onDelete={() => handleDelete(id)}
                                    onSetDefault={() => handleSetDefault(id)}
                                    onUnsetDefault={() => handleUnsetDefault(id)}
                                    onReEnrich={() => handleReEnrich(loc)}
                                    isSettingDefault={settingDefaultId === id}
                                    isUnsettingDefault={unsettingDefaultId === id}
                                    isDeleting={deletingId === id}
                                    isReEnriching={reEnrichingId === id}
                                    isConfirmingDelete={deletingConfirmId === id}
                                    onRequestDelete={() => setDeletingConfirmId(id)}
                                    onCancelDelete={() => setDeletingConfirmId(null)}
                                  />
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile card list */}
                        <div className="md:hidden space-y-3">
                          {locations.map((loc) => {
                            const id = loc._id.toString();
                            return (
                              <AddressMobileCard
                                key={id}
                                loc={loc}
                                onEdit={() => setEditingLoc(loc)}
                                onDelete={() => handleDelete(id)}
                                onSetDefault={() => handleSetDefault(id)}
                                onUnsetDefault={() => handleUnsetDefault(id)}
                                onReEnrich={() => handleReEnrich(loc)}
                                isSettingDefault={settingDefaultId === id}
                                isUnsettingDefault={unsettingDefaultId === id}
                                isDeleting={deletingId === id}
                                isReEnriching={reEnrichingId === id}
                                isConfirmingDelete={deletingConfirmId === id}
                                onRequestDelete={() => setDeletingConfirmId(id)}
                                onCancelDelete={() => setDeletingConfirmId(null)}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Edit address dialog */}
                    <Dialog
                      open={!!editingLoc}
                      onOpenChange={(o) => {
                        if (!o) {
                          setEditingLoc(null);
                          setEditDialogError(null);
                        }
                      }}>
                      <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit address</DialogTitle>
                        </DialogHeader>
                        {editingLoc && (
                          <ClientAddressForm
                            initial={editInitialValues(editingLoc)}
                            readonlyAddress={editingLoc.address}
                            saving={isSavingLocation}
                            serverError={editDialogError}
                            onSubmit={handleEditSubmit}
                            onCancel={() => {
                              setEditingLoc(null);
                              setEditDialogError(null);
                            }}
                            submitLabel="Save changes"
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Add address dialog */}
                    <Dialog
                      open={addDialogOpen}
                      onOpenChange={(o) => {
                        setAddDialogOpen(o);
                        if (!o) setAddDialogError(null);
                      }}>
                      <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>New address</DialogTitle>
                        </DialogHeader>
                        <ClientAddressForm
                          initial={{ ...EMPTY_FORM, isDefault: locations.length === 0 }}
                          saving={isSavingLocation}
                          serverError={addDialogError}
                          onSubmit={handleAdd}
                          onCancel={() => setAddDialogOpen(false)}
                          submitLabel="Save address"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* ══ Saved Services ══════════════════════════════════════════ */}
                {activeTab === "services" && (
                  <div className="space-y-4">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && favoriteServices.length === 0 && (
                      <EmptyState
                        icon={Heart}
                        title="No saved services"
                        description="Like a service while browsing to save it here."
                        href="/services"
                        linkLabel="Browse services"
                      />
                    )}
                    {!prefLoading && favoriteServices.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {favoriteServices.map((svc) => (
                          <ServiceFavoriteCard
                            key={svc._id}
                            service={svc}
                            onRemove={() => handleRemoveService(svc._id)}
                            removing={removingServiceId === svc._id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ Saved Providers ═════════════════════════════════════════ */}
                {activeTab === "providers" && (
                  <div className="space-y-4">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && favoriteProviders.length === 0 && (
                      <EmptyState
                        icon={Heart}
                        title="No saved providers"
                        description="Like a provider while browsing to save them here."
                        href="/providers"
                        linkLabel="Browse providers"
                      />
                    )}
                    {!prefLoading && favoriteProviders.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {favoriteProviders.map((prov) => (
                          <ProviderFavoriteCard
                            key={prov._id}
                            provider={prov}
                            onRemove={() => handleRemoveProvider(prov._id)}
                            removing={removingProviderId === prov._id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ Preferred Categories ════════════════════════════════════ */}
                {activeTab === "categories" && (
                  <div className="space-y-4">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && preferredCategories.length === 0 && (
                      <EmptyState
                        icon={Heart}
                        title="No preferred categories"
                        description="Like a category while browsing to save it here."
                        href="/categories"
                        linkLabel="Browse categories"
                      />
                    )}
                    {!prefLoading && preferredCategories.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {preferredCategories.map((cat) => (
                          <CategoryFavoriteCard
                            key={cat._id}
                            category={cat}
                            onRemove={() => handleRemoveCategory(cat._id)}
                            removing={removingCategoryId === cat._id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ Notifications ═══════════════════════════════════════════ */}
                {activeTab === "notifications" && (
                  <div className="space-y-4">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && (
                      <div className="space-y-3">
                        <CommToggleRow
                          icon={Mail}
                          title="Email notifications"
                          description="Get updates and confirmations sent to your inbox."
                          checked={commSettings.emailNotifications}
                          onChange={() => handleToggleComm("emailNotifications")}
                          disabled={isSaving}
                        />
                        <CommToggleRow
                          icon={MessageSquare}
                          title="SMS notifications"
                          description="Receive text messages about your tasks."
                          checked={commSettings.smsNotifications}
                          onChange={() => handleToggleComm("smsNotifications")}
                          disabled={isSaving}
                        />
                        <CommToggleRow
                          icon={Smartphone}
                          title="Push notifications"
                          description="In-app and browser alerts for real-time updates."
                          checked={commSettings.pushNotifications}
                          onChange={() => handleToggleComm("pushNotifications")}
                          disabled={isSaving}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ══ Scheduling ══════════════════════════════════════════════ */}
                {activeTab === "scheduling" && (
                  <div className="space-y-6">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && (
                      <>
                        {/* Preferred Days */}
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Preferred Days</p>
                          <p className="text-xs text-muted-foreground mb-3">Days you typically want tasks performed.</p>
                          <div className="flex flex-wrap gap-2">
                            {DAYS.map((d) => (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() => handleToggleDay(d.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                  schedDays.includes(d.value)
                                    ? "bg-amber-500 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}>
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preferred Time Slots */}
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Preferred Time Slots</p>
                          <p className="text-xs text-muted-foreground mb-3">Times of day that work best for you.</p>
                          <div className="flex flex-wrap gap-2">
                            {TIME_SLOTS.map((s) => (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => handleToggleSlot(s.value)}
                                className={`flex flex-col items-start px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                                  schedSlots.includes(s.value)
                                    ? "bg-amber-500 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}>
                                <span>{s.label}</span>
                                <span className={`text-[10px] font-normal mt-0.5 ${schedSlots.includes(s.value) ? "text-white/75" : "text-muted-foreground/70"}`}>{s.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Advance booking lead time */}
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">
                            Advance Booking Lead Time
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">Minimum hours notice you want before a booking.</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={leadTime}
                              onChange={(e) => setLeadTime(e.target.value)}
                              placeholder="0"
                              className="w-24 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <span className="text-sm text-muted-foreground">hours</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={handleSaveScheduling}
                          className="bg-amber-500 hover:bg-amber-600 text-white">
                          {isSaving ? (
                            <><Loader2 size={13} className="animate-spin mr-1.5" /> Saving…</>
                          ) : (
                            "Save scheduling"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* ══ Budget ══════════════════════════════════════════════════ */}
                {activeTab === "budget" && (
                  <div className="space-y-5">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Min Budget</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={budgetMin}
                                onChange={(e) => setBudgetMin(e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                              <span className="text-sm text-muted-foreground font-mono">{budgetCurrency}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Max Budget</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={budgetMax}
                                onChange={(e) => setBudgetMax(e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                              <span className="text-sm text-muted-foreground font-mono">{budgetCurrency}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Currency</label>
                          <input
                            type="text"
                            maxLength={3}
                            value={budgetCurrency}
                            onChange={(e) => setBudgetCurrency(e.target.value.toUpperCase())}
                            placeholder="GHS"
                            className="w-24 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono uppercase"
                          />
                          <p className="text-xs text-muted-foreground mt-1">3-letter currency code, e.g. GHS, USD.</p>
                        </div>

                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={handleSaveBudget}
                          className="bg-amber-500 hover:bg-amber-600 text-white">
                          {isSaving ? (
                            <><Loader2 size={13} className="animate-spin mr-1.5" /> Saving…</>
                          ) : (
                            "Save budget"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* ══ Service Settings ════════════════════════════════════════ */}
                {activeTab === "service" && (
                  <div className="space-y-5">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Max Provider Distance</label>
                          <p className="text-xs text-muted-foreground mb-2">Only show providers within this radius.</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={maxDistance}
                              onChange={(e) => setMaxDistance(e.target.value)}
                              placeholder="Any"
                              className="w-28 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <span className="text-sm text-muted-foreground">km</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Preferred Provider Gender</p>
                          <div className="flex gap-2">
                            {GENDER_OPTIONS.map((g) => (
                              <button
                                key={g.value}
                                type="button"
                                onClick={() => setProviderGender(g.value)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                  providerGender === g.value
                                    ? "bg-amber-500 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}>
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Preferred Language</label>
                          <p className="text-xs text-muted-foreground mb-2">Language you prefer providers to communicate in.</p>
                          <input
                            type="text"
                            value={providerLanguage}
                            onChange={(e) => setProviderLanguage(e.target.value)}
                            placeholder="e.g. English"
                            className="w-48 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={handleSaveService}
                          className="bg-amber-500 hover:bg-amber-600 text-white">
                          {isSaving ? (
                            <><Loader2 size={13} className="animate-spin mr-1.5" /> Saving…</>
                          ) : (
                            "Save service settings"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* ══ Privacy ═════════════════════════════════════════════════ */}
                {activeTab === "privacy" && (
                  <div className="space-y-3">
                    {prefLoading && (
                      <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                      </div>
                    )}
                    {!prefLoading && (
                      <>
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              {privacySettings.profileVisibility === "public" ? (
                                <Eye size={16} className="text-zinc-500 dark:text-zinc-400" />
                              ) : (
                                <EyeOff size={16} className="text-zinc-500 dark:text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Profile Visibility</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {privacySettings.profileVisibility === "public"
                                  ? "Your profile is visible to providers."
                                  : "Your profile is hidden from providers."}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={privacySettings.profileVisibility === "public"}
                            disabled={isSaving}
                            onClick={() => handleTogglePrivacy("profileVisibility")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                              privacySettings.profileVisibility === "public"
                                ? "bg-amber-500"
                                : "bg-zinc-200 dark:bg-zinc-700"
                            }`}>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                                privacySettings.profileVisibility === "public"
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <MapPin size={16} className="text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Share Location with Providers</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Allow providers to see your general area when matching tasks.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={privacySettings.shareLocationWithProviders}
                            disabled={isSaving}
                            onClick={() => handleTogglePrivacy("shareLocationWithProviders")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                              privacySettings.shareLocationWithProviders
                                ? "bg-amber-500"
                                : "bg-zinc-200 dark:bg-zinc-700"
                            }`}>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                                privacySettings.shareLocationWithProviders
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
