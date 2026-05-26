import { BaseEntity, SoftDeletable } from "./base.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum LocationLabel {
  HOME = "HOME",
  WORK = "WORK",
  SCHOOL = "SCHOOL",
  OTHER = "OTHER",
}

export enum LocationSourceProvider {
  OPENSTREETMAP = "openstreetmap",
  GOOGLE = "google",
  GHANAPOST = "ghanapost",
}

// ─── Static Address ───────────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  ghanaPostGPS: string;
  nearbyLandmark?: string;
  region?: string;
  city?: string;
  district?: string;
  locality?: string;
  streetName?: string;
  houseNumber?: string;
  gpsCoordinates?: Coordinates;
  isAddressVerified?: boolean;
  sourceProvider?: LocationSourceProvider;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Live GPS Capture ─────────────────────────────────────────────────────────

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

// ─── Task Location Context ────────────────────────────────────────────────────

export interface TaskLocationContext {
  registeredLocation: UserLocation;
  gpsLocationAtPosting?: GPSLocation;
  activeRadiusKm?: number;
}

// ─── Service Browse Context ───────────────────────────────────────────────────

export interface BrowseLocationContext {
  gpsLocation: GPSLocation;
  initialRadiusKm: number;
  expandedRadiusKm?: number;
  isExpanded: boolean;
}

// ─── Location Entity ──────────────────────────────────────────────────────────

export interface Location extends BaseEntity, SoftDeletable {
  clientId: string;
  label: LocationLabel;
  customLabel?: string;
  address: UserLocation;
  isDefault: boolean;
  lastUsedAt?: string;
}

// ─── API Request Bodies ───────────────────────────────────────────────────────

export interface CreateLocationBody {
  label: LocationLabel;
  customLabel?: string;
  address: UserLocation;
  isDefault?: boolean;
}

export interface UpdateLocationBody {
  label?: LocationLabel;
  customLabel?: string;
  address?: Partial<UserLocation>;
  isDefault?: boolean;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface LocationResponse {
  success: boolean;
  message: string;
  location?: Location;
  error?: string;
}

export interface LocationListResponse {
  success: boolean;
  message: string;
  locations?: Location[];
  error?: string;
}
