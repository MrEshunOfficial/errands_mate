import React from "react";
import Image from "next/image";
import {
  Settings,
  UserIcon,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Bell,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LogOut,
  ClipboardList,
  Info,
  BookOpen,
  LayoutDashboard,
  UserCog,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole, SystemRole } from "@/types/base.types";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion } from "framer-motion";
import { User } from "@/types/user.types";
import { cn } from "@/lib/utils";
import { IUserProfile } from "@/types/core.user.profile.types";

// ─── Theme config ─────────────────────────────────────────────────────────────

const THEME_CONFIG = {
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
  system: { icon: Monitor, label: "System" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns role-specific secondary menu items.
 * - CLIENT/customer → Settings (routes to /client/preferences) + Help
 * - PROVIDER        → Requests (routes to /provider/requests) + Help
 */
const getSecondaryItems = (role?: UserRole) => {
  const isClient = role === UserRole.CUSTOMER || role === undefined;

  if (isClient) {
    return [
      {
        href: "/client/preferences",
        icon: Settings,
        label: "Settings",
        key: "settings",
      },
      {
        href: "/settings/account",
        icon: UserCog,
        label: "Account",
        key: "account",
      },
      { href: "/help", icon: HelpCircle, label: "Help & Support", key: "help" },
    ];
  }

  // PROVIDER role
  return [
    {
      href: "/provider/requests",
      icon: ClipboardList,
      label: "Requests",
      key: "requests",
    },
    {
      href: "/settings/account",
      icon: UserCog,
      label: "Account",
      key: "account",
    },
    { href: "/help", icon: HelpCircle, label: "Help & Support", key: "help" },
  ];
};

// ─── Theme Switcher ───────────────────────────────────────────────────────────

const ThemeSwitcher: React.FC = () => {
  const { setTheme, theme } = useTheme();
  const currentTheme =
    THEME_CONFIG[theme as keyof typeof THEME_CONFIG] ?? THEME_CONFIG.system;
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <CurrentIcon className="mr-2 h-4 w-4" />
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {Object.entries(THEME_CONFIG).map(([key, { icon: Icon, label }]) => (
          <DropdownMenuItem key={key} onClick={() => setTheme(key)}>
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

// ─── Notification Types ───────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string | Date;
  read: boolean;
  type?: "info" | "success" | "warning";
  href?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const relativeTime = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NOTIFICATION_ICON: Record<
  NonNullable<NotificationItem["type"]>,
  React.ElementType
> = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
};

const NOTIFICATION_COLOR: Record<
  NonNullable<NotificationItem["type"]>,
  string
> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
};

// ─── Notification Popover ─────────────────────────────────────────────────────

const NotificationPopover: React.FC<{
  count?: number;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
}> = ({ count = 0, notifications = [], onMarkAllRead }) => {
  const unread = notifications.filter((n) => !n.read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}>
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full bg-linear-to-r from-red-500 to-red-600 shadow-lg">
                {count > 99 ? "99+" : count}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={10}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 h-5 rounded-full">
                {unread.length}
              </Badge>
            )}
          </div>
          {unread.length > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-500">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <ul>
              {notifications.slice(0, 10).map((n, i) => {
                const Icon =
                  NOTIFICATION_ICON[n.type ?? "info"];
                const iconColor =
                  NOTIFICATION_COLOR[n.type ?? "info"];
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
                      !n.read &&
                        "bg-blue-50/50 dark:bg-blue-950/20",
                    )}>
                    <Icon
                      className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-tight truncate",
                          !n.read
                            ? "font-semibold"
                            : "font-medium text-gray-700 dark:text-gray-300",
                        )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                      {relativeTime(n.createdAt)}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );

                return (
                  <li
                    key={n.id}
                    className={cn(
                      i < notifications.slice(0, 10).length - 1 &&
                        "border-b border-gray-100 dark:border-gray-800/50",
                    )}>
                    {n.href ? (
                      <Link href={n.href}>{content}</Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200/60 dark:border-gray-800/60 px-4 py-2.5">
            <Link
              href="/notifications"
              className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-1">
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// ─── Status Indicator ─────────────────────────────────────────────────────────

const StatusIndicator: React.FC<{
  type: "incomplete" | "verified";
  className?: string;
}> = ({ type, className }) => {
  const config =
    type === "verified"
      ? { bg: "bg-green-500", icon: CheckCircle }
      : { bg: "bg-yellow-500", icon: AlertCircle };

  return (
    <div
      className={cn(
        "absolute w-4 h-4 rounded-full flex items-center justify-center",
        config.bg,
        className,
      )}>
      <config.icon className="h-3 w-3 text-white" />
    </div>
  );
};

// ─── User Avatar ──────────────────────────────────────────────────────────────

const UserAvatar: React.FC<{
  avatarUrl?: string;
  displayName: string;
  completeness?: number;
  isVerified?: boolean;
  size?: "sm" | "md";
}> = ({
  avatarUrl,
  displayName,
  completeness = 100,
  isVerified,
  size = "sm",
}) => {
  const avatarSize = size === "md" ? "h-12 w-12" : "h-9 w-9";

  return (
    <div className="relative">
      <Avatar
        className={cn(
          avatarSize,
          "ring-2 ring-offset-1 ring-gray-200/50 dark:ring-gray-700/50",
        )}>
        <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
        <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white font-medium">
          {displayName.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {completeness < 100 && (
        <StatusIndicator type="incomplete" className="-bottom-1 -right-1" />
      )}
      {isVerified && (
        <StatusIndicator type="verified" className="-top-1 -right-1" />
      )}
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserMenuProps {
  user?: Partial<User>;
  profile?: Partial<IUserProfile> | null;
  profilePictureUrl?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  /** True while the profile fetch is still in flight. */
  isProfileLoading?: boolean;
  onLogout: () => void;
  notificationCount?: number;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
  onProfilePictureUpdate?: (url: string) => void;
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────

export const UserMenu: React.FC<UserMenuProps> = ({
  user = {},
  profile,
  profilePictureUrl,
  isProfileLoading = false,
  onLogout,
  notificationCount = 0,
  notifications = [],
  onMarkAllRead,
  // onProfilePictureUpdate,
}) => {
  const role = profile?.role as UserRole | undefined;

  const MENU_ITEMS = React.useMemo(() => {
    const isProvider = role === UserRole.PROVIDER;
    const items = [
      // Providers have a profile page; clients go straight to dashboard
      ...(isProvider
        ? [{ href: "/profile", icon: UserIcon, label: "Profile", key: "profile" }]
        : []),
      {
        href: isProvider ? "/provider/dashboard" : "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        key: "dashboard",
      },
      {
        href: isProvider ? "/provider/bookings" : "/my-bookings",
        icon: BookOpen,
        label: "Bookings",
        key: "bookings",
      },
      {
        href: isProvider ? "/provider/tasks/available" : "/client/tasks/posted",
        icon: BarChart3,
        label: "Tasks",
        key: "tasks",
      },
    ];
    return items;
  }, [role]);

  // Role-aware: clients get Settings → /client/preferences;
  // providers get Requests → /provider/requests
  const SECONDARY_ITEMS = React.useMemo(() => getSecondaryItems(role), [role]);

  const display = {
    name: user?.name ?? "Unknown User",
    email: user?.email ?? "No email",
    avatarUrl:
      profilePictureUrl ??
      (user as Partial<User> & { avatar?: string })?.avatar,
    role:
      profile?.role ??
      (user as Partial<User> & { systemRole?: SystemRole })?.systemRole ??
      SystemRole.USER,
  };

  const renderMenuItem = ({
    href,
    icon: Icon,
    label,
    key,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    key: string;
  }) => (
    <DropdownMenuItem key={key} asChild>
      <Link href={href} className="w-full cursor-pointer flex items-center">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </DropdownMenuItem>
  );

  return (
    <div className="flex items-center space-x-2">
      <NotificationPopover
        count={notificationCount}
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0">
            {isProfileLoading ? (
              <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <UserAvatar
                avatarUrl={display.avatarUrl}
                displayName={display.name}
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-52 p-0 z-60"
          align="center"
          sideOffset={10}
          side="bottom"
          avoidCollisions
          collisionPadding={8}
          sticky="always">
          {/* ── User info header ─────────────────────────────────────── */}
          <DropdownMenuLabel className="p-0 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="relative h-32 w-full overflow-hidden">
              <div className="absolute inset-0">
                {display.avatarUrl ? (
                  <Image
                    src={display.avatarUrl}
                    alt={`${display.name} cover`}
                    fill
                    className="object-cover"
                    sizes="208px"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 text-white px-2">
                <p className="text-base font-bold leading-tight truncate capitalize drop-shadow-lg">
                  {display.name}
                </p>
                <p className="text-xs truncate opacity-95 drop-shadow-md">
                  {display.email}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs mt-1 font-medium opacity-90 drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {display.role === UserRole.PROVIDER
                      ? "Service Provider"
                      : "Client"}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="p-2">
            <DropdownMenuGroup>
              {MENU_ITEMS.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <ThemeSwitcher />
            <DropdownMenuSeparator />

            {/* Role-aware: Settings (client) or Requests (provider) */}
            <DropdownMenuGroup>
              {SECONDARY_ITEMS.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-700 cursor-pointer">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
