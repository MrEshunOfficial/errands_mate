// config/navigation.config.ts
import {
  Heart,
  Settings,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Edit,
  ClipboardList,
  ListTodo,
  ImageIcon,
  LayoutDashboard,
} from "lucide-react";
import { NavigationLink } from "./ProfNavigationLinksTypes";
import { UserRole } from "@/types/base.types";

// =============================================================================
// Config
// =============================================================================

export const UNIFIED_NAVIGATION_CONFIG: NavigationLink[] = [
  {
    id: "profile",
    label: "Workspace",
    icon: LayoutDashboard,
    href: "/profile",
    roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
    children: [
      {
        id: "profile-view",
        label: "About Me",
        icon: Briefcase,
        href: "/profile",
        roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
      },
      {
        id: "client-dashboard",
        label: "Dashboard",
        icon: Briefcase,
        href: "/client/dashboard",
        roles: [UserRole.CUSTOMER],
      },
      {
        id: "provider-dashboard",
        label: "Dashboard",
        icon: Briefcase,
        href: "/provider/dashboard",
        roles: [UserRole.PROVIDER],
      },

      {
        id: "provider-gallery",
        label: "Business Gallery",
        icon: ImageIcon,
        href: "/profile/p/gallery",
        roles: [UserRole.PROVIDER],
      },
      {
        id: "customer-gallery",
        label: "My Gallery",
        icon: ImageIcon,
        href: "/profile/c/gallery",
        roles: [UserRole.CUSTOMER],
      },
    ],
  },
  {
    id: "tasks-customer",
    label: "Tasks",
    icon: ClipboardList,
    href: "/client/tasks",
    roles: [UserRole.CUSTOMER],
    children: [
      {
        id: "my-tasks",
        label: "New Task",
        icon: ListTodo,
        href: "/client/tasks/new",
        roles: [UserRole.CUSTOMER],
      },
    ],
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Heart,
    href: "/client/favorites",
    roles: [UserRole.CUSTOMER],
  },
  {
    id: "services",
    label: "My Services",
    icon: Briefcase,
    href: "/provider/:providerId/services",
    roles: [UserRole.PROVIDER],
    children: [
      {
        id: "services-manage",
        label: "Manage Services",
        icon: Briefcase,
        href: "/provider/:providerId/services",
        roles: [UserRole.PROVIDER],
      },
      {
        id: "services-create",
        label: "Create Service",
        icon: Edit,
        href: "/provider/:providerId/services/create",
        roles: [UserRole.PROVIDER],
      },
    ],
  },
  {
    id: "tasks-provider",
    label: "Jobs",
    icon: ClipboardList,
    href: "/provider",
    roles: [UserRole.PROVIDER],
    children: [
      {
        id: "tasks-available",
        label: "Task Pool",
        icon: ListTodo,
        href: "/provider/tasks/available",
        roles: [UserRole.PROVIDER],
      },
    ],
  },
  {
    id: "dashboard",
    label: "Operations",
    icon: TrendingUp,
    href: "/provider",
    roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
    children: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        href: "/settings",
        roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
      },
      {
        id: "help",
        label: "Help & Support",
        icon: HelpCircle,
        href: "/help",
        roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
      },
    ],
  },
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Replaces the `:providerId` placeholder in a route template with the
 * actual provider profile ID.
 *
 * @example
 * resolveHref("/provider/:providerId/services", "abc123")
 * // → "/provider/abc123/services"
 */
export function resolveHref(
  href: string | undefined,
  providerId?: string,
): string | undefined {
  if (!href) return href;
  if (!providerId) return href.replace("/:providerId", "");
  return href.replace(":providerId", providerId);
}

/**
 * Returns navigation links filtered by role, with `:providerId` placeholders
 * resolved on all provider-scoped routes.
 */
export const getNavigationByRole = (
  role: UserRole,
  providerId?: string,
): NavigationLink[] => {
  return UNIFIED_NAVIGATION_CONFIG.filter((link) =>
    link.roles.includes(role),
  ).map((link) => ({
    ...link,
    href: resolveHref(link.href, providerId),
    children: link.children
      ?.filter((child) => child.roles.includes(role))
      .map((child) => ({
        ...child,
        href: resolveHref(child.href, providerId),
      })),
  }));
};
