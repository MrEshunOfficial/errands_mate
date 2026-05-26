"use client";

import { useRef, useState, useCallback } from "react";
import { IFile } from "@/types/files.types";
import { useProfilePicture } from "@/hooks/files/useProfilePicture";
import Image from "next/image";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarChangerProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  editable?: boolean;
  onUploadSuccess?: (file: IFile) => void;
  className?: string;
}

// lg bumped from 72 → 96 for a more prominent profile avatar
const SIZE_PX: Record<AvatarSize, number> = { xs: 32, sm: 40, md: 52, lg: 96 };
const BADGE_PX: Record<AvatarSize, number> = { xs: 16, sm: 18, md: 22, lg: 30 };

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PALETTE = ["#C7B8F5", "#9FCCE8", "#A8D8C2", "#F5C6A0", "#F0A8C0"];

function nameToColor(name?: string): string {
  if (!name) return PALETTE[0];
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    PALETTE.length;
  return PALETTE[idx];
}

export function AvatarChanger({
  src,
  name,
  size = "md",
  editable = true,
  onUploadSuccess,
  className = "",
}: AvatarChangerProps) {
  const { uploadPicture, loading, errors, clearError } = useProfilePicture();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  // Self-managed hover: edit badge appears on avatar hover, not parent hover
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dim = SIZE_PX[size];
  const badgeDim = BADGE_PX[size];
  const displaySrc = localPreview ?? src;

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      clearError("mutation");
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setJustUploaded(false);
      const result = await uploadPicture(file);
      URL.revokeObjectURL(objectUrl);
      if (result) {
        setLocalPreview(null);
        setJustUploaded(true);
        onUploadSuccess?.(result);
        setTimeout(() => setJustUploaded(false), 2500);
      }
    },
    [uploadPicture, clearError, onUploadSuccess],
  );

  const ringClass = errors.mutation
    ? "ring-[2.5px] ring-red-500 dark:ring-red-600"
    : justUploaded
      ? "ring-[2.5px] ring-emerald-600 dark:ring-emerald-500"
      : loading.uploading
        ? "ring-[2.5px] ring-violet-400 dark:ring-violet-500"
        : "";

  return (
    <div
      className={`inline-block relative ${className}`}
      onMouseEnter={() => setIsAvatarHovered(true)}
      onMouseLeave={() => setIsAvatarHovered(false)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Fixed-size square container so the circle is never oval */}
      <div
        className="relative overflow-hidden"
        style={{ width: dim, height: dim, borderRadius: "50%", flexShrink: 0 }}>
        {displaySrc ? (
          <Image
            src={displaySrc}
            alt={name ?? "Avatar"}
            className={`object-cover block select-none ${ringClass} border border-white/80 dark:border-slate-800`}
            style={{
              borderRadius: "50%",
              width: dim,
              height: dim,
              minWidth: dim,
              minHeight: dim,
            }}
            width={dim}
            height={dim}
          />
        ) : (
          <div
            className={`flex items-center justify-center font-semibold select-none border border-white/80 dark:border-slate-700 ${ringClass}`}
            style={{
              width: dim,
              height: dim,
              borderRadius: "50%",
              background: nameToColor(name),
              fontSize: dim * 0.34,
            }}
            aria-label={name ?? "No profile picture"}>
            {getInitials(name)}
          </div>
        )}

        {/* Loading Overlay */}
        {loading.uploading && (
          <div
            className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm"
            style={{ borderRadius: "50%" }}
            aria-label="Uploading…">
            <div
              className="rounded-full border-[3px] border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-500 animate-spin"
              style={{ width: dim * 0.38, height: dim * 0.38 }}
            />
          </div>
        )}
      </div>

      {/* Error Badge — outside the overflow-hidden container */}
      {errors.mutation && !loading.uploading && (
        <div
          className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 dark:bg-red-600 rounded-full border-[1.5px] border-white dark:border-slate-900"
          aria-label="Upload failed"
        />
      )}

      {/* Success Badge — outside the overflow-hidden container */}
      {justUploaded && (
        <div
          className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-full border-[1.5px] border-white dark:border-slate-900 animate-bounce"
          aria-label="Uploaded"
        />
      )}

      {/* Edit badge — only visible when editable and avatar is hovered */}
      {editable && (isAvatarHovered || loading.uploading) && (
        <div className="absolute bottom-0 right-0">
          <button
            className="rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 shadow-md"
            style={{ width: badgeDim, height: badgeDim }}
            onClick={() => inputRef.current?.click()}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            disabled={loading.uploading}
            aria-label={`Change ${name ? `${name}'s` : "your"} profile picture`}>
            <svg
              width={badgeDim * 0.5}
              height={badgeDim * 0.5}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white dark:text-slate-900">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium whitespace-nowrap px-3 py-1.5 rounded-md shadow-lg pointer-events-none"
              aria-hidden="true">
              {loading.uploading
                ? "Uploading…"
                : errors.mutation
                  ? "Retry upload"
                  : "Change photo"}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
