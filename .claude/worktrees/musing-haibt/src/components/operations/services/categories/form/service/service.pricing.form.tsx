"use client";

import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  FeeItem,
  PricingTier,
  PricingModel,
  PricingUnit,
} from "@/types/services/service.types";

// =============================================================================
// Types
// =============================================================================

export interface FeeItemDraft extends FeeItem {
  _key: string;
}

export interface TierDraft extends PricingTier {
  _key: string;
}

export interface PricingFormState {
  enabled: boolean;
  pricingModel: PricingModel;
  currency: string;
  basePrice: string;
  unit: PricingUnit | "";
  taxIncluded: boolean;
  taxRate: string;
  minimumPrice: string;
  pricingNotes: string;
  discountRate: string;
  discountAmount: string;
  discountExpiresAt: string;
  discountPromoCode: string;
  additionalFees: FeeItemDraft[];
  tiersEnabled: boolean;
  tiers: TierDraft[];
}

export type PricingValidationErrors = Partial<
  Record<
    | "basePrice"
    | "taxRate"
    | "minimumPrice"
    | "discountRate"
    | "discountAmount",
    string
  >
>;

export interface ServicePricingFormProps {
  value: PricingFormState;
  onChange: (value: PricingFormState) => void;
  errors?: PricingValidationErrors;
}

// =============================================================================
// Constants
// =============================================================================

const PRESET_UNITS_HOURLY = ["hour", "half_day", "day"] as const;
const PRESET_UNITS_PER_UNIT = [
  "item",
  "word",
  "page",
  "session",
  "km",
] as const;
const ALL_PRESET_UNITS = [...PRESET_UNITS_HOURLY, ...PRESET_UNITS_PER_UNIT];

const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "per_unit", label: "Per Unit" },
  { value: "negotiable", label: "Negotiable" },
  { value: "free", label: "Free" },
];

const CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"] as const;

// =============================================================================
// Helpers
// =============================================================================

function makeKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function initEmptyPricing(): PricingFormState {
  return {
    enabled: false,
    pricingModel: "fixed",
    currency: "GHS",
    basePrice: "",
    unit: "",
    taxIncluded: false,
    taxRate: "",
    minimumPrice: "",
    pricingNotes: "",
    discountRate: "",
    discountAmount: "",
    discountExpiresAt: "",
    discountPromoCode: "",
    additionalFees: [],
    tiersEnabled: false,
    tiers: [],
  };
}

// =============================================================================
// Sub-components
// =============================================================================

function FieldRow({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function TextInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  step,
  min,
  max,
  className,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
}) {
  return (
    <input
      id={id ?? name}
      name={name}
      type={type}
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors",
        error
          ? "border-red-500 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-700",
        className,
      )}
    />
  );
}

// =============================================================================
// Main component
// =============================================================================

export function ServicePricingForm({
  value: p,
  onChange,
  errors = {},
}: ServicePricingFormProps) {
  // ── Patch helpers ─────────────────────────────────────────────────────
  function patch(partial: Partial<PricingFormState>) {
    onChange({ ...p, ...partial });
  }

  function set<K extends keyof PricingFormState>(
    key: K,
    val: PricingFormState[K],
  ) {
    patch({ [key]: val });
  }

  // ── Fee helpers ───────────────────────────────────────────────────────
  function addFee() {
    patch({
      additionalFees: [
        ...p.additionalFees,
        { _key: makeKey(), label: "", amount: 0, isOptional: false },
      ],
    });
  }

  function updateFee(key: string, diff: Partial<FeeItemDraft>) {
    patch({
      additionalFees: p.additionalFees.map((f) =>
        f._key === key ? { ...f, ...diff } : f,
      ),
    });
  }

  function removeFee(key: string) {
    patch({ additionalFees: p.additionalFees.filter((f) => f._key !== key) });
  }

  // ── Tier helpers ──────────────────────────────────────────────────────
  function addTier() {
    patch({
      tiers: [
        ...p.tiers,
        {
          _key: makeKey(),
          tierId: makeKey(),
          label: "",
          basePrice: 0,
          description: "",
        },
      ],
    });
  }

  function updateTier(key: string, diff: Partial<TierDraft>) {
    patch({
      tiers: p.tiers.map((t) => (t._key === key ? { ...t, ...diff } : t)),
    });
  }

  function removeTier(key: string) {
    patch({ tiers: p.tiers.filter((t) => t._key !== key) });
  }

  // ── Derived flags ─────────────────────────────────────────────────────
  const needsBasePrice =
    p.pricingModel !== "free" &&
    p.pricingModel !== "negotiable" &&
    !p.tiersEnabled;

  const showCurrency = p.pricingModel !== "free";
  const showUnit = p.pricingModel === "per_unit" || p.pricingModel === "hourly";
  const presetUnits =
    p.pricingModel === "hourly" ? PRESET_UNITS_HOURLY : PRESET_UNITS_PER_UNIT;
  const customUnit = ALL_PRESET_UNITS.includes(p.unit as never) ? "" : p.unit;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Enable pricing
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Turn off to list without a set price
          </p>
        </div>
        <Switch
          checked={p.enabled}
          onCheckedChange={(v) => set("enabled", v)}
        />
      </div>

      {p.enabled && (
        <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Pricing model */}
          <FieldRow label="Pricing Model" required>
            <div className="flex flex-wrap gap-2">
              {PRICING_MODELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("pricingModel", value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium border transition-colors",
                    p.pricingModel === value
                      ? "bg-teal-600 text-white border-teal-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500",
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Currency */}
          {showCurrency && (
            <FieldRow id="currency" label="Currency">
              <select
                id="currency"
                value={p.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldRow>
          )}

          {/* Base price */}
          {needsBasePrice && (
            <FieldRow
              id="basePrice"
              label="Base Price"
              required
              error={errors.basePrice}>
              <TextInput
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={p.basePrice}
                onChange={(e) => set("basePrice", e.target.value)}
                placeholder="0.00"
                error={errors.basePrice}
              />
            </FieldRow>
          )}

          {/* Unit */}
          {showUnit && (
            <FieldRow
              id="unit"
              label="Unit"
              hint="What does one unit represent?">
              <div className="flex flex-wrap gap-2 items-center">
                {presetUnits.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set("unit", u as PricingUnit)}
                    className={cn(
                      "px-3 py-1.5 rounded border text-xs transition-colors",
                      p.unit === u
                        ? "bg-teal-600 text-white border-teal-600"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-500",
                    )}>
                    {u}
                  </button>
                ))}
                <TextInput
                  name="unit_custom"
                  value={customUnit ?? ""}
                  onChange={(e) => set("unit", e.target.value as PricingUnit)}
                  placeholder="Custom unit…"
                  className="w-32"
                />
              </div>
            </FieldRow>
          )}

          {/* Minimum price (negotiable only) */}
          {p.pricingModel === "negotiable" && (
            <FieldRow
              id="minimumPrice"
              label="Minimum Acceptable Price"
              required
              error={errors.minimumPrice}
              hint="Customers cannot submit offers below this amount">
              <TextInput
                id="minimumPrice"
                name="minimumPrice"
                type="number"
                step="0.01"
                min="0"
                value={p.minimumPrice}
                onChange={(e) => set("minimumPrice", e.target.value)}
                placeholder="0.00"
                error={errors.minimumPrice}
              />
            </FieldRow>
          )}

          {/* Tax */}
          {showCurrency && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Tax included
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.taxIncluded
                      ? "Gross (tax in price)"
                      : "Net (tax at checkout)"}
                  </p>
                </div>
                <Switch
                  checked={p.taxIncluded}
                  onCheckedChange={(v) => set("taxIncluded", v)}
                />
              </div>
              <FieldRow
                id="taxRate"
                label="Tax Rate"
                error={errors.taxRate}
                hint="e.g. 0.15 for 15% VAT">
                <TextInput
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={p.taxRate}
                  onChange={(e) => set("taxRate", e.target.value)}
                  placeholder="0.15"
                  error={errors.taxRate}
                />
              </FieldRow>
            </div>
          )}

          {/* Tiered packages */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Tiered packages
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Offer Basic / Standard / Premium options
                </p>
              </div>
              <Switch
                checked={p.tiersEnabled}
                onCheckedChange={(v) => set("tiersEnabled", v)}
              />
            </div>

            {p.tiersEnabled && (
              <div className="p-4 space-y-3">
                {p.tiers.map((tier) => (
                  <div
                    key={tier._key}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Label">
                        <TextInput
                          name={`tier-label-${tier._key}`}
                          value={tier.label}
                          onChange={(e) =>
                            updateTier(tier._key, { label: e.target.value })
                          }
                          placeholder="e.g. Standard"
                        />
                      </FieldRow>
                      <FieldRow label="Price">
                        <TextInput
                          name={`tier-price-${tier._key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.basePrice.toString()}
                          onChange={(e) =>
                            updateTier(tier._key, {
                              basePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </FieldRow>
                    </div>
                    <FieldRow label="Description">
                      <TextInput
                        name={`tier-desc-${tier._key}`}
                        value={tier.description ?? ""}
                        onChange={(e) =>
                          updateTier(tier._key, { description: e.target.value })
                        }
                        placeholder="What's included…"
                      />
                    </FieldRow>
                    <button
                      type="button"
                      onClick={() => removeTier(tier._key)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove tier
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTier}
                  className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline">
                  <Plus className="w-4 h-4" />
                  Add tier
                </button>
              </div>
            )}
          </div>

          {/* Additional fees */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Additional fees
              </p>
              <button
                type="button"
                onClick={addFee}
                className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Add fee
              </button>
            </div>

            {p.additionalFees.length > 0 && (
              <div className="p-3 space-y-2">
                {p.additionalFees.map((fee) => (
                  <div
                    key={fee._key}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                    <TextInput
                      name={`fee-label-${fee._key}`}
                      value={fee.label}
                      onChange={(e) =>
                        updateFee(fee._key, { label: e.target.value })
                      }
                      placeholder="Fee label (e.g. Travel Fee)"
                    />
                    <TextInput
                      name={`fee-amount-${fee._key}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={fee.amount.toString()}
                      onChange={(e) =>
                        updateFee(fee._key, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Amount"
                      className="w-24"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fee.isOptional}
                        onChange={(e) =>
                          updateFee(fee._key, { isOptional: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      Optional
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFee(fee._key)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount / Promotion */}
          <DiscountSection p={p} set={set} errors={errors} />

          {/* Pricing notes */}
          <FieldRow
            id="pricingNotes"
            label="Pricing Notes"
            hint="Additional pricing context shown to customers">
            <textarea
              id="pricingNotes"
              value={p.pricingNotes}
              onChange={(e) => set("pricingNotes", e.target.value)}
              rows={2}
              placeholder="Any pricing context for customers…"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </FieldRow>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Discount sub-section (kept internal — no standalone need yet)
// =============================================================================

function DiscountSection({
  p,
  set,
  errors,
}: {
  p: PricingFormState;
  set: <K extends keyof PricingFormState>(
    key: K,
    val: PricingFormState[K],
  ) => void;
  errors: PricingValidationErrors;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/60 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        Discount / Promotion
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow
              id="discountRate"
              label="Discount %"
              hint="e.g. 0.10 for 10% off"
              error={errors.discountRate}>
              <TextInput
                id="discountRate"
                name="discountRate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={p.discountRate}
                onChange={(e) => set("discountRate", e.target.value)}
                placeholder="0.10"
                error={errors.discountRate}
              />
            </FieldRow>
            <FieldRow
              id="discountAmount"
              label="Fixed Discount Amount"
              error={errors.discountAmount}>
              <TextInput
                id="discountAmount"
                name="discountAmount"
                type="number"
                step="0.01"
                min="0"
                value={p.discountAmount}
                onChange={(e) => set("discountAmount", e.target.value)}
                placeholder="5.00"
                error={errors.discountAmount}
              />
            </FieldRow>
            <FieldRow id="discountPromoCode" label="Promo Code">
              <TextInput
                id="discountPromoCode"
                name="discountPromoCode"
                value={p.discountPromoCode}
                onChange={(e) => set("discountPromoCode", e.target.value)}
                placeholder="SAVE10"
              />
            </FieldRow>
            <FieldRow id="discountExpiresAt" label="Expires At">
              <input
                id="discountExpiresAt"
                type="date"
                value={p.discountExpiresAt}
                onChange={(e) => set("discountExpiresAt", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </FieldRow>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        "w-4 h-4 opacity-60 transition-transform",
        open && "rotate-180",
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Inline React import for the DiscountSection useState call
import React from "react";
