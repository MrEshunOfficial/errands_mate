// types/navigation.types.ts
import { UserRole } from "@/types/base.types";
import { LucideIcon } from "lucide-react";

export interface NavigationLink {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  roles: UserRole[];
  children?: NavigationLink[];
  action?: "navigate" | "custom";
}

export interface CTAConfig {
  label: string;
  description: string;
  action: () => void;
  roles: UserRole[];
}