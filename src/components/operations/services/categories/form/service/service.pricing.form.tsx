"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  FeeItem,
  PricingTier,
  PricingModel,
  PricingUnit,
} from "@/types/services/service.types";
import { SUPPORTED_CURRENCIES } from "@/types/services/service.types";

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
  tiersEnabled: boolean;
  tiers: TierDraft[];
  feesEnabled: boolean;
  additionalFees: FeeItemDraft[];
  discountEnabled: boolean;
  discountRate: string;
  discountAmount: string;
  discountExpiresAt: string;
  discountPromoCode: string;
}

export type PricingValidationErrors = Partial<
  Record<
    | "basePrice"
    | "unit"
    | "taxRate"
    | "minimumPrice"
    | "discountRate"
    | "discountAmount"
    | "promoCode",
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

const PRESET_UNITS_HOURLY   = ["hour", "half_day", "day"] as const;
const PRESET_UNITS_PER_UNIT = ["item", "word", "page", "session", "km"] as const;
const ALL_PRESET_UNITS      = [...PRESET_UNITS_HOURLY, ...PRESET_UNITS_PER_UNIT];

const PRICING_MODELS: { value: PricingModel; label: string; description: string }[] = [
  { value: "fixed",      label: "Fixed",      description: "One set total"               },
  { value: "hourly",     label: "Hourly",     description: "Rate × time period"          },
  { value: "per_unit",   label: "Per Unit",   description: "Price per item, km, etc."    },
  { value: "negotiable", label: "Negotiable", description: "Customer bids above a floor" },
  { value: "free",       label: "Free",       description: "No charge"                   },
];

// Human-friendly labels for unit chips
const UNIT_LABELS: Record<string, string> = {
  hour:     "Hour",
  half_day: "Half Day",
  day:      "Full Day",
  item:     "Item",
  word:     "Word",
  page:     "Page",
  session:  "Session",
  km:       "km",
};

// =============================================================================
// Helpers
// =============================================================================

function makeKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function initEmptyPricing(): PricingFormState {
  return {
    enabled:           false,
    pricingModel:      "fixed",
    currency:          "GHS",
    basePrice:         "",
    unit:              "",
    taxIncluded:       false,
    taxRate:           "",
    minimumPrice:      "",
    pricingNotes:      "",
    tiersEnabled:      false,
    tiers:             [],
    feesEnabled:       false,
    additionalFees:    [],
    discountEnabled:   false,
    discountRate:      "",
    discountAmount:    "",
    discountExpiresAt: "",
    discountPromoCode: "",
  };
}

// =============================================================================
// Shared styles
// =============================================================================

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg " +
  "bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

// =============================================================================
// Primitives
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
        inputCls,
        error && "border-red-500 focus:ring-red-500",
        className,
      )}
    />
  );
}

function CurrencySelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  return (
    <select
      id="currency"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, "w-24 shrink-0", className)}>
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}

function CollapsibleSection({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && <div className="p-4 space-y-3">{children}</div>}
    </div>
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
  function patch(partial: Partial<PricingFormState>) {
    onChange({ ...p, ...partial });
  }

  function set<K extends keyof PricingFormState>(key: K, val: PricingFormState[K]) {
    patch({ [key]: val });
  }

  // ── Fee helpers ───────────────────────────────────────────────────────────
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

  // ── Tier helpers ──────────────────────────────────────────────────────────
  function addTier() {
    patch({
      tiers: [
        ...p.tiers,
        { _key: makeKey(), tierId: makeKey(), label: "", basePrice: 0, description: "" },
      ],
    });
  }

  function updateTier(key: string, diff: Partial<TierDraft>) {
    patch({ tiers: p.tiers.map((t) => (t._key === key ? { ...t, ...diff } : t)) });
  }

  function removeTier(key: string) {
    patch({ tiers: p.tiers.filter((t) => t._key !== key) });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const customUnit = ALL_PRESET_UNITS.includes(p.unit as never) ? "" : p.unit;

  const chipBase   = "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors";
  const chipActive = "bg-teal-600 text-white border-teal-600";
  const chipIdle   = "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500";
  const chipError  = "border-red-400 text-gray-600 dark:text-gray-400";

  function unitChipCls(u: string) {
    return cn(chipBase, p.unit === u ? chipActive : errors.unit ? chipError : chipIdle);
  }

  return (
    <div className="space-y-4">
      {/* ── Enable toggle ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Enable pricing</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Turn off to list without a set price</p>
        </div>
        <Switch checked={p.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>

      {p.enabled && (
        <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">

          {/* ── Pricing model ───────────────────────────────────────────────── */}
          <FieldRow label="Pricing Model" required>
            <div className="flex flex-wrap gap-2">
              {PRICING_MODELS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("pricingModel", value)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-left transition-colors",
                    p.pricingModel === value ? chipActive : chipIdle,
                  )}>
                  <span className="block text-xs font-semibold leading-tight">{label}</span>
                  <span
                    className={cn(
                      "block text-[10px] leading-tight mt-0.5",
                      p.pricingModel === value
                        ? "text-white/75"
                        : "text-gray-400 dark:text-gray-500",
                    )}>
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </FieldRow>

          {/* ── Core pricing — model-specific ───────────────────────────────── */}
          {p.pricingModel === "free" ? (
            // ── Free ────────────────────────────────────────────────────────
            <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-4 py-3">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Free service</p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                No charge — customers will not be billed for this service.
              </p>
            </div>

          ) : p.pricingModel === "hourly" ? (
            // ── Hourly ──────────────────────────────────────────────────────
            // When tiers are active the base rate comes from each tier, so we
            // only need the billing period.  Without tiers, rate + period live
            // on the same row: "GHS 50 per Hour".
            p.tiersEnabled ? (
              <div className="space-y-3">
                <FieldRow id="currency" label="Currency">
                  <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
                </FieldRow>
                <FieldRow
                  label="Billing Period"
                  required
                  hint="The time period each tier's rate applies to"
                  error={errors.unit}>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_UNITS_HOURLY.map((u) => (
                      <button key={u} type="button" onClick={() => set("unit", u as PricingUnit)}
                        className={unitChipCls(u)}>
                        {UNIT_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </div>
            ) : (
              <FieldRow
                label="Hourly Rate"
                required
                error={errors.basePrice}
                hint="Rate and billing period — e.g. GHS 50 per Hour">
                <div className="flex flex-wrap gap-2 items-center">
                  <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
                  <TextInput
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={p.basePrice}
                    onChange={(e) => set("basePrice", e.target.value)}
                    placeholder="0.00"
                    error={errors.basePrice}
                    className="w-28 shrink-0"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">per</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_UNITS_HOURLY.map((u) => (
                      <button key={u} type="button" onClick={() => set("unit", u as PricingUnit)}
                        className={unitChipCls(u)}>
                        {UNIT_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.unit && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Select a billing period
                  </p>
                )}
              </FieldRow>
            )

          ) : p.pricingModel === "per_unit" ? (
            // ── Per Unit ────────────────────────────────────────────────────
            <div className="space-y-3">
              {!p.tiersEnabled && (
                <div className="flex gap-3 items-end">
                  <FieldRow id="currency" label="Currency">
                    <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
                  </FieldRow>
                  <div className="flex-1">
                    <FieldRow
                      id="basePrice"
                      label="Price per Unit"
                      required
                      error={errors.basePrice}
                      hint="Amount charged for each unit">
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
                  </div>
                </div>
              )}
              {p.tiersEnabled && (
                <FieldRow id="currency" label="Currency">
                  <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
                </FieldRow>
              )}
              <FieldRow
                id="unit"
                label="Unit of Measure"
                required
                hint="What counts as one unit? This is shown to customers."
                error={errors.unit}>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_UNITS_PER_UNIT.map((u) => (
                    <button key={u} type="button" onClick={() => set("unit", u as PricingUnit)}
                      className={unitChipCls(u)}>
                      {UNIT_LABELS[u]}
                    </button>
                  ))}
                  <TextInput
                    name="unit_custom"
                    value={customUnit ?? ""}
                    onChange={(e) => set("unit", e.target.value as PricingUnit)}
                    placeholder="Other…"
                    error={errors.unit}
                    className="w-28"
                  />
                </div>
              </FieldRow>
            </div>

          ) : p.pricingModel === "negotiable" ? (
            // ── Negotiable ──────────────────────────────────────────────────
            <div className="flex gap-3 items-end">
              <FieldRow id="currency" label="Currency">
                <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
              </FieldRow>
              <div className="flex-1">
                <FieldRow
                  id="minimumPrice"
                  label="Floor Price"
                  required
                  error={errors.minimumPrice}
                  hint="Customers cannot offer below this amount">
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
              </div>
            </div>

          ) : (
            // ── Fixed (default) ─────────────────────────────────────────────
            p.tiersEnabled ? (
              <FieldRow id="currency" label="Currency">
                <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
              </FieldRow>
            ) : (
              <div className="flex gap-3 items-end">
                <FieldRow id="currency" label="Currency">
                  <CurrencySelect value={p.currency} onChange={(v) => set("currency", v)} />
                </FieldRow>
                <div className="flex-1">
                  <FieldRow
                    id="basePrice"
                    label="Fixed Price"
                    required
                    error={errors.basePrice}
                    hint="Total amount charged per booking">
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
                </div>
              </div>
            )
          )}

          {/* ── Tax ─────────────────────────────────────────────────────────── */}
          {p.pricingModel !== "free" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tax included</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.taxIncluded ? "Gross — tax is in the price" : "Net — tax added at checkout"}
                  </p>
                </div>
                <Switch checked={p.taxIncluded} onCheckedChange={(v) => set("taxIncluded", v)} />
              </div>
              <FieldRow
                id="taxRate"
                label="Tax Rate"
                required={!p.taxIncluded}
                error={errors.taxRate}
                hint={!p.taxIncluded ? "Required — e.g. 0.15 for 15% VAT" : "e.g. 0.15 for 15% VAT"}>
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

          {/* ── Tiered packages ─────────────────────────────────────────────── */}
          <CollapsibleSection
            label="Tiered packages"
            description="Offer Basic / Standard / Premium options"
            enabled={p.tiersEnabled}
            onToggle={(v) => set("tiersEnabled", v)}>
            {p.tiers.map((tier) => (
              <div
                key={tier._key}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Label">
                    <TextInput
                      name={`tier-label-${tier._key}`}
                      value={tier.label}
                      onChange={(e) => updateTier(tier._key, { label: e.target.value })}
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
                        updateTier(tier._key, { basePrice: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </FieldRow>
                </div>
                <FieldRow label="Description">
                  <TextInput
                    name={`tier-desc-${tier._key}`}
                    value={tier.description ?? ""}
                    onChange={(e) => updateTier(tier._key, { description: e.target.value })}
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
          </CollapsibleSection>

          {/* ── Additional fees ─────────────────────────────────────────────── */}
          <CollapsibleSection
            label="Additional fees"
            description="Charges added on top of the base price"
            enabled={p.feesEnabled}
            onToggle={(v) => patch({ feesEnabled: v, additionalFees: v ? p.additionalFees : [] })}>
            {p.additionalFees.map((fee) => (
              <div
                key={fee._key}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                <TextInput
                  name={`fee-label-${fee._key}`}
                  value={fee.label}
                  onChange={(e) => updateFee(fee._key, { label: e.target.value })}
                  placeholder="e.g. Travel Fee"
                />
                <TextInput
                  name={`fee-amount-${fee._key}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee.amount.toString()}
                  onChange={(e) => updateFee(fee._key, { amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Amount"
                  className="w-24"
                />
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fee.isOptional}
                    onChange={(e) => updateFee(fee._key, { isOptional: e.target.checked })}
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
            <button
              type="button"
              onClick={addFee}
              className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline">
              <Plus className="w-4 h-4" />
              Add fee
            </button>
          </CollapsibleSection>

          {/* ── Discount / Promotion ─────────────────────────────────────────── */}
          <CollapsibleSection
            label="Discount / Promotion"
            description="Offer a percentage or fixed amount off"
            enabled={p.discountEnabled}
            onToggle={(v) =>
              patch({
                discountEnabled: v,
                ...(v ? {} : {
                  discountRate:      "",
                  discountAmount:    "",
                  discountExpiresAt: "",
                  discountPromoCode: "",
                }),
              })
            }>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow id="discountRate" label="Discount %" hint="e.g. 0.10 for 10% off" error={errors.discountRate}>
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
              <FieldRow id="discountAmount" label="Fixed Amount Off" error={errors.discountAmount}>
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
              <FieldRow
                id="discountPromoCode"
                label="Promo Code"
                hint="3–20 uppercase letters/numbers (e.g. SAVE10)"
                error={errors.promoCode}>
                <TextInput
                  id="discountPromoCode"
                  name="discountPromoCode"
                  value={p.discountPromoCode}
                  onChange={(e) => set("discountPromoCode", e.target.value.toUpperCase())}
                  placeholder="SAVE10"
                  error={errors.promoCode}
                />
              </FieldRow>
              <FieldRow id="discountExpiresAt" label="Expires At">
                <input
                  id="discountExpiresAt"
                  type="date"
                  value={p.discountExpiresAt}
                  onChange={(e) => set("discountExpiresAt", e.target.value)}
                  className={inputCls}
                />
              </FieldRow>
            </div>
          </CollapsibleSection>

          {/* ── Pricing notes ────────────────────────────────────────────────── */}
          <FieldRow
            id="pricingNotes"
            label="Pricing Notes"
            hint="Additional context shown to customers">
            <textarea
              id="pricingNotes"
              value={p.pricingNotes}
              onChange={(e) => set("pricingNotes", e.target.value)}
              rows={2}
              placeholder="Any pricing context for customers…"
              className={cn(inputCls, "resize-none")}
            />
          </FieldRow>

        </div>
      )}
    </div>
  );
}
