// components/tasks/providerCard.utils.ts
// Shared utilities consumed by ProviderCard, MatchedProvidersDrawer, and TaskResultDialog.

import { ProviderMatchResult } from "@/types/task.types";
import {
  ProviderProfile,
  PopulatedProviderProfile,
} from "@/types/provider.profile.types";

// ─── Local summary type ───────────────────────────────────────────────────────
// ProviderProfileSummary was removed from canonical types; defined locally here.

export interface ProviderProfileSummary {
  _id: string;
  businessName?: string;
  contactInfo?: {
    mainContact?: string | null;
    businessEmail?: string | null;
  } | null;
  locationData?: {
    region?: string;
    city?: string;
    locality?: string;
    isAddressVerified?: boolean;
  };
  isAlwaysAvailable?: boolean;
}

// ─── Enriched match ───────────────────────────────────────────────────────────

/** Combines a raw ProviderMatchResult with its hydrated ProviderProfileSummary. */
export interface EnrichedMatch extends ProviderMatchResult {
  profile?: ProviderProfileSummary;
  /** True while the profile fetch for this card slot is in flight. */
  profileLoading?: boolean;
}

// ─── Profile fetch ────────────────────────────────────────────────────────────

/**
 * Fetches a single provider profile by ID and coerces the full response into
 * the lightweight ProviderProfileSummary shape used by ProviderCard.
 */
export async function fetchProviderProfile(
  providerId: string,
): Promise<ProviderProfileSummary | null> {
  try {
    const res = await fetch(`/api/providers/${providerId}?populate=true`);
    if (!res.ok) return null;

    const json = await res.json();

    // API may wrap as { data: { providerProfile } } or { providerProfile }
    const p: ProviderProfile | PopulatedProviderProfile | null =
      json?.data?.providerProfile ?? json?.providerProfile ?? null;

    if (!p?._id) return null;

    return {
      _id: String(p._id),
      businessName: p.businessName,
      contactInfo: p.contactInfo
        ? {
            mainContact: p.contactInfo.mainContact,
            businessEmail: p.contactInfo.businessEmail,
          }
        : null,
      locationData: p.locationData
        ? {
            region: p.locationData.region,
            city: p.locationData.city,
            locality: p.locationData.locality,
            isAddressVerified: p.locationData.isAddressVerified,
          }
        : undefined,
      isAlwaysAvailable: p.isAlwaysAvailable,
    };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 2-letter initials from a business name, or the last 4 chars of the ID. */
export function getInitials(
  businessName?: string,
  providerId?: string,
): string {
  if (businessName) {
    const words = businessName.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return businessName.slice(0, 2).toUpperCase();
  }
  return providerId ? providerId.slice(-4).toUpperCase() : "??";
}

/**
 * Normalises `matchedServices` entries — the backend may return MongoID objects
 * instead of plain strings.
 */
export function normaliseRawProviders(
  raw: ProviderMatchResult[],
): ProviderMatchResult[] {
  return raw.map((p) => ({
    ...p,
    matchedServices: (p.matchedServices ?? []).map((s) =>
      typeof s === "string"
        ? s
        : ((s as { $oid?: string }).$oid ?? String(s)),
    ),
  }));
}

// ─── Progressive enrichment ───────────────────────────────────────────────────

/**
 * Seeds an EnrichedMatch[] with loading skeletons, then fetches all provider
 * profiles concurrently, calling `onUpdate` as each slot resolves.
 *
 * Returns a cancel function — call it on `useEffect` cleanup to prevent stale
 * state updates after the component unmounts.
 *
 * @example
 * useEffect(() => {
 *   const cancel = enrichProviders(rawList, setEnriched);
 *   return cancel;
 * }, [rawList]);
 */
export function enrichProviders(
  raw: ProviderMatchResult[],
  onUpdate: (enriched: EnrichedMatch[]) => void,
): () => void {
  let cancelled = false;

  void (async () => {
    // Yield one microtask so the call never synchronously triggers setState
    // inside a useEffect body — keeps React strict mode happy.
    await Promise.resolve();
    if (cancelled) return;

    if (raw.length === 0) {
      onUpdate([]);
      return;
    }

    // Seed with skeleton placeholders so cards render immediately
    const slots: EnrichedMatch[] = raw.map((p) => ({
      ...p,
      profileLoading: true,
    }));
    onUpdate([...slots]);

    // Fetch all profiles concurrently; patch each slot individually as it resolves
    await Promise.all(
      raw.map(async (r, idx) => {
        const profile = await fetchProviderProfile(r.providerId);
        if (cancelled) return;

        slots[idx] = {
          ...slots[idx],
          profile: profile ?? undefined,
          profileLoading: false,
        };
        onUpdate([...slots]);
      }),
    );
  })();

  return () => {
    cancelled = true;
  };
}
