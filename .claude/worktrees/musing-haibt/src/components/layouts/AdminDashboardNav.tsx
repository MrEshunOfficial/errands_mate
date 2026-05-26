"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Shield,
  Users,
  BarChart3,
  Database,
  Lock,
  FileText,
  Activity,
  ChevronDown,
  Settings,
  Sparkles,
  ToolCaseIcon,
  ToolCase,
  BriefcaseBusinessIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { FcManager } from "react-icons/fc";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
  separator?: boolean;
  badge?: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: Shield,
    roles: ["admin", "super_admin"],
    separator: false,
    description: "Overview & insights",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: ToolCase,
    roles: ["admin", "super_admin"],
    description: "Service management",
  },
  {
    href: "/admin/services/categories",
    label: "Categories",
    icon: FcManager,
    roles: ["admin", "super_admin"],
    description: "Service management",
  },
  {
    href: "/admin/bookings",
    label: "Manage Bookings",
    icon: BriefcaseBusinessIcon,
    roles: ["admin", "super_admin"],
    description: "Booking management",
  },
  {
    href: "/admin/service-requests",
    label: "Manage Requests",
    icon: ToolCaseIcon,
    roles: ["admin", "super_admin"],
    description: "Service management",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["admin", "super_admin"],
    description: "User management",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["admin", "super_admin"],
    description: "Data insights",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: FileText,
    roles: ["admin", "super_admin"],
    description: "Generated reports",
  },
  {
    href: "/admin/activity",
    label: "Activity Logs",
    icon: Activity,
    roles: ["admin", "super_admin"],
    description: "System activities",
  },
  {
    href: "/admin/system",
    label: "System Settings",
    icon: Database,
    roles: ["super_admin"],
    separator: true,
    badge: "Admin",
    description: "Core configuration",
  },
  {
    href: "/admin/permissions",
    label: "Permissions",
    icon: Lock,
    roles: ["super_admin"],
    badge: "Admin",
    description: "Access control",
  },
  {
    href: "/admin/admins",
    label: "Admin Users",
    icon: Shield,
    roles: ["super_admin"],
    badge: "Admin",
    description: "Administrator management",
  },
];

export const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(`Logout failed: ${error}`);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const canAccessRoute = (item: NavigationItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.systemRole || "");
  };

  const getFilteredNavigationItems = () => {
    return navigationItems.filter((item) => canAccessRoute(item));
  };

  const filteredItems = getFilteredNavigationItems();

  return (
    <div
      className="flex flex-col h-full bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
      data-testid="dashboard-navigation">
      {/* Header */}
      <div className="shrink-0 px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.systemRole === "super_admin" ? "Super Admin" : "Admin"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || "Administrator"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <nav className="p-3 space-y-0.5">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              const showSeparator = item.separator && index > 0;

              return (
                <React.Fragment key={item.href}>
                  {showSeparator && (
                    <div className="py-3">
                      <div className="flex items-center gap-2 px-3">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                          Advanced
                        </span>
                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                      </div>
                    </div>
                  )}
                  <Link
                    href={user && canAccessRoute(item) ? item.href : "/login"}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50",
                    )}>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        "shrink-0 transition-transform duration-200",
                        hoveredItem === item.href && !isActive && "scale-110",
                      )}>
                      <Icon
                        size={18}
                        className={cn(
                          isActive
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400",
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isActive
                              ? "text-white"
                              : "group-hover:text-gray-900 dark:group-hover:text-white",
                          )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-linear-to-r from-red-500 to-red-600 text-white",
                            )}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p
                          className={cn(
                            "text-xs truncate transition-opacity",
                            isActive
                              ? "text-blue-100"
                              : "text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400",
                            hoveredItem === item.href
                              ? "opacity-100"
                              : "opacity-0",
                          )}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Hover effect */}
                    {!isActive && hoveredItem === item.href && (
                      <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-transparent dark:from-blue-950/20 rounded-xl pointer-events-none" />
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      <QuickActions handleLogout={handleLogout} />
    </div>
  );
};

interface QuickActionsProps {
  handleLogout: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ handleLogout }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  const actions = [];

  actions.push({
    label: "Privacy Settings",
    icon: Settings,
    action: () => router.push("/profile/settings"),
    priority: "normal" as const,
  });

  if (user.systemRole === "admin" || user.systemRole === "super_admin") {
    actions.push({
      label: "Recent Users",
      icon: Users,
      action: () => router.push("/admin/users"),
      priority: "normal" as const,
    });

    actions.push({
      label: "Analytics",
      icon: BarChart3,
      action: () => router.push("/admin/analytics"),
      priority: "normal" as const,
    });
  }

  if (user.systemRole === "super_admin") {
    actions.push({
      label: "System Health",
      icon: Sparkles,
      action: () => router.push("/admin/system"),
      priority: "high" as const,
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Quick Actions Expandable Section */}
      <div className="p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            Quick Actions
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                    action.priority === "high"
                      ? "bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 hover:shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}>
                  <ActionIcon
                    size={16}
                    className={
                      action.priority === "high"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  />
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="p-3 pt-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 group">
          <LogOut
            size={18}
            className="shrink-0 transition-transform group-hover:scale-110"
          />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminNav;
