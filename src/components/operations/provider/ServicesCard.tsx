"use client";

import { useState } from "react";
import {
  Package,
  Archive,
  RotateCcw,
  ExternalLink,
  Tag,
  MoreHorizontal,
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { ProviderProfile } from "@/types/provider.profile.types";
import type { Service } from "@/types/services/service.types";
import Image from "next/image";

// ServicesCard.tsx — widen the prop
interface ServicesCardProps {
  profile: ProviderProfile; // ← was PopulatedProviderProfile
  onManageServices: () => void;
  onArchiveService: (id: string) => Promise<void>;
  onRestoreService: (id: string) => Promise<void>;
}

type FilterTab = "all" | "live" | "attention" | "inactive";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function serviceStatus(service: Service): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  icon: React.ReactNode;
  className: string;
} {
  const isRejected = !!service.rejectedAt;
  const isPendingAutoActivation =
    !!service.scheduledActivationAt &&
    new Date(service.scheduledActivationAt) > new Date();
  const isPending =
    !service.isActive && !service.approvedAt && !service.rejectedAt;

  if (isRejected)
    return {
      label: "Rejected",
      variant: "destructive",
      icon: <XCircle size={9} />,
      className:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    };
  if (isPendingAutoActivation)
    return {
      label: "Scheduled",
      variant: "outline",
      icon: <Clock size={9} />,
      className:
        "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800",
    };
  if (isPending)
    return {
      label: "Under Review",
      variant: "outline",
      icon: <Clock size={9} />,
      className:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    };
  if (service.isActive)
    return {
      label: "Live",
      variant: "default",
      icon: <CheckCircle2 size={9} />,
      className:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    };
  return {
    label: "Inactive",
    variant: "secondary",
    icon: <Archive size={9} />,
    className: "text-zinc-500 border-zinc-300 dark:border-zinc-700",
  };
}

// ─── Service Row ───────────────────────────────────────────────────────────────

function ServiceRow({
  service,
  onArchive,
  onRestore,
}: {
  service: Service;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const st = serviceStatus(service);

  const handle = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  // Guard: if _id is somehow missing, don't allow archive/restore
  const serviceId = service._id?.toString() ?? "";

  const isInactive =
    !service.isActive && !!service.approvedAt && !service.rejectedAt;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        isInactive
          ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 opacity-60"
          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
      }`}>
      {/* Cover thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
        {service.coverImage?.thumbnailUrl ? (
          <Image
            src={service.coverImage.thumbnailUrl}
            alt={service.title}
            className="w-full h-full object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <Package size={16} />
          </div>
        )}
      </div>

      {/* Title + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {service.title}
        </p>
        {service.categoryId && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
            <Tag size={9} className="shrink-0" />
            {typeof service.categoryId === "object"
              ? service.categoryId.catName
              : service.categoryId}
          </p>
        )}
      </div>

      {/* Status badge */}
      <Badge
        variant={st.variant}
        className={`text-[10px] gap-1 shrink-0 ${st.className}`}>
        {st.icon}
        {st.label}
      </Badge>

      {/* Actions menu — only rendered when the service has a valid ID */}
      {serviceId && <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground">
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => window.open(`/services/${service.slug}`, "_blank")}>
            <ExternalLink size={12} />
            View listing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {service.isActive ? (
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => handle(() => onArchive(serviceId))}>
              <Archive size={12} />
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-xs gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
              onClick={() => handle(() => onRestore(serviceId))}>
              <RotateCcw size={12} />
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
        <Package size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">No services yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Head to your services page to add your first offering.
        </p>
      </div>
      <Button
        size="sm"
        onClick={onManage}
        className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
        <ExternalLink size={13} />
        Go to services
      </Button>
    </div>
  );
}

// ─── No Results State ──────────────────────────────────────────────────────────

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      <XCircle size={20} className="text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm text-muted-foreground">
        No services match{" "}
        <span className="font-semibold">&quot;{query}&quot;</span>
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ServicesCard({
  profile,
  onManageServices,
  onArchiveService,
  onRestoreService,
}: ServicesCardProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Drop any entries missing _id to prevent downstream toString() crashes.
  // Root cause is typically a null ref from a failed population or a partially
  // written MongoDB document — filter at the boundary instead of patching
  // every call site.
  const validServices = (
    (profile.serviceOfferings ?? []) as unknown as Service[]
  ).filter((s) => s._id != null);

  const live = validServices.filter((s) => s.isActive);
  const attention = validServices.filter(
    (s) => !s.isActive && (!!s.rejectedAt || (!s.approvedAt && !s.rejectedAt)),
  );
  const inactive = validServices.filter(
    (s) => !s.isActive && !!s.approvedAt && !s.rejectedAt,
  );

  const filterFn = (list: Service[]) => {
    const q = search.toLowerCase().trim();
    return list.filter((s) => {
      if (!q) return true;
      const catName =
        typeof s.categoryId === "object" ? (s.categoryId?.catName ?? "") : "";
      return (
        s.title.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
      );
    });
  };

  const visibleLive = filterFn(live);
  const visibleAttention = filterFn(attention);
  const visibleInactive = filterFn(inactive);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: validServices.length },
    { key: "live", label: "Live", count: live.length },
    ...(attention.length > 0
      ? [{ key: "attention" as FilterTab, label: "Review", count: attention.length }]
      : []),
    { key: "inactive", label: "Inactive", count: inactive.length },
  ];

  const showLive = filter === "all" || filter === "live";
  const showAttentionSection = filter === "all" || filter === "attention";
  const showInactiveSection = filter === "all" || filter === "inactive";

  return (
    <Card className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
              <Package size={16} />
            </span>
            <div>
              <CardTitle className="text-base">Service Offerings</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {validServices.length === 0
                  ? "No services added yet"
                  : attention.length > 0
                    ? `${live.length} live · ${attention.length} need${attention.length === 1 ? "s" : ""} review`
                    : `${live.length} live · ${inactive.length} inactive`}
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onManageServices}
            className="shrink-0 bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-zinc-900 text-white gap-1.5 text-xs">
            <Settings2 size={13} />
            Manage services
          </Button>
        </div>

        {/* Only show search + tabs when there's something to filter */}
        {validServices.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services…"
                className="pl-8 h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filter === tab.key
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}>
                  {tab.label}
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      filter === tab.key
                        ? "bg-white/20 dark:bg-black/20"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {validServices.length === 0 ? (
          <EmptyState onManage={onManageServices} />
        ) : (
          <div className="space-y-4">
            {/* ── Live services ── */}
            {showLive && (
              <div className="space-y-1.5">
                {visibleLive.length === 0 && search ? (
                  <NoResults query={search} />
                ) : (
                  visibleLive.map((s) => (
                    <ServiceRow
                      key={s._id.toString()}
                      service={s}
                      onArchive={onArchiveService}
                      onRestore={onRestoreService}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Attention services (pending / rejected) — shown prominently ── */}
            {showAttentionSection && attention.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 py-1">
                  <Clock size={11} />
                  Needs review
                  <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full text-[10px]">
                    {attention.length}
                  </span>
                </p>
                {visibleAttention.length === 0 && search ? (
                  <NoResults query={search} />
                ) : (
                  visibleAttention.map((s) => (
                    <ServiceRow
                      key={s._id.toString()}
                      service={s}
                      onArchive={onArchiveService}
                      onRestore={onRestoreService}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Inactive services (collapsible) ── */}
            {showInactiveSection && inactive.length > 0 && (
              <Collapsible open={showArchived} onOpenChange={setShowArchived}>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1">
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${showArchived ? "rotate-180" : ""}`}
                    />
                    Inactive services
                    <span className="ml-auto bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-[10px]">
                      {inactive.length}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1.5 mt-1">
                  {visibleInactive.length === 0 && search ? (
                    <NoResults query={search} />
                  ) : (
                    visibleInactive.map((s) => (
                      <ServiceRow
                        key={s._id.toString()}
                        service={s}
                        onArchive={onArchiveService}
                        onRestore={onRestoreService}
                      />
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
