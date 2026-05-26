"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Shield,
} from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/auth/useAuth";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { UserRole } from "@/types/base.types";
import { SystemRole } from "@/types/user.types";
import { IFile } from "@/types/files.types";
import { getNavigationByRole } from "./ProfileNavConfiguration";
import { NavigationLink } from "./ProfNavigationLinksTypes";
import { AvatarChanger } from "../files/user-profile/AvatarChanger";
import { isPopulatedPicture } from "@/types/core.user.profile.types";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfileNavProps {
  onPostTask?: () => void;
  onBrowseTasks?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectParentIds(links: NavigationLink[]): string[] {
  return links.flatMap((link) =>
    link.children?.length ? [link.id, ...collectParentIds(link.children)] : [],
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  isLoading: boolean;
  isProvider: boolean;
}

const RoleBadge = memo(function RoleBadge({
  isLoading,
  isProvider,
}: RoleBadgeProps) {
  if (isLoading) {
    return <div className="h-4 w-14 bg-white/20 rounded-full animate-pulse" />;
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-widest uppercase ${
        isProvider
          ? "bg-blue-500/30 text-blue-100 border border-blue-400/30"
          : "bg-rose-500/30 text-rose-100 border border-rose-400/30"
      }`}>
      {isProvider ? "Provider" : "Client"}
    </span>
  );
});

// ─── NavItem ──────────────────────────────────────────────────────────────────
interface NavItemProps {
  link: NavigationLink;
  depth: number;
  isCollapsed: boolean;
  isLoading: boolean;
  isExpanded: boolean;
  isActive: boolean;
  onNavClick: (link: NavigationLink) => void;
  children?: React.ReactNode;
}

const NavItem = memo(function NavItem({
  link,
  depth,
  isCollapsed,
  isLoading,
  isExpanded,
  isActive,
  onNavClick,
  children,
}: NavItemProps) {
  const Icon = link.icon;
  const hasChildren = !!link.children?.length;

  const button = (
    <button
      onClick={() => onNavClick(link)}
      disabled={isLoading}
      className={cn(
        "group relative w-full flex items-center justify-between",
        "px-3 py-2.5 rounded-xl transition-all duration-200",
        depth > 0 && !isCollapsed ? "ml-3 w-[calc(100%-0.75rem)]" : "",
        isActive
          ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50",
        isLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        isCollapsed ? "justify-center px-2" : "",
      )}>
      {/* Active left indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}

      <div
        className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
        <div
          className={cn(
            "shrink-0 transition-transform duration-200",
            isActive
              ? "text-white"
              : "text-gray-500 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400",
          )}>
          <Icon className="w-4 h-4" />
        </div>

        {!isCollapsed && (
          <span
            className={cn(
              "text-sm font-medium truncate",
              isActive
                ? "text-white"
                : "group-hover:text-gray-900 dark:group-hover:text-white",
            )}>
            {link.label}
          </span>
        )}
      </div>

      {!isCollapsed &&
        (hasChildren ? (
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
              isExpanded ? "rotate-180" : "",
              isActive ? "text-white/60" : "text-slate-300 dark:text-slate-600",
            )}
          />
        ) : isActive ? (
          <div className="w-1 h-4 rounded-full bg-white/30 shrink-0" />
        ) : null)}
    </button>
  );

  return (
    <div>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {link.label}
          </TooltipContent>
        </Tooltip>
      ) : (
        button
      )}

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-0.5 mb-1 space-y-0.5 relative">
          <div className="absolute left-5.5 top-0 bottom-0 w-px bg-slate-100 dark:bg-gray-800" />
          {children}
        </div>
      )}
    </div>
  );
});

// ─── NavTree ──────────────────────────────────────────────────────────────────

interface NavTreeProps {
  links: NavigationLink[];
  depth?: number;
  isCollapsed: boolean;
  isLoading: boolean;
  expandedLinks: Set<string>;
  pathname: string;
  onNavClick: (link: NavigationLink) => void;
}

const NavTree = memo(function NavTree({
  links,
  depth = 0,
  isCollapsed,
  isLoading,
  expandedLinks,
  pathname,
  onNavClick,
}: NavTreeProps) {
  return (
    <>
      {links.map((link) => {
        const isActive = !!link.href && pathname === link.href;
        const isExpanded = expandedLinks.has(link.id);

        return (
          <NavItem
            key={link.id}
            link={link}
            depth={depth}
            isCollapsed={isCollapsed}
            isLoading={isLoading}
            isExpanded={isExpanded}
            isActive={isActive}
            onNavClick={onNavClick}>
            {link.children?.length ? (
              <NavTree
                links={link.children}
                depth={depth + 1}
                isCollapsed={isCollapsed}
                isLoading={isLoading}
                expandedLinks={expandedLinks}
                pathname={pathname}
                onNavClick={onNavClick}
              />
            ) : null}
          </NavItem>
        );
      })}
    </>
  );
});

// ─── SidebarFooter ────────────────────────────────────────────────────────────

interface SidebarFooterProps {
  isCollapsed: boolean;
  isLoading: boolean;
  isProvider: boolean;
  showAdminButton: boolean;
  ctaLabel: string;
  ctaDescription: string;
  onCTAAction: () => void;
  onNavigateToAdmin: () => void;
  onLogout: () => void;
}

const SidebarFooter = memo(function SidebarFooter({
  isCollapsed,
  isLoading,
  isProvider,
  showAdminButton,
  ctaLabel,
  ctaDescription,
  onCTAAction,
  onNavigateToAdmin,
  onLogout,
}: SidebarFooterProps) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-2">
      {showAdminButton &&
        (isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onNavigateToAdmin}
                className="w-full h-9 flex items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all duration-150">
                <Shield className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              Admin Console
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onNavigateToAdmin}
            className="w-full h-9 flex items-center justify-center gap-2 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/25 transition-all duration-150 border-0">
            <Shield className="w-3.5 h-3.5" />
            Admin Console
          </button>
        ))}

      {/* CTA button */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {isLoading ? (
              <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-gray-800 animate-pulse" />
            ) : (
              <button
                onClick={onCTAAction}
                className="w-full h-9 flex items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-150 hover:shadow-md hover:-translate-y-px active:translate-y-0 shadow-sm shadow-blue-500/25">
                <span className="text-sm leading-none">
                  {isProvider ? "🔍" : "✚"}
                </span>
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p className="font-semibold">{ctaLabel}</p>
            <p className="text-slate-400">{ctaDescription}</p>
          </TooltipContent>
        </Tooltip>
      ) : isLoading ? (
        <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <button
          onClick={onCTAAction}
          className="w-full rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 text-sm font-semibold transition-all duration-150 hover:shadow-md hover:shadow-blue-500/25 hover:-translate-y-px active:translate-y-0 active:shadow-sm">
          <span className="block leading-tight">{ctaLabel}</span>
          <span className="block text-[10px] font-normal opacity-60 mt-0.5">
            {ctaDescription}
          </span>
        </button>
      )}

      {/* Logout */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center py-2 rounded-xl",
                "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
                "transition-all duration-150",
                isLoading ? "opacity-40 cursor-not-allowed" : "",
              )}>
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            Sign out
          </TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={onLogout}
          disabled={isLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-xl",
            "text-red-500 dark:text-red-400 text-xs font-medium",
            "hover:bg-red-50 dark:hover:bg-red-950/20",
            "transition-all duration-150 group",
            isLoading ? "opacity-40 cursor-not-allowed" : "",
          )}>
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
          )}
          <span>{isLoading ? "Loading…" : "Sign out"}</span>
        </button>
      )}
    </div>
  );
});

// ─── UserProfileNav ───────────────────────────────────────────────────────────

export default function UserProfileNav({
  onPostTask,
  onBrowseTasks,
}: UserProfileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [userExpandOverrides, setUserExpandOverrides] = useState<{
    opened: Set<string>;
    closed: Set<string>;
  }>({ opened: new Set(), closed: new Set() });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { user, isLoading: authLoading } = useAuth();

  // ── Profile ───────────────────────────────────────────────────────────────
  const {
    profile,
    stats,
    loading: profileLoading,
    fetchCompleteProfile,
    fetchStats,
  } = useProfile(false);

  useEffect(() => {
    fetchCompleteProfile();
    fetchStats();
  }, [fetchCompleteProfile, fetchStats]);

  const profileResolved = !profileLoading.profile && profile !== null;
  const isProvider = profileResolved && profile?.role === UserRole.PROVIDER;
  const isLoading = authLoading || !profileResolved;

  // ── Avatar URL ────────────────────────────────────────────────────────────
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<
    string | undefined
  >();

  const avatarUrl = useMemo(() => {
    if (uploadedAvatarUrl) return uploadedAvatarUrl;
    if (isPopulatedPicture(profile?.profilePictureId)) {
      return profile.profilePictureId.url;
    }
    return undefined;
  }, [uploadedAvatarUrl, profile]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const role = profile?.role;

  const navigationLinks = useMemo(
    () => getNavigationByRole(role ?? UserRole.CUSTOMER),
    [role],
  );

  const expandedLinks = useMemo<Set<string>>(() => {
    const defaults = new Set(collectParentIds(navigationLinks));
    if (!hasUserInteracted) return defaults;

    const merged = new Set(defaults);
    userExpandOverrides.opened.forEach((id) => merged.add(id));
    userExpandOverrides.closed.forEach((id) => merged.delete(id));
    return merged;
  }, [navigationLinks, hasUserInteracted, userExpandOverrides]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleUploadSuccess = useCallback((file: IFile) => {
    setUploadedAvatarUrl(file.url);
  }, []);

  const navigateToAdmin = useCallback(() => router.push("/admin"), [router]);
  const handleLogout = useCallback(() => router.push("/logout"), [router]);

  const handleCTAAction = useCallback(() => {
    if (isProvider) onBrowseTasks?.();
    else onPostTask?.();
  }, [isProvider, onBrowseTasks, onPostTask]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleNavClick = useCallback(
    (link: NavigationLink) => {
      const hasChildren = !!link.children?.length;

      if (hasChildren) {
        setHasUserInteracted(true);
        if (isCollapsed) {
          setIsCollapsed(false);
          setUserExpandOverrides((prev) => ({
            opened: new Set([...prev.opened, link.id]),
            closed: prev.closed,
          }));
        } else {
          setUserExpandOverrides((prev) => {
            const isCurrentlyExpanded = expandedLinks.has(link.id);
            if (isCurrentlyExpanded) {
              const nextOpened = new Set(prev.opened);
              nextOpened.delete(link.id);
              return {
                opened: nextOpened,
                closed: new Set([...prev.closed, link.id]),
              };
            } else {
              const nextClosed = new Set(prev.closed);
              nextClosed.delete(link.id);
              return {
                opened: new Set([...prev.opened, link.id]),
                closed: nextClosed,
              };
            }
          });
        }
      } else if (link.href) {
        router.push(link.href);
      }
    },
    [isCollapsed, expandedLinks, router],
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "user@email.com";
  const ctaLabel = isProvider ? "Browse Tasks" : "Post New Task";
  const ctaDescription = isProvider
    ? "Find work opportunities"
    : "Need help with something?";

  const showAdminButton = useMemo(
    () =>
      user?.systemRole === SystemRole.ADMIN ||
      user?.systemRole === SystemRole.SUPER_ADMIN,
    [user?.systemRole],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative h-full bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950",
          "border-r border-gray-200 dark:border-gray-800",
          "flex flex-col",
          "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-18" : "w-80",
        )}>
        {/* ── Collapse toggle ── */}
        <button
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-13.75 z-20 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* ── Profile header ── */}
        {isCollapsed ? (
          /* Collapsed: avatar only with tooltip */
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 px-3">
                {isLoading ? (
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-800 animate-pulse" />
                ) : (
                  <AvatarChanger
                    src={avatarUrl}
                    name={displayName}
                    size="sm"
                    editable={false}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p className="font-semibold capitalize">{displayName}</p>
              <p className="text-slate-400 text-[11px]">{displayEmail}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          /* Expanded: full-bleed image header — everything overlaid */
          <div className="border-b border-gray-200 dark:border-gray-800 overflow-hidden shrink-0">
            <div className="relative h-52 w-full">
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 dark:bg-gray-800 animate-pulse" />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  width={400}
                  height={400}
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800" />
              )}

              {/* Scrim — heavier at bottom so stats/text pop */}
              <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/45 to-black/10" />

              {/* Edit avatar — top right, md size for easy access */}
              {!isLoading && (
                <div className="absolute top-3 right-3 z-10">
                  <AvatarChanger
                    src={avatarUrl}
                    name={displayName}
                    size="md"
                    editable={true}
                    onUploadSuccess={handleUploadSuccess}
                  />
                </div>
              )}

              {/* Identity + stats — pinned to bottom, fully overlaid */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-white/15 rounded animate-pulse" />
                    <div className="h-4 w-14 bg-white/15 rounded-full animate-pulse mt-1" />
                    <div className="flex gap-6 mt-3 pt-3 border-t border-white/10">
                      <div className="h-8 w-14 bg-white/15 rounded animate-pulse" />
                      <div className="h-8 w-14 bg-white/15 rounded animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white capitalize leading-snug truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-white/55 truncate mt-0.5">
                      {displayEmail}
                    </p>
                    <div className="mt-1.5">
                      <RoleBadge isLoading={false} isProvider={isProvider} />
                    </div>

                    {/* Stats — inside the overlay, separated by a subtle rule */}
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/15">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-white tabular-nums leading-none">
                          {stats?.activeProfiles ?? 0}
                        </span>
                        <span className="text-[9px] font-medium text-white/50 uppercase tracking-widest whitespace-nowrap">
                          {isProvider ? "Active Jobs" : "Active Tasks"}
                        </span>
                      </div>
                      <div className="w-px h-7 bg-white/20" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-white tabular-nums leading-none">
                          {stats?.totalProfiles ?? 0}
                        </span>
                        <span className="text-[9px] font-medium text-white/50 uppercase tracking-widest whitespace-nowrap">
                          Reviews
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Nav tree ── */}
        <ScrollArea
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3 hide-scrollbar",
            isCollapsed ? "px-2" : "px-3",
          )}>
          <NavTree
            links={navigationLinks}
            isCollapsed={isCollapsed}
            isLoading={isLoading}
            expandedLinks={expandedLinks}
            pathname={pathname}
            onNavClick={handleNavClick}
          />
        </ScrollArea>

        {/* ── Footer ── */}
        <SidebarFooter
          isCollapsed={isCollapsed}
          isLoading={isLoading}
          isProvider={isProvider}
          showAdminButton={showAdminButton}
          ctaLabel={ctaLabel}
          ctaDescription={ctaDescription}
          onCTAAction={handleCTAAction}
          onNavigateToAdmin={navigateToAdmin}
          onLogout={handleLogout}
        />
      </div>
    </TooltipProvider>
  );
}
