// =============================================================================
// Pricing primitives
// =============================================================================

import { BaseEntity, SoftDeletable } from "../base.types";
import { IFile } from "../files.types";
import { Category } from "./categories/service.category.types";

/**
 * Currencies accepted by the platform.
 * Must stay in sync with SUPPORTED_CURRENCIES on the backend.
 */
export const SUPPORTED_CURRENCIES = [
  "GHS",
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "KES",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Regex for promo codes — must stay in sync with PROMO_CODE_REGEX on the backend. */
export const PROMO_CODE_REGEX = /^[A-Z0-9]{3,20}$/;

/**
 * How the service is priced.
 * Must stay in sync with the backend PricingModel union.
 */
export type PricingModel =
  | "fixed"
  | "hourly"
  | "per_unit"
  | "negotiable"
  | "free";

/**
 * Granular unit label attached to the base price.
 * The string escape hatch allows custom units from the API.
 */
export type PricingUnit =
  | "session"
  | "hour"
  | "half_day"
  | "day"
  | "item"
  | "word"
  | "page"
  | "km"
  | string;

/** A single additional charge on top of the base price. */
export interface FeeItem {
  /** Human-readable label shown on the invoice, e.g. "Travel Fee" */
  label: string;
  amount: number;
  /**
   * When true the customer can decline this fee.
   * When false it is always applied.
   */
  isOptional: boolean;
}

/**
 * One tier in a multi-package offering (Basic / Standard / Premium).
 * When `tiers` is present on the parent it takes precedence over `basePrice`.
 */
export interface PricingTier {
  /** Stable identifier used in orders/bookings, e.g. "basic" */
  tierId: string;
  /** Display label, e.g. "Standard Package" */
  label: string;
  description?: string;
  basePrice: number;
  /** Relevant when pricingModel is "hourly" or the tier is time-bounded */
  durationMinutes?: number;
  /** Bullet-point list of what is included */
  deliverables?: string[];
}

// =============================================================================
// Core pricing block
// =============================================================================

export interface ServicePricing {
  // --- Model & unit ---
  pricingModel: PricingModel;
  /**
   * Price for a single unit/session.
   * Ignored when `tiers` is provided.
   */
  basePrice?: number;
  /** Clarifies what one "unit" means, e.g. "hour", "session" */
  unit?: PricingUnit;

  // --- Tiered packages ---
  /**
   * When present the service offers multiple packages.
   * UI should render a tier selector; orders must reference a tierId.
   */
  tiers?: PricingTier[];

  // --- Add-on fees ---
  additionalFees?: FeeItem[];

  // --- Tax ---
  /** e.g. 0.15 for 15% VAT / GST. Omit or set 0 if not applicable. */
  taxRate?: number;
  /**
   * true  → displayed price already includes tax (gross pricing).
   * false → tax is added on top at checkout (net pricing).
   */
  taxIncluded: boolean;

  // --- Negotiation floor ---
  /**
   * Only relevant when pricingModel === "negotiable".
   * Prevents customers from submitting offers below this floor.
   */
  minimumPrice?: number;

  // --- Discount / promotions ---
  discount?: {
    /** Percentage discount, e.g. 0.10 for 10% off */
    rate?: number;
    /** Fixed amount off, e.g. 5.00 */
    amount?: number;
    /** ISO 8601 expiry — discount is ignored after this date */
    expiresAt?: string;
    /** Optional coupon / promo code that triggers this discount */
    promoCode?: string;
  };

  // --- Currency ---
  /** ISO 4217 currency code, e.g. "USD", "GBP", "NGN" */
  currency: string;

  /**
   * The platform commission rate snapshot active when this listing was
   * created or last updated. Read-only on the frontend — never use it to
   * calculate live payouts. The authoritative rate always comes from platform config.
   */
  commissionRateSnapshot: number;

  // --- Provider notes ---
  pricingNotes?: string;
}

/**
 * What providers submit when creating or updating pricing.
 * commissionRateSnapshot is intentionally absent — it is set by the server
 * and must never be sent from the client.
 */
export type ServicePricingInput = Omit<ServicePricing, "commissionRateSnapshot">;

// =============================================================================
// Service
// =============================================================================

export interface Service extends BaseEntity, SoftDeletable {
  title: string;
  description: string;
  slug: string;
  tags: string[];

  /** _id of the parent category */
  categoryId: Category;

  /** _id of the cover image asset */
  coverImage?: IFile;

  /** _id of the provider (user) who owns this service */
  providerId: string;

  /**
   * Full pricing configuration.
   * Absent on draft / unpublished services.
   */
  servicePricing?: ServicePricing;

  isPrivate: boolean;

  // --- Moderation ---
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string; // ISO 8601
  rejectedAt?: string; // ISO 8601
  rejectionReason?: string;
  isActive?: boolean;

  /**
   * When set, the service is scheduled for automatic activation at this time.
   * Null when auto-activation is cleared (manually approved/rejected, etc.).
   */
  scheduledActivationAt?: string | null; // ISO 8601
}

/**
 * A fully resolved service as returned by detail/list endpoints.
 * Extends Service with the computed virtuals the backend populates.
 */
export interface ServiceWithVirtuals extends Service {
  // --- Moderation state flags ---
  isApproved: boolean;
  isRejected: boolean;
  isPending: boolean;
  service: Service;

  /**
   * True when the service has a future scheduledActivationAt and has not yet
   * been activated or rejected.
   */
  isPendingAutoActivation: boolean;

  /**
   * What the provider takes home per base-price unit after commission.
   * null when pricing is absent or pricingModel is "free" / "negotiable".
   */
  providerEarnings: number | null;

  /**
   * The all-in price shown to the customer before optional fees.
   * null when pricing or basePrice is absent.
   */
  effectivePrice: number | null;

  /** True when the service has multi-tier (package) pricing. */
  hasTiers: boolean;
}

// =============================================================================
// API utility types
// =============================================================================

/** Filters accepted by the searchServices endpoint. */
export interface ServiceSearchFilters {
  categoryId?: string;
  providerId?: string;
  minPrice?: number;
  maxPrice?: number;
  pricingModel?: PricingModel;
  currency?: string;
}

/** A single result row returned by the search endpoint. */
export interface ServiceSearchResult extends ServiceWithVirtuals {
  /** Populated category name — avoids a second request in list views. */
  categoryName?: string;
}
