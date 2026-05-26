// pages/admin/users/components/FilterPanel.tsx

import {
  Users,
  Shield,
  ShieldCheck,
  CheckCircle,
  Clock,
  Trash2,
  X,
  UserCog,
  SlidersHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: {
    status: string;
    role: string;
  };
  onFilterChange: (key: "status" | "role", value: string) => void;
  onReset: () => void;
}

// ─── Option Definitions ───────────────────────────────────────────────────────

interface StatusOption {
  value: string;
  label: string;
  icon: React.ElementType;
  activeClass: string;
  dotClass: string;
}

interface RoleOption {
  value: string;
  label: string;
  icon: React.ElementType;
  activeClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "all",
    label: "All",
    icon: Users,
    activeClass:
      "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white",
    dotClass: "bg-gray-400",
  },
  {
    value: "active",
    label: "Active",
    icon: CheckCircle,
    activeClass:
      "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500",
    dotClass: "bg-emerald-500",
  },
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
    activeClass:
      "bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-900 border-amber-500 dark:border-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    value: "deleted",
    label: "Deleted",
    icon: Trash2,
    activeClass:
      "bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500",
    dotClass: "bg-red-500",
  },
];

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "all",
    label: "All Roles",
    icon: Users,
    activeClass:
      "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white",
  },
  {
    value: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    activeClass:
      "bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500",
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    activeClass:
      "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500",
  },
  {
    value: "user",
    label: "User",
    icon: UserCog,
    activeClass:
      "bg-gray-500 dark:bg-gray-400 text-white dark:text-gray-900 border-gray-500 dark:border-gray-400",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
}: FilterPanelProps) {
  const hasActiveFilters = filters.status !== "all" || filters.role !== "all";

  const activeStatus = STATUS_OPTIONS.find((o) => o.value === filters.status);
  const activeRole = ROLE_OPTIONS.find((o) => o.value === filters.role);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Filter Users
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold">
              {(filters.status !== "all" ? 1 : 0) +
                (filters.role !== "all" ? 1 : 0)}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* ── Status ── */}
        <div>
          <SectionLabel icon={CheckCircle}>Status</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon, activeClass }) => {
              const isActive = filters.status === value;
              return (
                <button
                  key={value}
                  onClick={() => onFilterChange("status", value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isActive
                      ? activeClass
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* ── Role ── */}
        <div>
          <SectionLabel icon={Shield}>Role</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {ROLE_OPTIONS.map(({ value, label, icon: Icon, activeClass }) => {
              const isActive = filters.role === value;
              return (
                <button
                  key={value}
                  onClick={() => onFilterChange("role", value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isActive
                      ? activeClass
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Active filter summary chips ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-0.5">
            Active:
          </span>

          {filters.status !== "all" && activeStatus && (
            <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
              <activeStatus.icon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {activeStatus.label}
              <button
                onClick={() => onFilterChange("status", "all")}
                className="ml-0.5 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.role !== "all" && activeRole && (
            <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
              <activeRole.icon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {activeRole.label}
              <button
                onClick={() => onFilterChange("role", "all")}
                className="ml-0.5 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
