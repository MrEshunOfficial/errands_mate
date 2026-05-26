"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Images,
  Trash2,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  X,
  Loader2,
  Upload,
} from "lucide-react";
import { useProviderGallery } from "@/hooks/files/useProviderGallery";
import { IFile } from "@/types/files.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMyProviderProfile } from "@/hooks/profiles/useProviderProfile";

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
  onFiles,
  uploading,
}: {
  onFiles: (files: File[]) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (images.length) onFiles(images);
  };

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-all",
        dragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/40 bg-muted/20",
        uploading && "pointer-events-none opacity-60",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}>
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-6 w-6 text-muted-foreground" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop images here"}
        </p>
        <p className="text-xs text-muted-foreground">
          or{" "}
          <span className="text-primary underline-offset-2 hover:underline">
            browse
          </span>{" "}
          · JPG, PNG, WebP · max 10 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(initialIndex, true);
  }, [api, initialIndex]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, api]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}>
      <div
        className="relative flex w-full max-w-5xl flex-col items-center gap-4 px-16"
        onClick={(e) => e.stopPropagation()}>
        <Button
          size="icon"
          variant="ghost"
          className="absolute -top-12 right-0 h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>

        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{ loop: true, startIndex: initialIndex }}>
          <CarouselContent>
            {images.map((file) => (
              <CarouselItem key={file._id}>
                <div className="flex items-center justify-center">
                  <Image
                    src={file.url}
                    alt={file.fileName}
                    width={1280}
                    height={800}
                    className="max-h-[78vh] w-auto rounded-2xl object-contain shadow-2xl"
                    priority
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-0 h-10 w-10 border-white/20 bg-black/50 text-white hover:bg-black/70 hover:text-white" />
          <CarouselNext className="right-0 h-10 w-10 border-white/20 bg-black/50 text-white hover:bg-black/70 hover:text-white" />
        </Carousel>

        <div className="flex w-full items-center justify-between rounded-xl bg-black/50 px-4 py-2.5 backdrop-blur-sm">
          <p className="truncate text-xs font-medium text-white/75">
            {images[current]?.fileName ?? ""}
          </p>
          <span className="shrink-0 pl-4 text-xs tabular-nums text-white/45">
            {current + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Item ─────────────────────────────────────────────────────────────

function GalleryItem({
  file,
  images,
  index,
  onRemove,
  removing,
}: {
  file: IFile;
  images: IFile[];
  index: number;
  onRemove: () => void;
  removing: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>
        <Image
          src={file.thumbnailUrl ?? file.url}
          alt={file.fileName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-500",
            hovered && "scale-105",
          )}
        />

        <div
          className={cn(
            "absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0",
          )}>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 backdrop-blur-sm"
            onClick={() => setLightboxOpen(true)}
            title="Expand image">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-end justify-between p-2.5 transition-all duration-200",
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
          )}>
          <p className="max-w-[70%] truncate text-[10px] font-medium text-white/80">
            {file.fileName}
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 backdrop-blur-sm"
                disabled={removing}>
                {removing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove image?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will archive the image and remove it from your gallery.
                  You can restore it later from your file history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          initialIndex={index}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          Your gallery is empty
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload images to showcase your work to potential clients.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderGalleryPage() {
  const { data: myProfile, loading: profileLoading } = useMyProviderProfile();
  const profileId = myProfile?._id ? String(myProfile._id) : undefined;

  const {
    galleryImages,
    isLoading,
    isUploading,
    fetchMyGallery,
    uploadGalleryImage,
    uploadMultipleGalleryImages,
    archiveGalleryImage,
  } = useProviderGallery();

  // Fetch via the auth-gated endpoint (returns the owner's own gallery)
  useEffect(() => {
    fetchMyGallery();
  }, [fetchMyGallery]);

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);

  const activeImages = galleryImages.filter((f) => f.status === "active");
  const count = activeImages.length;

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      if (files.length === 1) {
        const result = await uploadGalleryImage(files[0]);
        if (!result) {
          toast.error("Upload failed. Please try again.");
        } else {
          toast.success(`${files[0].name} uploaded`);
          setShowUpload(false);
        }
        return;
      }

      const result = await uploadMultipleGalleryImages(files);
      if (!result) {
        toast.error("Upload failed. Please try again.");
      } else {
        toast.success(
          `${result.files.length} image${result.files.length !== 1 ? "s" : ""} uploaded`,
        );
        setShowUpload(false);
      }
    },
    [uploadGalleryImage, uploadMultipleGalleryImages],
  );

  // ── Archive ─────────────────────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (fileId: string) => {
      if (!profileId) return;
      setRemovingIds((prev) => new Set(prev).add(fileId));
      try {
        const result = await archiveGalleryImage(profileId, fileId);
        if (result?.success) {
          toast.success("Image removed from gallery");
        } else {
          toast.error("Failed to remove image");
        }
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
    },
    [profileId, archiveGalleryImage],
  );

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <GallerySkeleton />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-auto hide-scrollbar mx-auto max-w-5xl space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Images className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight">
              Portfolio Gallery
            </h1>
            {count > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {count}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {myProfile?.businessName
              ? `Showcase images for ${myProfile.businessName}`
              : "Showcase your work to attract clients"}
          </p>
        </div>

        <Popover open={showUpload} onOpenChange={setShowUpload}>
          <PopoverTrigger asChild>
            <Button variant={showUpload ? "secondary" : "default"} size="sm">
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Add images
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium">Upload images</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP · max 10 MB each · multiple files OK
              </p>
            </div>
            <DropZone onFiles={handleFiles} uploading={isUploading} />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Gallery grid ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <GallerySkeleton />
      ) : count === 0 ? (
        <EmptyGallery />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {activeImages.map((file, index) => (
            <GalleryItem
              key={file._id}
              file={file}
              images={activeImages}
              index={index}
              onRemove={() => handleRemove(file._id)}
              removing={removingIds.has(file._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
