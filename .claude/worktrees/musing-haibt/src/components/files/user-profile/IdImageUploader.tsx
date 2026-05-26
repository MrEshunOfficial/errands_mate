"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { IFile } from "@/types/files.types";
import { useIdImage } from "@/hooks/files/useIdImage";
import { toast } from "sonner";

interface IdImageUploaderProps {
  onUploadSuccess?: (files: IFile[]) => void;
  className?: string;
}

type SlotKey = "front" | "back";

interface SlotState {
  file: File | null;
  objectUrl: string | null;
  status: "idle" | "uploading" | "done" | "error";
  result?: IFile;
}

const INITIAL_SLOT: SlotState = { file: null, objectUrl: null, status: "idle" };

const SLOT_CONFIG: Record<
  SlotKey,
  { label: string; description: string; icon: React.ReactNode }
> = {
  front: {
    label: "Front side",
    description: "Photo & name side",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="8" cy="11" r="2.5" />
        <path d="M13 10h5M13 13h3" />
      </svg>
    ),
  },
  back: {
    label: "Back side",
    description: "Barcode & address side",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="6" y1="9" x2="6" y2="15" />
        <line x1="8" y1="9" x2="8" y2="15" />
        <line x1="11" y1="9" x2="11" y2="15" />
        <line x1="14" y1="9" x2="14" y2="15" />
        <line x1="17" y1="9" x2="17" y2="15" />
      </svg>
    ),
  },
};

export function IdImageUploader({
  onUploadSuccess,
  className = "",
}: IdImageUploaderProps) {
  const {
    images,
    loading,
    uploadBatch,
    deleteFromCloudinary,
    errors,
    clearError,
  } = useIdImage();

  const [slots, setSlots] = useState<Record<SlotKey, SlotState>>({
    front: INITIAL_SLOT,
    back: INITIAL_SLOT,
  });
  const [dragOver, setDragOver] = useState<SlotKey | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  type InputRef = React.RefObject<HTMLInputElement | null>;

  const refs: Record<SlotKey, InputRef> = {
    front: frontRef,
    back: backRef,
  };

  const setSlotFile = useCallback(
    (key: SlotKey, file: File) => {
      if (!file.type.startsWith("image/")) return;
      const prev = slots[key];
      if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      const objectUrl = URL.createObjectURL(file);
      setSlots((s) => ({ ...s, [key]: { file, objectUrl, status: "idle" } }));
      clearError("mutation");
      setSuccessMsg(null);
    },
    [slots, clearError],
  );

  const clearSlot = useCallback(
    (key: SlotKey) => {
      const prev = slots[key];
      if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      setSlots((s) => ({ ...s, [key]: INITIAL_SLOT }));
    },
    [slots],
  );

  const handleInputChange =
    (key: SlotKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSlotFile(key, file);
      e.target.value = "";
    };

  const handleDrop = (key: SlotKey) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) setSlotFile(key, file);
  };

  const handleUpload = async () => {
    const keys: SlotKey[] = ["front", "back"];
    const pendingKeys = keys.filter(
      (k) => slots[k].file && slots[k].status === "idle",
    );
    if (!pendingKeys.length) return;

    setSlots((s) => {
      const next = { ...s };
      pendingKeys.forEach((k) => {
        next[k] = { ...next[k], status: "uploading" };
      });
      return next;
    });

    const files = pendingKeys.map((k) => slots[k].file!);
    const results = await uploadBatch(files);

    setSlots((s) => {
      const next = { ...s };
      pendingKeys.forEach((k, i) => {
        const uploadedFile = results?.[i];
        if (uploadedFile) {
          next[k] = { ...next[k], status: "done", result: uploadedFile };
          if (next[k].objectUrl) URL.revokeObjectURL(next[k].objectUrl!);
        } else {
          next[k] = { ...next[k], status: "error" };
        }
      });
      return next;
    });

    if (results?.length) {
      setSuccessMsg(
        `${results.length} image${results.length > 1 ? "s" : ""} uploaded successfully`,
      );
      toast.success(`Images uploaded successfully`);
      onUploadSuccess?.(results); // call if provided, silently skip if not
    } else {
      toast.error(`Failed to upload images.`); // only fires on actual failure
    }
  };

  const pendingCount = (["front", "back"] as SlotKey[]).filter(
    (k) => slots[k].file && slots[k].status === "idle",
  ).length;
  const isUploading = (["front", "back"] as SlotKey[]).some(
    (k) => slots[k].status === "uploading",
  );

  return (
    <div className={`max-w-130 ${className}`}>
      <input
        ref={frontRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange("front")}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={backRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange("back")}
        className="hidden"
        aria-hidden="true"
      />

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 pt-5">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight mb-0.5">
            Government ID
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Upload both sides of your ID · JPG, PNG, WebP
          </p>
        </div>

        <div className="px-6 pb-6 pt-5 flex flex-col gap-4">
          {/* Front / Back slots */}
          <div className="grid grid-cols-2 gap-3">
            {(["front", "back"] as SlotKey[]).map((key) => {
              const config = SLOT_CONFIG[key];
              const slot = slots[key];
              const isOver = dragOver === key;
              const isDone = slot.status === "done";
              const isError = slot.status === "error";
              const isUp = slot.status === "uploading";

              return (
                <div key={key}>
                  <div
                    className={`relative aspect-3/2 rounded-xl overflow-hidden border-[1.5px] border-dashed cursor-pointer transition-all ${
                      slot.objectUrl
                        ? "border-transparent"
                        : isOver
                          ? "border-slate-900 dark:border-slate-300 bg-gray-50 dark:bg-slate-800"
                          : "border-gray-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(key);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={handleDrop(key)}
                    onClick={() =>
                      !slot.objectUrl && refs[key].current?.click()
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Upload ${config.label}`}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !slot.objectUrl &&
                      refs[key].current?.click()
                    }>
                    {slot.objectUrl ? (
                      <>
                        <Image
                          src={slot.objectUrl}
                          alt={config.label}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />

                        {/* Uploading overlay */}
                        {isUp && (
                          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full border-[3px] border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-500 animate-spin" />
                          </div>
                        )}

                        {/* Done overlay */}
                        {isDone && (
                          <div className="absolute inset-0 bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {isError && (
                          <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Replace / Remove buttons */}
                        {!isUp && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <button
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 transition-colors flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                refs[key].current?.click();
                              }}
                              aria-label={`Replace ${config.label}`}>
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white dark:text-slate-900">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                              </svg>
                            </button>
                            {!isDone && (
                              <button
                                className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSlot(key);
                                }}
                                aria-label={`Remove ${config.label}`}>
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-slate-500 p-3">
                        {config.icon}
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {config.label}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slot label with status */}
                  <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
                    {isDone ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : isError ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                    ) : slot.file ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="3"
                          strokeLinecap="round">
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                        </svg>
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-slate-700 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      {isDone
                        ? "Uploaded"
                        : isError
                          ? "Failed — retry"
                          : slot.file
                            ? "Ready to upload"
                            : "Not added"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 dark:bg-violet-500 rounded-full animate-pulse w-1/2" />
            </div>
          )}

          {/* Messages */}
          {errors.mutation && (
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium 
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

          {successMsg && (
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium 
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
              {successMsg}
            </div>
          )}

          {/* Upload button */}
          {pendingCount > 0 && (
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
                bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 
                dark:text-slate-900 text-white text-[13px] font-semibold 
                transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={handleUpload}
              disabled={isUploading}>
              {isUploading ? (
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
                  Upload{" "}
                  {pendingCount === 2 ? "both sides" : `${pendingCount} side`}
                </>
              )}
            </button>
          )}

          {/* Previously uploaded images */}
          {images.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                Previously uploaded
              </p>
              <div className="grid grid-cols-2 gap-3">
                {images.map((img) => (
                  <div
                    key={img._id}
                    className="group relative aspect-3/2 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <Image
                      src={img.url}
                      alt={img.fileName}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                    <button
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      onClick={() => deleteFromCloudinary(img._id)}
                      disabled={loading.deleting}
                      aria-label={`Delete ${img.fileName}`}>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white truncate">
                        {img.fileName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
