// config/navigation.config.ts
import {
  Settings,
  HelpCircle,
  Briefcase,
  Edit,
  LayoutDashboard,
  Image,
  ClipboardList,
  Send,
  Inbox,
  BookOpen,
  ListTodo,
  UserCog,
} from "lucide-react";
import { NavigationLink } from "./ProfNavigationLinksTypes";
import { UserRole } from "@/types/base.types";

// =============================================================================
// Config
// =============================================================================

export const UNIFIED_NAVIGATION_CONFIG: NavigationLink[] = [
  {
    id: "client-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: [UserRole.CUSTOMER],
  },
  // Provider: grouped workspace with profile, dashboard, and gallery
  {
    id: "workspace",
    label: "Workspace",
    icon: LayoutDashboard,
    href: "/profile",
    roles: [UserRole.PROVIDER],
    children: [
      {
        id: "profile-view-provider",
        label: "About Me",
        icon: Briefcase,
        href: "/profile",
        roles: [UserRole.PROVIDER],
      },
      {
        id: "provider-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/provider/dashboard",
        roles: [UserRole.PROVIDER],
      },
      {
        id: "provider-gallery",
        label: "Gallery",
        icon: Image,
        href: "/provider/gallery",
        roles: [UserRole.PROVIDER],
      },
    ],
  },
  {
    id: "services",
    label: "My Services",
    icon: Briefcase,
    href: "/provider/services",
    roles: [UserRole.PROVIDER],
    children: [
      {
        id: "services-manage",
        label: "Manage Services",
        icon: Briefcase,
        href: "/provider/services",
        roles: [UserRole.PROVIDER],
      },
      {
        id: "services-create",
        label: "Create Service",
        icon: Edit,
        href: "/provider/services/create",
        roles: [UserRole.PROVIDER],
      },
    ],
  },
  {
    id: "tasks",
    label: "My Tasks",
    icon: ClipboardList,
    href: "/tasks",
    roles: [UserRole.CUSTOMER],
  },
  {
    id: "my-requests",
    label: "My Requests",
    icon: Send,
    href: "/my-requests",
    roles: [UserRole.CUSTOMER],
  },
  {
    id: "my-bookings",
    label: "My Bookings",
    icon: BookOpen,
    href: "/my-bookings",
    roles: [UserRole.CUSTOMER],
  },
  {
    id: "provider-tasks",
    label: "Available Tasks",
    icon: ListTodo,
    href: "/provider/tasks/available",
    roles: [UserRole.PROVIDER],
  },
  {
    id: "provider-requests",
    label: "Requests",
    icon: Inbox,
    href: "/provider/requests",
    roles: [UserRole.PROVIDER],
  },
  {
    id: "provider-bookings",
    label: "My Jobs",
    icon: BookOpen,
    href: "/provider/bookings",
    roles: [UserRole.PROVIDER],
  },
  {
    id: "settings",
    label: "Preferences",
    icon: Settings,
    href: "/client/preferences",
    roles: [UserRole.CUSTOMER],
  },
  {
    id: "account-settings",
    label: "Account",
    icon: UserCog,
    href: "/settings/account",
    roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    href: "/help",
    roles: [UserRole.CUSTOMER, UserRole.PROVIDER],
  },
];

// =============================================================================
// Helpers
// =============================================================================

export const getNavigationByRole = (role: UserRole): NavigationLink[] => {
  return UNIFIED_NAVIGATION_CONFIG.filter((link) =>
    link.roles.includes(role),
  ).map((link) => ({
    ...link,
    children: link.children?.filter((child) => child.roles.includes(role)),
  }));
};
