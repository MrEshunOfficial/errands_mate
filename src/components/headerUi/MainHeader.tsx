"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SystemRole } from "@/types/base.types";
import { useAuth } from "@/hooks/auth/useAuth";
import { User } from "@/types/user.types";
import { UserMenu } from "./UserMenu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NavigationItem, baseNavigationItems } from "../layouts/NavElement";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { isPopulatedPicture } from "@/types/core.user.profile.types";
// ─── Logo ─────────────────────────────────────────────────────────────────────

const ErrandMateLogo: React.FC = () => (
  <div className="flex items-center shrink-0 min-w-0">
    <Link href="/" className="group">
      <div className="flex items-center space-x-2 sm:space-x-3 transition-all duration-300 group-hover:scale-105">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-red-400/50 to-blue-600/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative w-7 h-7 rounded-full ring-1 ring-white/50 dark:ring-gray-800/50 shadow-lg overflow-hidden bg-linear-to-br from-red-400 to-blue-600">
            <Image
              src="/errand-logo.jpg"
              alt="Errand Mate"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold bg-linear-to-r from-red-500 via-red-400 to-blue-600 text-transparent bg-clip-text tracking-tight truncate">
            Errand Mate
          </span>
          <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide truncate">
            Let us run it for you
          </span>
        </div>
      </div>
    </Link>
  </div>
);

// ─── NavLink ──────────────────────────────────────────────────────────────────

const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  icon?: React.ReactNode;
  className?: string;
}> = ({ href, children, isActive, icon, className }) => (
  <Link
    href={href}
    className={cn(
      "relative flex items-center gap-2 p-2 text-sm font-medium transition-all duration-300 group rounded-xl whitespace-nowrap",
      isActive
        ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50"
        : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400",
      className,
    )}>
    {icon && (
      <span className="transition-transform duration-300 group-hover:scale-110 shrink-0">
        {icon}
      </span>
    )}
    <span>{children}</span>
    <div
      className={cn(
        "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-linear-to-r from-red-500 to-blue-600 transition-all duration-300 rounded-full",
        isActive
          ? "w-1/2 opacity-100"
          : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-100",
      )}
    />
  </Link>
);

// ─── NavDropdown ──────────────────────────────────────────────────────────────

const NavDropdown: React.FC<{
  item: NavigationItem;
  isActive: boolean;
}> = ({ item, isActive }) => (
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            "relative flex items-center gap-2 p-2 text-sm font-medium transition-all duration-300 group rounded-xl whitespace-nowrap bg-transparent hover:bg-transparent focus:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent",
            isActive
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50"
              : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/20",
          )}>
          {item.icon && (
            <span className="transition-transform duration-300 group-hover:scale-110 shrink-0">
              {item.icon}
            </span>
          )}
          <span>{item.title}</span>
          <div
            className={cn(
              "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-linear-to-r from-red-500 to-blue-600 transition-all duration-300 rounded-full",
              isActive
                ? "w-1/2 opacity-100"
                : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-100",
            )}
          />
        </NavigationMenuTrigger>
        <NavigationMenuContent className="p-0">
          <div className="w-64 p-2">
            <div className="grid gap-2 sm:gap-3">
              {item.children?.map((child) => (
                <NavigationMenuLink key={child.title} asChild>
                  <Link
                    href={child.href}
                    className="flex items-start p-2 rounded-xl text-sm hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300 group border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <span className="flex items-center justify-start gap-2 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate">
                          {child.icon && (
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 shrink-0">
                              {child.icon}
                            </div>
                          )}
                          {child.title}
                        </span>
                        {child.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-linear-to-r from-red-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200/30 dark:border-blue-800/30">
                            {child.badge}
                          </Badge>
                        )}
                      </div>
                      {child.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {child.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </NavigationMenuLink>
              ))}
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

// ─── Auth Skeleton ─────────────────────────────────────────────────────────────

const AuthSkeleton: React.FC = () => (
  <div className="hidden md:flex items-center gap-3">
    <div className="h-8 w-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
  </div>
);

// ─── Main Header ──────────────────────────────────────────────────────────────

export const MainHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tracks a URL set by the user via an explicit upload action. When set, it
  // takes precedence over the profile's stored picture URL.
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<
    string | undefined
  >();

  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { profile, loading: profileLoading } = useProfile(isAuthenticated);

  // ── Avatar URL ────────────────────────────────────────────────────────────
  // Derived directly — no effect needed. Explicit upload overrides the profile
  // URL; when no upload has occurred, fall back to the populated API value.
  const avatarUrl = useMemo(() => {
    if (uploadedAvatarUrl) return uploadedAvatarUrl;
    if (isPopulatedPicture(profile?.profilePictureId)) {
      return profile.profilePictureId.url;
    }
    return undefined;
  }, [uploadedAvatarUrl, profile]);

  const isLoading = authLoading;

  const navigationItems = useMemo<NavigationItem[]>(
    () => [...baseNavigationItems],
    [],
  );

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path) ?? false;
  };

  const isAdmin =
    user?.systemRole === SystemRole.ADMIN ||
    user?.systemRole === SystemRole.SUPER_ADMIN;

  const isSuperAdmin = user?.systemRole === SystemRole.SUPER_ADMIN;

  const handleLogout = useCallback(() => {
    setIsMobileMenuOpen(false);
    router.push("/logout");
  }, [router]);

  const handleProfilePictureUpdate = useCallback((url: string) => {
    setUploadedAvatarUrl(url);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 border rounded-md p-2",
      )}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}>
            <ErrandMateLogo />
          </motion.div>

          {/* Desktop nav */}
          <nav className="hidden xl:flex xl:items-center xl:space-x-3">
            {navigationItems.map((item) =>
              item.children ? (
                <NavDropdown
                  key={item.title}
                  item={item}
                  isActive={isActive(item.href)}
                />
              ) : (
                <NavLink
                  key={item.title}
                  href={item.href}
                  isActive={isActive(item.href)}
                  icon={item.icon}>
                  {item.title}
                </NavLink>
              ),
            )}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full">
              <Search className="h-5 w-5" />
            </Button>

            {isLoading ? (
              <AuthSkeleton />
            ) : isAuthenticated ? (
              <UserMenu
                user={user || ({} as User)}
                profile={profile}
                profilePictureUrl={avatarUrl}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                onLogout={handleLogout}
                onProfilePictureUpdate={handleProfilePictureUpdate}
                isProfileLoading={profileLoading.profile}
              />
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" asChild className="rounded-xl">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-linear-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 shadow-lg">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}>
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile nav menu — slides down inside the sticky header */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="xl:hidden overflow-hidden border-t border-border mt-2">
            <div className="py-3 space-y-0.5">
              {navigationItems.map((item) =>
                item.children ? (
                  <div key={item.title}>
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      {item.title}
                    </div>
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        )}>
                        {child.icon && (
                          <span className="text-gray-400 dark:text-gray-500 shrink-0">
                            {child.icon}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{child.title}</div>
                          {child.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {child.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    )}>
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.title}
                  </Link>
                ),
              )}

              {/* Auth buttons for unauthenticated mobile users */}
              {!isAuthenticated && !isLoading && (
                <div className="pt-3 mt-1 border-t border-border flex flex-col gap-2 px-1">
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start rounded-xl">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full rounded-xl bg-linear-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700">
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default MainHeader;
