"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Zap,
  CheckCircle,
  Loader2,
  Briefcase,
  AlignLeft,
  Tag,
  AlertCircle,
  Flame,
  Navigation,
  ChevronDown,
  Paperclip,
  BookmarkPlus,
  List,
  PlusCircle,
  Router,
  X,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useActiveCategories,
  useSuggestCategory,
} from "@/hooks/services/categories/useServiceCategory";
import { CategoryCover, CategorySuggestion } from "@/types/services/categories/service.category.types";
import { useCreateTask, useTriggerMatching, useUpdateTask } from "@/hooks/tasks/useTasks";
import { useTaskAttachment } from "@/hooks/files/useTaskAttachment";
import { useClientPreference } from "@/hooks/profiles/useClientPreference";
import { useLocationForm } from "@/hooks/profiles/useLocationForm";
import { LocationLabel } from "@/types/location.types";
import { Category } from "@/types/services/categories/service.category.types";
import {
  TaskPriority,
  ProviderMatchResult,
  CreateTaskRequestBody,
  TaskLocationInput,
} from "@/types/task.types";
import {
  EnrichedMatch,
  MatchedProvidersDrawer,
  fetchProviderProfile,
} from "./forms/MatchedProvidersDrawer";
import { AttachmentUploader } from "@/components/files/AttachmentUploader";
import { LocationFormFields } from "@/components/shared/location";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostSubmitPhase = "idle" | "asking" | "attaching" | "done";

type MatchingStrategy = "intelligent" | "location-only";

/**
 * Local draft state — separate from CreateTaskRequestBody so the form
 * can hold partial / UI-only fields before the payload is assembled.
 * Location text fields (ghanaPostGPS, nearbyLandmark) and GPS coordinates
 * are owned by useLocationForm, not this draft.
 */
interface TaskDraft {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  matchingStrategy: MatchingStrategy;
  /** "existing" = pick from saved addresses; "new" = enter inline */
  locationMode: "existing" | "new";
  /** _id of the saved Location when locationMode === "existing" */
  existingLocationId: string;
  /** Whether to persist the new address to the client's address book */
  saveNewLocation: boolean;
  newLocationLabel: LocationLabel;
  newLocationCustomLabel: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeMatchedProviders(matchRes: {
  matchedProviders?: ProviderMatchResult[];
  task?: { matchedProviders?: ProviderMatchResult[] };
}): ProviderMatchResult[] {
  return (
    matchRes.matchedProviders?.length
      ? matchRes.matchedProviders
      : (matchRes.task?.matchedProviders ?? [])
  ).map((p) => {
    const providerId =
      typeof p.providerId === "string"
        ? p.providerId
        : ((p.providerId as unknown as { $oid?: string }).$oid ??
          String(p.providerId));
    return {
      ...p,
      providerId,
      matchedServices: (p.matchedServices ?? []).map((s) =>
        typeof s === "string"
          ? s
          : ((s as { $oid?: string }).$oid ?? String(s)),
      ),
    };
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES: {
  value: TaskPriority;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  { value: TaskPriority.LOW, label: "Low", icon: "⬇", desc: "Flexible timing" },
  {
    value: TaskPriority.MEDIUM,
    label: "Medium",
    icon: "➡",
    desc: "Within a few days",
  },
  {
    value: TaskPriority.HIGH,
    label: "High",
    icon: "⬆",
    desc: "Soon as possible",
  },
  {
    value: TaskPriority.URGENT,
    label: "Urgent",
    icon: "🔥",
    desc: "Today or tomorrow",
  },
];

const STEPS = ["Details", "Location"];

const EMPTY_DRAFT: TaskDraft = {
  title: "",
  description: "",
  category: "",
  priority: TaskPriority.MEDIUM,
  matchingStrategy: "intelligent",
  locationMode: "new",
  existingLocationId: "",
  saveNewLocation: false,
  newLocationLabel: LocationLabel.HOME,
  newLocationCustomLabel: "",
};

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < current
                  ? "bg-amber-500 text-white"
                  : i === current
                    ? "bg-stone-900 text-white ring-4 ring-stone-900/10 dark:bg-amber-500 dark:ring-amber-400/20"
                    : "bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
              }`}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                i === current
                  ? "text-stone-900 font-semibold dark:text-stone-50"
                  : "text-stone-400 dark:text-stone-500"
              }`}>
              {label}
            </span>
          </div>
          {i < total - 1 && (
            <div
              className={`h-px w-12 mx-1 mb-4 transition-colors duration-500 ${
                i < current ? "bg-amber-400" : "bg-stone-200 dark:bg-stone-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2">
      <Icon size={12} />
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-500 transition-all ${className}`}
    />
  );
}

// ─── Matching Status Pill ─────────────────────────────────────────────────────

function MatchingStatusPill({
  matching,
  count,
  proximityOnly,
}: {
  matching: boolean;
  count: number;
  proximityOnly: boolean;
}) {
  if (matching) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-2.5 py-1 w-fit mx-auto">
        <Loader2 size={10} className="animate-spin" />
        Finding nearby providers…
      </div>
    );
  }
  if (count > 0 && proximityOnly) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-full px-2.5 py-1 w-fit mx-auto">
        <Navigation size={10} />
        {count} nearby provider{count !== 1 ? "s" : ""}
      </div>
    );
  }
  if (count > 0) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-full px-2.5 py-1 w-fit mx-auto">
        <CheckCircle size={10} />
        {count} provider{count !== 1 ? "s" : ""} matched
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-full px-2.5 py-1 w-fit mx-auto">
      <Navigation size={10} />
      Task is floating — providers will respond
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function PostTaskForm() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requestingId, setRequestId] = useState<string | null>(null);
  const [enrichedProviders, setEnrichedProviders] = useState<EnrichedMatch[]>(
    [],
  );
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [postSubmitPhase, setPostSubmitPhase] =
    useState<PostSubmitPhase>("idle");
  const [matchingSummary, setMatchingSummary] =
    useState<Parameters<typeof MatchedProvidersDrawer>[0]["summary"]>(
      undefined,
    );
  const [postedTaskId, setPostedTaskId] = useState<string | null>(null);

  // ── Location state ───────────────────────────────────────────────────────────
  // autoRequestGps captures the browser fix on mount so coordinates are often
  // ready by the time the user reaches step 1. Server enrichment needs them to
  // resolve region/city/locality from the bare Ghana Post GPS code.
  const locationForm = useLocationForm(undefined, { autoRequestGps: true });

  const set = useCallback(
    <K extends keyof TaskDraft>(key: K) =>
      (val: TaskDraft[K]) =>
        setDraft((d) => ({ ...d, [key]: val })),
    [],
  );

  // ── Task hooks ───────────────────────────────────────────────────────────────

  const {
    mutate: createTask,
    loading: creating,
    error: createError,
    reset: resetCreate,
  } = useCreateTask();

  const { mutate: triggerMatching, loading: matching } = useTriggerMatching();

  const { mutate: updateTask } = useUpdateTask();

  const [editSaving, setEditSaving] = useState(false);

  // ── File attachment hook ─────────────────────────────────────────────────────
  const {
    attachments,
    isLoading: attachmentsLoading,
    isUploading,
    error: attachmentError,
    uploadAttachment,
    uploadMultipleAttachments,
    deleteCloudinaryAttachment,
  } = useTaskAttachment(postedTaskId ?? undefined);

  // ── Saved locations ──────────────────────────────────────────────────────────
  const {
    locations: rawSavedLocations,
    isLoadingLocations,
    defaultLocation,
    saveAddress,
  } = useClientPreference();
  const savedLocations = Array.isArray(rawSavedLocations)
    ? rawSavedLocations
    : [];

  // ── Categories ───────────────────────────────────────────────────────────────
  const {
    data: categoryData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useActiveCategories();

  const categories = (categoryData ?? []).map((c: Category) => {
    const coverObj =
      c.catCoverId && typeof c.catCoverId === "object"
        ? (c.catCoverId as CategoryCover)
        : null;
    return {
      id: c._id,
      label: c.catName,
      icon: (c as Category & { icon?: string }).icon ?? "📋",
      cover: coverObj?.thumbnailUrl ?? coverObj?.url ?? null,
    };
  });

  // ── Category suggestions ─────────────────────────────────────────────────────
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const { data: suggestData, isLoading: suggestLoading, isFetched: suggestFetched } = useSuggestCategory(draft.title);
  const visibleSuggestions: CategorySuggestion[] = (suggestData ?? []).filter(
    (s) => !dismissedSuggestions.has(s._id),
  );

  // ── Validation ───────────────────────────────────────────────────────────────
  const stepValid = [
    draft.title.trim().length >= 3, // step 0 — Details
    draft.locationMode === "existing"
      ? !!draft.existingLocationId
      : locationForm.isValid, // step 1 — Location
    true,
  ];

  // ── Provider enrichment ──────────────────────────────────────────────────────
  function enrichProviders(rawProviders: ProviderMatchResult[]) {
    if (!rawProviders.length) {
      setEnrichedProviders([]);
      return;
    }

    setEnrichedProviders(
      rawProviders.map((p) => ({ ...p, profileLoading: true })),
    );

    rawProviders.forEach((raw, index) => {
      fetchProviderProfile(raw.providerId)
        .then((profile) => {
          setEnrichedProviders((prev) => {
            const next = [...prev];
            if (next[index]) {
              next[index] = {
                ...next[index],
                profile: profile ?? undefined,
                profileLoading: false,
              };
            }
            return next;
          });
        })
        .catch(() => {
          setEnrichedProviders((prev) => {
            const next = [...prev];
            if (next[index])
              next[index] = { ...next[index], profileLoading: false };
            return next;
          });
        });
    });
  }

  // ── Open the matched-providers drawer ────────────────────────────────────────
  const finishInterstitial = useCallback(() => {
    setPostSubmitPhase("done");
    setDrawerOpen(true);
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const locationPayload = locationForm.toPayload();
    const coords = locationForm.coordinates;

    // Whether the client opted to persist this new address to their address book.
    // We do NOT use the task endpoint's `saveForLater` flag — it stores a bare,
    // un-enriched record. Instead we call the dedicated /client/locations endpoint
    // below, which runs OSM enrichment (region/city/district/locality), matching
    // the flow already used by ProviderRequestPage.
    const wantsSaveLocation =
      draft.locationMode !== "existing" && draft.saveNewLocation;

    const location: TaskLocationInput =
      draft.locationMode === "existing" && draft.existingLocationId
        ? { existingLocationId: draft.existingLocationId }
        : { newLocation: { ...locationPayload } };

    const payload: CreateTaskRequestBody = {
      title: draft.title,
      description: draft.description,
      ...(draft.category && { category: draft.category }),
      location,
      matchingStrategy: draft.matchingStrategy,
      ...(coords && {
        gpsLocationAtPosting: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? 0,
          capturedAt: new Date().toISOString(),
        },
      }),
    };

    const toastId = toast.loading("Posting your task…");
    const result = await createTask(payload);

    if (!result?.task) {
      toast.dismiss(toastId);
      toast.error(createError ?? "Failed to post task. Please try again.");
      return;
    }

    const { task } = result;

    // Persist the address book entry via the enriching endpoint (OSM-backed).
    if (wantsSaveLocation) {
      void saveAddress({
        label: draft.newLocationLabel,
        customLabel:
          draft.newLocationLabel === LocationLabel.OTHER
            ? draft.newLocationCustomLabel.trim() || undefined
            : undefined,
        ghanaPostGPS: locationPayload.ghanaPostGPS,
        nearbyLandmark: locationPayload.nearbyLandmark,
        liveCoordinates: coords
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : undefined,
      }).catch(() => {});
    }

    resetCreate();
    setPostedTaskId(task._id);
    toast.dismiss(toastId);
    toast.success("Task posted! Finding nearby providers…");

    setEnrichedProviders([]);
    setMatchingSummary(undefined);
    setPostSubmitPhase("asking");

    // Kick off matching in the background
    const matchRes = await triggerMatching({
      taskId: task._id,
      strategy: draft.matchingStrategy,
    });

    if (!matchRes) {
      toast.warning(
        "Matching ran into an issue, but your task is live. Providers can still find it.",
      );
      return;
    }

    const rawProviders = normalizeMatchedProviders(matchRes);

    setMatchingSummary(matchRes.matchingSummary);

    const matchedCount = rawProviders.length;
    const isProximityOnly =
      matchRes.matchingSummary?.matchOutcome === "proximity_only";
    if (matchedCount === 0) {
      toast.info("No providers matched right now — your task is now floating.");
    } else if (isProximityOnly) {
      toast.info(
        `No exact match — your task is floating to ${matchedCount} nearby provider${matchedCount !== 1 ? "s" : ""}.`,
      );
    } else {
      toast.success(
        `${matchedCount} provider${matchedCount !== 1 ? "s" : ""} matched!`,
      );
    }

    enrichProviders(rawProviders);
  }
  const router = useRouter();
  // ── Request a provider ───────────────────────────────────────────────────────
  async function handleRequest(providerId: string) {
    if (!postedTaskId) return;
    setRequestId(providerId);
    router.push(`/requests/provider/${providerId}?taskId=${postedTaskId}&source=task_match`);
  }

  // ── Refresh matched providers ─────────────────────────────────────────────────
  async function handleRefresh() {
    if (!postedTaskId) return;
    const matchRes = await triggerMatching({
      taskId: postedTaskId,
      strategy: draft.matchingStrategy,
    });
    if (!matchRes) {
      toast.warning("Couldn't refresh providers. Please try again.");
      return;
    }
    const rawProviders = normalizeMatchedProviders(matchRes);
    setMatchingSummary(matchRes.matchingSummary);
    enrichProviders(rawProviders);
    const count = rawProviders.length;
    toast.success(
      count === 0
        ? "No providers matched right now."
        : `Refreshed — ${count} provider${count !== 1 ? "s" : ""} found.`,
    );
  }

  // ── Edit task and repost ──────────────────────────────────────────────────────
  async function handleEditTask(data: { title: string; description: string; category?: string }) {
    if (!postedTaskId) return;
    setEditSaving(true);
    try {
      const updateRes = await updateTask({
        taskId: postedTaskId,
        body: { title: data.title, description: data.description, category: data.category },
      });
      if (!updateRes) {
        toast.error("Failed to update task. Please try again.");
        return;
      }
      setDraft((d) => ({ ...d, title: data.title, description: data.description, category: data.category ?? d.category }));
      toast.success("Task updated! Re-matching providers…");

      const matchRes = await triggerMatching({
        taskId: postedTaskId,
        strategy: draft.matchingStrategy,
      });
      if (!matchRes) {
        toast.warning("Task updated, but re-matching failed.");
        return;
      }
      const rawProviders = normalizeMatchedProviders(matchRes);
      setMatchingSummary(matchRes.matchingSummary);
      enrichProviders(rawProviders);
      const count = rawProviders.length;
      const isProximityOnly =
        matchRes.matchingSummary?.matchOutcome === "proximity_only";
      if (count === 0) toast.info("No providers matched with the updated details.");
      else if (isProximityOnly)
        toast.info(
          `No exact match — your task is floating to ${count} nearby provider${count !== 1 ? "s" : ""}.`,
        );
      else toast.success(`${count} provider${count !== 1 ? "s" : ""} matched!`);
    } finally {
      setEditSaving(false);
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function handleReset() {
    setDraft(EMPTY_DRAFT);
    locationForm.reset();
    setStep(0);
    setPostedTaskId(null);
    setPostSubmitPhase("idle");
    setEnrichedProviders([]);
    setMatchingSummary(undefined);
    setDrawerOpen(false);
    setDismissedSuggestions(new Set());
  }

  // ── Step content ─────────────────────────────────────────────────────────────
  const steps = [
    // ── Step 0: Details ───────────────────────────────────────────────────────
    <div key="details" className="space-y-5">
      <div>
        <FieldLabel icon={Briefcase}>Task Title</FieldLabel>
        <TextInput
          value={draft.title}
          onChange={set("title")}
          placeholder="e.g. Fix leaking bathroom pipe"
        />
      </div>

      <div>
        <FieldLabel icon={AlignLeft}>Brief description</FieldLabel>
        <textarea
          value={draft.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="Details that help providers understand the job…"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-500 transition-all resize-none"
        />
      </div>

      <div>
        <FieldLabel icon={Tag}>Select Category</FieldLabel>

        {!draft.category && suggestLoading && draft.title.trim().length >= 3 && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-stone-400 dark:text-stone-500">
            <Loader2 size={11} className="animate-spin" />
            Finding category suggestions…
          </div>
        )}

        {!draft.category && suggestFetched && !suggestLoading && draft.title.trim().length >= 3 && visibleSuggestions.length === 0 && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertCircle size={11} />
            No category found for this title. Please select one manually.
          </div>
        )}

        {!draft.category && visibleSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
              Suggested:
            </span>
            {visibleSuggestions.map((s) => (
              <div
                key={s._id}
                className="flex items-center rounded-full border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => set("category")(s._id)}
                  className="pl-2.5 pr-1.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors">
                  {s.catName}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDismissedSuggestions((prev) => new Set([...prev, s._id]))
                  }
                  className="pr-2 pl-0.5 py-1 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {categoriesLoading && (
          <div className="flex items-center gap-2 py-3 text-xs text-stone-400 dark:text-stone-500">
            <Loader2 size={13} className="animate-spin" />
            Loading categories…
          </div>
        )}

        {categoriesError && !categoriesLoading && (
          <div className="flex items-center gap-2 py-2 text-xs text-red-500 dark:text-red-400">
            <AlertCircle size={13} />
            Failed to load categories.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!categoriesLoading && !categoriesError && (
          <Popover
            open={categoryPopoverOpen}
            onOpenChange={setCategoryPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-expanded={categoryPopoverOpen}
                aria-haspopup="listbox"
                aria-controls="category-listbox"
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                  draft.category
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    : "border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-300 dark:hover:border-stone-600"
                }`}>
                <span className="flex items-center gap-2">
                  {draft.category ? (
                    <>
                      {(() => {
                        const sel = categories.find(
                          (c) => c.id.toString() === draft.category,
                        );
                        return sel?.cover ? (
                          <img
                            src={sel.cover}
                            alt={sel.label}
                            className="w-6 h-6 rounded object-cover shrink-0"
                          />
                        ) : (
                          <span className="text-base leading-none">
                            {sel?.icon}
                          </span>
                        );
                      })()}
                      <span className="font-medium text-stone-800 dark:text-stone-100">
                        {
                          categories.find(
                            (c) => c.id.toString() === draft.category,
                          )?.label
                        }
                      </span>
                    </>
                  ) : (
                    "Choose a category…"
                  )}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-stone-400 transition-transform duration-200 ${
                    categoryPopoverOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="p-0 w-[--radix-popover-trigger-width]"
              align="start"
              sideOffset={6}>
              <Command>
                <CommandInput
                  placeholder="Search categories…"
                  className="h-9 text-sm"
                />
                <CommandList className="max-h-52">
                  <CommandEmpty className="py-4 text-xs text-center text-stone-400">
                    No categories found.
                  </CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat.id.toString()}
                        value={cat.label}
                        onSelect={() => {
                          set("category")(cat.id.toString());
                          setCategoryPopoverOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                        {cat.cover ? (
                          <img
                            src={cat.cover}
                            alt={cat.label}
                            className="w-6 h-6 rounded object-cover shrink-0"
                          />
                        ) : (
                          <span className="text-base leading-none w-6 text-center shrink-0">
                            {cat.icon}
                          </span>
                        )}
                        <span className="text-sm">{cat.label}</span>
                        {draft.category === cat.id.toString() && (
                          <CheckCircle
                            size={13}
                            className="ml-auto text-amber-500 shrink-0"
                          />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>,

    // ── Step 1: Location ──────────────────────────────────────────────────────
    <div key="location" className="space-y-5">
      <div>
        <FieldLabel icon={Flame}>Priority</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set("priority")(p.value)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                draft.priority === p.value
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
              }`}>
              <span className="text-lg leading-none">{p.icon}</span>
              <div>
                <p
                  className={`text-sm font-semibold ${draft.priority === p.value ? "text-amber-700 dark:text-amber-400" : "text-stone-700 dark:text-stone-200"}`}>
                  {p.label}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {p.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Location mode toggle */}
      <div>
        <FieldLabel icon={MapPin}>Task Location</FieldLabel>
        <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => set("locationMode")("existing")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors duration-200 ${
              draft.locationMode === "existing"
                ? "bg-stone-900 dark:bg-amber-500 text-white"
                : "bg-transparent text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}>
            <List size={12} />
            Saved address
          </button>
          <button
            type="button"
            onClick={() => set("locationMode")("new")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors duration-200 ${
              draft.locationMode === "new"
                ? "bg-stone-900 dark:bg-amber-500 text-white"
                : "bg-transparent text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}>
            <PlusCircle size={12} />
            New address
          </button>
        </div>
      </div>

      {/* ── Existing location picker ─────────────────────────────────────── */}
      {draft.locationMode === "existing" && (
        <div>
          {isLoadingLocations ? (
            <div className="flex items-center gap-2 py-3 text-xs text-stone-400 dark:text-stone-500">
              <Loader2 size={13} className="animate-spin" />
              Loading saved addresses…
            </div>
          ) : savedLocations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-700 p-4 text-center">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No saved addresses yet.
              </p>
              <button
                type="button"
                onClick={() => set("locationMode")("new")}
                className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                Enter a new address instead
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedLocations.map((loc) => {
                const selected =
                  draft.existingLocationId === loc._id.toString();
                const displayLabel =
                  loc.label === LocationLabel.OTHER && loc.customLabel
                    ? loc.customLabel
                    : loc.label;
                return (
                  <button
                    key={loc._id.toString()}
                    type="button"
                    onClick={() =>
                      set("existingLocationId")(loc._id.toString())
                    }
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                      selected
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                    }`}>
                    <MapPin
                      size={14}
                      className={`mt-0.5 shrink-0 ${selected ? "text-amber-500" : "text-stone-400"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold ${selected ? "text-amber-700 dark:text-amber-400" : "text-stone-700 dark:text-stone-200"}`}>
                        {displayLabel}
                        {loc.isDefault && (
                          <span className="ml-1.5 text-[10px] font-normal text-stone-400">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 truncate">
                        {loc.address.ghanaPostGPS}
                        {loc.address.nearbyLandmark &&
                          ` · ${loc.address.nearbyLandmark}`}
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle
                        size={14}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New address fields ───────────────────────────────────────────── */}
      {draft.locationMode === "new" && (
        <>
          <LocationFormFields
            ghanaPostGPS={locationForm.ghanaPostGPS}
            nearbyLandmark={locationForm.nearbyLandmark}
            coordinates={locationForm.coordinates}
            gpsStatus={locationForm.gpsStatus}
            gpsCodeInvalid={locationForm.gpsCodeInvalid}
            onGhanaPostGPSChange={locationForm.setGhanaPostGPS}
            onNearbyLandmarkChange={locationForm.setNearbyLandmark}
            onCoordinatesChange={locationForm.setCoordinates}
            onRequestGps={locationForm.requestGps}
            coordinatesIdleDescription="Sharing your location helps match you with providers near the task site."
          />

          {/* Save for later */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.saveNewLocation}
                onChange={(e) => set("saveNewLocation")(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200">
                <BookmarkPlus size={13} className="text-amber-500" />
                Save this address to my address book
              </div>
            </label>

            {draft.saveNewLocation && (
              <div className="space-y-2 pl-6">
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Label this address
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      LocationLabel.HOME,
                      LocationLabel.WORK,
                      LocationLabel.SCHOOL,
                      LocationLabel.OTHER,
                    ] as const
                  ).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => set("newLocationLabel")(lbl)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors duration-150 ${
                        draft.newLocationLabel === lbl
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300"
                      }`}>
                      {lbl.charAt(0) + lbl.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                {draft.newLocationLabel === LocationLabel.OTHER && (
                  <TextInput
                    value={draft.newLocationCustomLabel}
                    onChange={set("newLocationCustomLabel")}
                    placeholder="e.g. Mum's House"
                    className="text-xs"
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>,
  ];

  // ── Derived values ────────────────────────────────────────────────────────────
  const matchedCount = enrichedProviders.length;
  const proximityOnly = matchingSummary?.matchOutcome === "proximity_only";
  // Content-relevant matches only; proximity-only providers are nearby, not matched.
  const hasMatches = matchedCount > 0 && !proximityOnly;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl h-full">
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* ── Page header ─────────────────────────────────────────────────── */}
          <div className="mb-6 fade-up">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">
              Post a Task
            </p>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
              What do you need done?
            </h1>
          </div>

          {/* ── Post-submit interstitial ─────────────────────────────────────── */}
          {postSubmitPhase !== "idle" ? (
            <div className="rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 fade-up bg-white dark:bg-stone-900">
              {/* ── Asking phase ─────────────────────────────────────────── */}
              {postSubmitPhase === "asking" && (
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 flex items-center justify-center">
                    <CheckCircle className="text-amber-500" size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      Task posted successfully!
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                      Want to attach a file to help providers understand the
                      job? (photo, PDF, etc.)
                    </p>
                  </div>

                  <MatchingStatusPill
                    matching={matching}
                    count={matchedCount}
                    proximityOnly={proximityOnly}
                  />

                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setPostSubmitPhase("attaching")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-700 text-white text-sm font-semibold hover:bg-amber-600 dark:hover:bg-amber-600 transition-all duration-200">
                      <Paperclip size={14} />
                      Yes, attach a file
                    </button>
                    <button
                      type="button"
                      onClick={finishInterstitial}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-semibold hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200">
                      No, skip
                    </button>
                  </div>
                </div>
              )}

              {/* ── Attaching phase ──────────────────────────────────────── */}
              {postSubmitPhase === "attaching" && postedTaskId && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Paperclip className="text-amber-500 shrink-0" size={14} />
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                      Attach files to your task
                    </p>
                  </div>
                  <AttachmentUploader
                    taskId={postedTaskId}
                    attachments={attachments}
                    isLoading={attachmentsLoading}
                    isUploading={isUploading}
                    error={attachmentError}
                    onUpload={async (tid, file) => {
                      const res = await uploadAttachment(tid, file);
                      if (res) {
                        toast.success("File attached!");
                        finishInterstitial();
                      }
                      return res;
                    }}
                    onUploadMultiple={async (tid, files) => {
                      const res = await uploadMultipleAttachments(tid, files);
                      if (res) {
                        toast.success(`${files.length} file(s) attached!`);
                        finishInterstitial();
                      }
                      return res;
                    }}
                    onDelete={async (tid, fileId) => {
                      const ok = await deleteCloudinaryAttachment(tid, fileId);
                      if (ok) toast.success("Attachment removed.");
                      return ok;
                    }}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                    <MatchingStatusPill
                      matching={matching}
                      count={matchedCount}
                      proximityOnly={proximityOnly}
                    />
                    <button
                      type="button"
                      onClick={finishInterstitial}
                      className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* ── Done phase ───────────────────────────────────────────── */}
              {postSubmitPhase === "done" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      hasMatches || matching
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                    }`}>
                    {hasMatches || matching ? (
                      <CheckCircle className="text-emerald-500" size={22} />
                    ) : (
                      <Navigation className="text-amber-500" size={22} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      {matching
                        ? "Searching for providers…"
                        : hasMatches
                          ? "All done!"
                          : "Your task is now floating"}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-xs">
                      {matching
                        ? "We're still looking — results will appear in the panel."
                        : hasMatches
                          ? `${matchedCount} provider${matchedCount !== 1 ? "s" : ""} found. Check the panel to request one.`
                          : proximityOnly && matchedCount > 0
                            ? `No exact match, but your task is visible to ${matchedCount} nearby provider${matchedCount !== 1 ? "s" : ""} who can express interest.`
                            : "No providers matched right now, but your task is live. Nearby providers will see it and can express interest."}
                    </p>
                  </div>

                  {!drawerOpen && (
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                      <ChevronRight size={12} />
                      {proximityOnly ? "View nearby providers" : "View matched providers"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-1 text-xs text-stone-400 dark:text-stone-500 underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                    Post another task
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Multi-step form ──────────────────────────────────────────── */
            <div className="rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 fade-up">
              <StepIndicator
                current={step}
                total={STEPS.length}
                labels={STEPS}
              />

              <div
                key={step}
                className="fade-up max-h-100 overflow-auto p-2 border rounded-md hide-scrollbar">
                {steps[step]}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-0 disabled:pointer-events-none transition-all">
                  <ChevronLeft size={16} />
                  Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!stepValid[step]}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-700 text-white text-sm font-semibold hover:bg-amber-600 dark:hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={creating || matching}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-amber-200">
                    {creating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Posting…
                      </>
                    ) : (
                      <>
                        Post Task <Zap size={15} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-stone-400 dark:text-stone-500 mt-4">
            Matched providers in your area will be notified instantly.
          </p>
        </div>
      </div>

      <MatchedProvidersDrawer
        visible={drawerOpen}
        providers={enrichedProviders}
        summary={matchingSummary}
        matchLoading={matching}
        taskTitle={draft.title}
        taskDescription={draft.description}
        taskCategory={draft.category}
        onClose={() => setDrawerOpen(false)}
        onRequest={handleRequest}
        requestingId={requestingId}
        onRefresh={handleRefresh}
        onEditTask={handleEditTask}
        editSaving={editSaving}
      />
    </div>
  );
}
