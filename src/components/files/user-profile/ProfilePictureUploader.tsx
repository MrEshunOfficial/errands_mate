"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useProfilePicture } from "@/hooks/files/useProfilePicture";
import { toast } from "sonner";

export interface ProfilePictureUploaderProps {
  onUploadSuccess?: () => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProfilePictureUploader({
  onUploadSuccess,
  className = "",
}: ProfilePictureUploaderProps) {
  const { loading, errors, uploadPicture, clearError } = useProfilePicture();

  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Once upload succeeds, we store the preview URL here and switch to success UI
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG, or WebP).");
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setPendingFile(file);
      clearError("mutation");
    },
    [preview, clearError],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    const frozenUrl = preview; // capture before any state changes
    await uploadPicture(pendingFile);
    // Only show success if no error was set by the hook
    if (!errors.mutation) {
      setPreview(null);
      setPendingFile(null);
      setUploadedUrl(frozenUrl);
      toast.success("Profile picture updated!");
      onUploadSuccess?.();
    }
  };

  const handleCancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingFile(null);
  };

  // ─── SUCCESS STATE ────────────────────────────────────────────────────────
  // Entire component is replaced — no upload UI, no buttons, just confirmation.
  if (uploadedUrl) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 text-center">
          <div className="relative">
            <Image
              src={uploadedUrl}
              alt="Uploaded profile"
              width={72}
              height={72}
              className="w-18 h-18 rounded-full object-cover border-2 border-emerald-300 dark:border-emerald-700"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Photo uploaded successfully!
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              You can update it anytime from your profile settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── UPLOAD STATE ─────────────────────────────────────────────────────────
  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 pt-5">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight mb-0.5">
            Profile picture
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            JPG, PNG or WebP · Max 5 MB
          </p>
        </div>

        <div className="px-6 pb-6 pt-5 flex flex-col items-center gap-4">
          {/* Avatar preview or placeholder */}
          <div className="relative w-30 h-30">
            {preview ? (
              <>
                <Image
                  src={preview}
                  alt="Preview"
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                />
                <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Preview
                </span>
                {loading.uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <button
                className="w-30 h-30 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500 transition-colors hover:border-slate-900 dark:hover:border-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                onClick={() => inputRef.current?.click()}
                aria-label="Upload profile picture">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>

          {/* Pending file info */}
          {pendingFile && (
            <div className="w-full bg-gray-50 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-900 dark:text-slate-300 shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {pendingFile.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {formatBytes(pendingFile.size)}
                </p>
              </div>
            </div>
          )}

          {/* Drop zone — only when no file selected yet */}
          {!pendingFile && (
            <div
              className={`w-full border-[1.5px] border-dashed rounded-xl px-4 py-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-slate-900 dark:border-slate-300 bg-gray-50 dark:bg-slate-800"
                  : "border-gray-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drop image here or click to browse"
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-1.5 text-gray-400 dark:text-slate-500">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Click to browse
                </strong>{" "}
                or drag & drop
              </p>
            </div>
          )}

          {/* Error banner */}
          {errors.mutation && (
            <div
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
              role="alert">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.mutation}
            </div>
          )}

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2">
            {preview ? (
              <>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  onClick={handleUpload}
                  disabled={loading.uploading}>
                  {loading.uploading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      Upload this photo
                    </>
                  )}
                </button>
                <button
                  className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  onClick={handleCancelPreview}
                  disabled={loading.uploading}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-[13px] font-semibold transition-all active:scale-[0.98]"
                onClick={() => inputRef.current?.click()}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                Choose a photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
