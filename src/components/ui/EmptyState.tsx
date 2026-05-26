import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type EmptyStateSize = "sm" | "md" | "lg";
type EmptyStateVariant = "default" | "dashed" | "ghost" | "soft";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  size?: EmptyStateSize;
  variant?: EmptyStateVariant;
  className?: string;
}

// --- Size Config ---
const sizeConfig = {
  sm: {
    container: "py-8 px-6",
    iconWrap: "w-10 h-10",
    iconInner: "w-5 h-5",
    title: "text-sm font-semibold",
    description: "text-xs",
    gap: "gap-2",
    actionsTop: "mt-4",
  },
  md: {
    container: "py-14 px-10",
    iconWrap: "w-14 h-14",
    iconInner: "w-6 h-6",
    title: "text-base font-semibold",
    description: "text-sm",
    gap: "gap-2",
    actionsTop: "mt-6",
  },
  lg: {
    container: "py-20 px-16",
    iconWrap: "w-16 h-16",
    iconInner: "w-7 h-7",
    title: "text-lg font-semibold",
    description: "text-sm",
    gap: "gap-2.5",
    actionsTop: "mt-8",
  },
};

// --- Variant Config ---
const variantConfig: Record<EmptyStateVariant, string> = {
  default:
    "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm",
  soft: "bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/50",
  dashed:
    "border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent",
  ghost: "bg-transparent border-transparent",
};

// --- Action Button ---
const ActionButton = ({
  action,
  isPrimary,
}: {
  action: EmptyStateAction;
  isPrimary: boolean;
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-40 select-none";

  const variants = {
    primary:
      "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 shadow-sm",
    secondary:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700",
    outline:
      "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
  };

  const selected = action.variant ?? (isPrimary ? "primary" : "outline");

  return (
    <button onClick={action.onClick} className={cn(base, variants[selected])}>
      {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
      {action.label}
    </button>
  );
};

// --- Default Icon ---
const DefaultIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full">
    <path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
);

// --- Decorative Ring ---
const IconRing = ({
  size,
  children,
}: {
  size: EmptyStateSize;
  children: React.ReactNode;
}) => {
  const config = sizeConfig[size];

  return (
    <div className="relative flex items-center justify-center mb-5">
      {/* Outer faint ring */}
      <div
        className={cn(
          "absolute rounded-full border border-zinc-200 dark:border-zinc-700/60 opacity-60",
          size === "sm" && "w-16 h-16",
          size === "md" && "w-20 h-20",
          size === "lg" && "w-24 h-24",
        )}
      />
      {/* Mid ring */}
      <div
        className={cn(
          "absolute rounded-full border border-zinc-200 dark:border-zinc-700/40 opacity-30",
          size === "sm" && "w-20 h-20",
          size === "md" && "w-24 h-24",
          size === "lg" && "w-28 h-28",
        )}
      />
      {/* Icon container */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full z-10",
          "bg-zinc-100 dark:bg-zinc-800",
          "border border-zinc-200 dark:border-zinc-700",
          "text-zinc-500 dark:text-zinc-400",
          "shadow-sm",
          config.iconWrap,
        )}>
        <span className={config.iconInner}>{children}</span>
      </div>
    </div>
  );
};

// --- Badge (optional slot for status labels) ---
export const EmptyStateBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
    {label}
  </span>
);

// --- Main Component ---
export const EmptyState = ({
  icon,
  title,
  description,
  actions = [],
  size = "md",
  variant = "default",
  className,
}: EmptyStateProps) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "h-full relative flex flex-col items-center justify-center text-center rounded-2xl overflow-hidden",
        variantConfig[variant],
        config.container,
        className,
      )}>
      {/* Subtle radial glow in background */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden>
        <div className="w-64 h-64 rounded-full bg-zinc-100 dark:bg-zinc-800/50 blur-3xl opacity-50" />
      </div>

      {/* Icon */}
      <IconRing size={size}>{icon ?? <DefaultIcon />}</IconRing>

      {/* Text */}
      <div
        className={cn(
          "relative flex flex-col items-center max-w-xs",
          config.gap,
        )}>
        <h3
          className={cn(
            "tracking-tight text-zinc-900 dark:text-zinc-50",
            config.title,
          )}>
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "text-zinc-500 dark:text-zinc-400 leading-relaxed",
              config.description,
            )}>
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div
          className={cn(
            "relative flex flex-wrap items-center justify-center gap-2.5",
            config.actionsTop,
          )}>
          {actions.map((action, i) => (
            <ActionButton
              key={action.label}
              action={action}
              isPrimary={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
