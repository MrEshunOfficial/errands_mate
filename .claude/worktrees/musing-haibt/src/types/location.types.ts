// types/location.types.ts
import { Types, Model, HydratedDocument } from "mongoose";
import { BaseEntity, SoftDeletable } from "./base.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Well-known labels a client can assign to a saved location.
 * OTHER allows free-text naming via the `customLabel` field.
 */
export enum LocationLabel {
  HOME = "HOME",
  WORK = "WORK",
  SCHOOL = "SCHOOL",
  OTHER = "OTHER",
}

/**
 * Address resolution providers supported by the platform.
 */
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
  ghanaPostGPS: string; // e.g. "GA-123-4567"
  nearbyLandmark?: string;
  // Auto-filled / verified
  region?: string;
  city?: string;
  district?: string;
  locality?: string;
  streetName?: string;
  houseNumber?: string;
  gpsCoordinates?: Coordinates;
  isAddressVerified?: boolean;
  // Widened from "openstreetmap" only — all three providers are now supported
  sourceProvider?: LocationSourceProvider;
  // Optional: present when UserLocation is used standalone outside of Location
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Live GPS Capture ─────────────────────────────────────────────────────────

// Distinct from UserLocation — this is a momentary GPS fix, not a saved address
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // metres — used to judge reliability before matching
  capturedAt: Date;
}

// ─── Task Location Context ────────────────────────────────────────────────────

// Task matching evaluates BOTH location sources; nearest radius wins
export interface TaskLocationContext {
  registeredLocation: UserLocation; // from ClientProfile default address
  gpsLocationAtPosting?: GPSLocation; // live GPS when the task was created
  activeRadiusKm?: number; // resolved and stored by the matching engine
}

// ─── Service Browse Context ───────────────────────────────────────────────────

export interface BrowseLocationContext {
  gpsLocation: GPSLocation;
  initialRadiusKm: number; // e.g. 20
  expandedRadiusKm?: number; // set after client hits "load more"
  isExpanded: boolean;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Location extends BaseEntity, SoftDeletable {
  /** The client who owns this location. */
  clientId: Types.ObjectId;

  /** Display label for the location (e.g. HOME, WORK). */
  label: LocationLabel;

  /**
   * Free-text name used when label is OTHER.
   * e.g. "Mum's House", "Kantamanto Market"
   */
  customLabel?: string;

  /**
   * Full address details. Reuses UserLocation directly —
   * createdAt/updatedAt are omitted at the schema level since
   * Location carries its own Mongoose timestamps.
   */
  address: UserLocation;

  /**
   * When true this location is pre-selected on the task creation form.
   * Only one Location per client may be default at a time —
   * enforced by the setAsDefault instance method.
   */
  isDefault: boolean;

  /** Updated whenever the client picks this location for a task or browse. */
  lastUsedAt?: Date;
}

// ─── Instance Methods ─────────────────────────────────────────────────────────

export interface LocationMethods {
  softDelete(
    deletedBy?: Types.ObjectId,
  ): Promise<HydratedDocument<Location, LocationMethods>>;

  restore(): Promise<HydratedDocument<Location, LocationMethods>>;

  /**
   * Marks this location as the client's default, clearing the flag
   * on any other Location belonging to the same client.
   */
  setAsDefault(): Promise<HydratedDocument<Location, LocationMethods>>;

  /**
   * Stamps lastUsedAt with the current time.
   * Call this whenever the client selects the location for a task or browse session.
   */
  markUsed(): Promise<HydratedDocument<Location, LocationMethods>>;
}

// ─── Static Methods ───────────────────────────────────────────────────────────

export interface LocationModel extends Model<
  Location,
  object,
  LocationMethods
> {
  /** All non-deleted locations for a client, most recently used first. */
  findByClient(
    clientId: string | Types.ObjectId,
  ): ReturnType<Model<Location>["find"]>;

  /** The default location for a client, or null if none is set. */
  findDefaultForClient(
    clientId: string | Types.ObjectId,
  ): ReturnType<Model<Location>["findOne"]>;
}

// ─── API Request / Response ───────────────────────────────────────────────────

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
