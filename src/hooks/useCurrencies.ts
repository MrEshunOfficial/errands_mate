"use client";

import { useEffect, useState } from "react";
import { SUPPORTED_CURRENCIES } from "@/types/services/service.types";

export interface CurrencyOption {
  code: string;
  name: string;
}

const FALLBACK: CurrencyOption[] = SUPPORTED_CURRENCIES.map((code) => ({
  code,
  name: code,
}));

// Two CDN mirrors for fawazahmed0/currency-api — no auth required
const ENDPOINTS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json",
  "https://latest.currency-api.pages.dev/v1/currencies.json",
];

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrencies() {
      for (const url of ENDPOINTS) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data: Record<string, string> = await res.json();
          if (cancelled) return;
          const options: CurrencyOption[] = Object.entries(data)
            .map(([code, name]) => ({
              code: code.toUpperCase(),
              name: name as string,
            }))
            .sort((a, b) => a.code.localeCompare(b.code));
          setCurrencies(options);
          setLoading(false);
          return;
        } catch {
          // try next mirror
        }
      }
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    fetchCurrencies();
    return () => {
      cancelled = true;
    };
  }, []);

  return { currencies, loading, error };
}
