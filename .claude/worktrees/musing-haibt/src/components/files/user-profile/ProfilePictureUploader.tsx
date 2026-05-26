"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { IFile } from "@/types/files.types";
import { useProfilePicture } from "@/hooks/files/useProfilePicture";
import { toast } from "sonner";

interface ProfilePictureUploaderProps {
  onUploadSuccess?: (file: IFile) => void;
  onDeleteSuccess?: () => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProfilePictureUploader({
  onUploadSuccess,
  onDeleteSuccess,
  className = "",
}: ProfilePictureUploaderProps) {
  const {
    record,
    optimizedUrl,
    loading,
    errors,
    uploadPicture,
    deleteMyCloudinaryPicture,
    clearError,
  } = useProfilePicture();

  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setPendingFile(file);
      clearError("mutation");
      setSuccessMessage(null);
    },
    [clearError],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    const result = await uploadPicture(pendingFile);
    if (result) {
      URL.revokeObjectURL(preview!);
      setPreview(null);
      setPendingFile(null);
      setSuccessMessage("Profile picture updated!");
      toast.success("Profile picture updated!");
      if (onUploadSuccess) {
        onUploadSuccess(result);
      } else {
        toast.error(`Failed to update profile picture.`);
      }
    }
  };

  const handleCancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingFile(null);
  };

  const handleDelete = async () => {
    const ok = await deleteMyCloudinaryPicture();
    if (ok) {
      toast.success("Profile picture removed.");
      setSuccessMessage("Profile picture removed.");
      onDeleteSuccess?.();
    }
  };

  const displayUrl = preview ?? optimizedUrl ?? record?.url ?? null;
  const hasExisting = !!(optimizedUrl ?? record?.url);
  const isPreviewing = !!preview;

  return (
    <div className={`max-w-110 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 pt-5">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight mb-0.5">
            Profile picture
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            JPG, PNG or WebP · Max 5 MB
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="relative w-30 h-30">
            {displayUrl ? (
              <>
                <Image
                  src={displayUrl}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                />
                {isPreviewing && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Preview
                  </span>
                )}
                {!isPreviewing && (
                  <button
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Change profile picture">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white dark:text-slate-900">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
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

          {/* Drop zone */}
          {!pendingFile && (
            <div
              className={`w-full border-[1.5px] border-dashed rounded-xl px-4 py-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-slate-900 dark:border-slate-300 bg-gray-50 dark:bg-slate-800"
                  : "border-gray-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
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

          {/* Messages */}
          {errors.mutation && (
            <div
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium 
                bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 
                border border-red-200 dark:border-red-900"
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

          {successMessage && (
            <div
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium 
                bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 
                border border-emerald-200 dark:border-emerald-900"
              role="status">
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col gap-2">
            {isPreviewing ? (
              <>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
                    bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 
                    dark:text-slate-900 text-white text-[13px] font-semibold 
                    transition-all active:scale-[0.98] disabled:opacity-50"
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
                  className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold 
                    text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 
                    hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white 
                    transition-colors active:scale-[0.98]"
                  onClick={handleCancelPreview}
                  disabled={loading.uploading}>
                  Cancel
                </button>
              </>
            ) : hasExisting ? (
              <>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
                    text-[13px] font-semibold text-gray-600 dark:text-slate-300 
                    border border-gray-200 dark:border-slate-700 
                    hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white 
                    transition-colors active:scale-[0.98]"
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
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Replace photo
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
                    text-[13px] font-semibold text-red-600 dark:text-red-500 
                    border border-red-100 dark:border-red-900/60 
                    hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors active:scale-[0.98]"
                  onClick={handleDelete}
                  disabled={loading.deleting}>
                  {loading.deleting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-red-200 dark:border-red-800 border-t-red-500 animate-spin" />
                      Removing…
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
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      Remove photo
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
                  bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 
                  dark:text-slate-900 text-white text-[13px] font-semibold 
                  transition-all active:scale-[0.98]"
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
