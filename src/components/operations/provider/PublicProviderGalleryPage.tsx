"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Images,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProviderGallery } from "@/hooks/files/useProviderGallery";
import { useProviderProfile } from "@/hooks/profiles/useProviderProfile";
import { IFile } from "@/types/files.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: IFile[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  const file = images[current];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <div
        className="relative flex w-full max-w-5xl flex-col items-center gap-4 px-4 sm:px-16"
        onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute -top-12 right-0 h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>

        {/* Image */}
        <div className="relative w-full flex items-center justify-center">
          <Image
            src={file.url}
            alt={file.fileName}
            width={1280}
            height={800}
            className="max-h-[78vh] w-auto rounded-2xl object-contain shadow-2xl"
            priority
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex w-full items-center justify-between rounded-xl bg-black/50 px-4 py-2.5 backdrop-blur-sm">
          <p className="truncate text-xs font-medium text-white/75">
            {file.fileName}
          </p>
          <span className="shrink-0 pl-4 text-xs tabular-nums text-white/45">
            {current + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyGallery() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30">
        <LayoutGrid className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground/70">
          No photos yet
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This provider hasn&apos;t uploaded any gallery images.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProviderGalleryPage() {
  const params = useParams<{ id: string }>();
  const providerId = params?.id ?? null;

  const { data: profile, loading: profileLoading } = useProviderProfile(
    providerId,
  );
  const { galleryImages, isLoading } = useProviderGallery(
    providerId ?? undefined,
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeImages = galleryImages.filter((f) => f.status === "active");
  const businessName =
    (profile as { businessName?: string } | null)?.businessName ?? null;

  const loading = profileLoading || isLoading;

  return (
    <div className="h-full overflow-auto hide-scrollbar">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Back link */}
        <Link
          href={providerId ? `/providers/${providerId}` : "/providers"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Images className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {profileLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : businessName ? (
                `${businessName} — Gallery`
              ) : (
                "Business Gallery"
              )}
            </h1>
            {!loading && activeImages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeImages.length} photo
                {activeImages.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <GallerySkeleton />
        ) : activeImages.length === 0 ? (
          <EmptyGallery />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activeImages.map((file, index) => (
              <button
                key={file._id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted",
                  "hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}>
                <Image
                  src={file.thumbnailUrl ?? file.url}
                  alt={file.fileName}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={activeImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
