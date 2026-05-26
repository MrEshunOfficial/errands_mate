import { useEffect, useState } from "react";
import { serviceCoverAPI } from "@/lib/api/files/serviceCover.api";

// Module-level cache: serviceId → resolved URL (or null on failure)
const cache = new Map<string, string | null>();
// In-flight promises so concurrent callers with the same ID share one request
const inflight = new Map<string, Promise<string | null>>();

async function resolveUrl(serviceId: string): Promise<string | null> {
  if (cache.has(serviceId)) return cache.get(serviceId)!;

  if (!inflight.has(serviceId)) {
    const promise = serviceCoverAPI
      .getPublicCoverRecord(serviceId)
      .then((file) => {
        const url = file?.thumbnailUrl ?? file?.url ?? null;
        cache.set(serviceId, url);
        return url;
      })
      .catch(() => {
        cache.set(serviceId, null);
        return null;
      })
      .finally(() => {
        inflight.delete(serviceId);
      });
    inflight.set(serviceId, promise);
  }

  return inflight.get(serviceId)!;
}

export function useResolvedServiceCoverUrl(
  serviceId: string | null | undefined,
): {
  url: string | null;
  loading: boolean;
} {
  // Only track the async result — all other cases are derived synchronously
  const [asyncResult, setAsyncResult] = useState<{
    id: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!serviceId || cache.has(serviceId)) return;

    let cancelled = false;

    resolveUrl(serviceId).then((resolved) => {
      if (!cancelled) {
        setAsyncResult({ id: serviceId, url: resolved });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  // Derive url and loading synchronously — no setState needed for these paths
  if (!serviceId) return { url: null, loading: false };
  if (cache.has(serviceId)) return { url: cache.get(serviceId) ?? null, loading: false };

  return {
    url: asyncResult?.id === serviceId ? asyncResult.url : null,
    loading: asyncResult?.id !== serviceId,
  };
}
