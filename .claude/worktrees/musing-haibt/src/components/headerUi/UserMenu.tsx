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

const getSettingsItems = () => [
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    key: "settings",
  },
  { href: "/help", icon: HelpCircle, label: "Help & Support", key: "help" },
];

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

// ─── Notification Button ──────────────────────────────────────────────────────

const NotificationButton: React.FC<{ count?: number }> = ({ count = 0 }) => (
  <Button
    variant="ghost"
    size="icon"
    className="relative rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
    asChild>
    <Link href="/notifications">
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
    </Link>
  </Button>
);

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
  // onProfilePictureUpdate,
}) => {
  const role = profile?.role as UserRole | undefined;

  const MENU_ITEMS = React.useMemo(
    () => [
      { href: "/profile", icon: UserIcon, label: "Profile", key: "profile" },
      {
        href:
          role === UserRole.PROVIDER
            ? "/provider/tasks/available"
            : "/client/tasks/posted",
        icon: BarChart3,
        label: "Tasks",
        key: "dashboard",
      },
    ],
    [role],
  );

  const SETTINGS_ITEMS = React.useMemo(() => getSettingsItems(), []);

  const display = {
    name: user?.name ?? "Unknown User",
    email: user?.email ?? "No email",
    // Priority: explicit upload URL → populated API value (already resolved
    // by the parent via isPopulatedPicture) → legacy user.avatar field
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
      <NotificationButton count={notificationCount} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0">
            {isProfileLoading ? (
              // Show a pulsing skeleton while the profile (and therefore the
              // avatar URL) hasn't resolved yet.
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

            <DropdownMenuGroup>
              {SETTINGS_ITEMS.map(renderMenuItem)}
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
