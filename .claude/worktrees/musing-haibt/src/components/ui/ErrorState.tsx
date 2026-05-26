import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorStateSeverity = "error" | "warning" | "info";
type ErrorStateSize = "sm" | "md" | "lg";
type ErrorStateVariant = "default" | "dashed" | "ghost";

interface ErrorStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface ErrorStateProps {
  // Content
  title?: string;
  message?: string;
  details?: string; // e.g. error code or technical detail for power users

  // Actions — first is treated as primary if variant not set
  actions?: ErrorStateAction[];

  // Appearance
  severity?: ErrorStateSeverity;
  size?: ErrorStateSize;
  variant?: ErrorStateVariant;
  icon?: React.ReactNode; // override the default severity icon

  // Layout
  className?: string;
}

// ─── Size Config ──────────────────────────────────────────────────────────────

const sizeMap: Record<
  ErrorStateSize,
  {
    wrapper: string;
    icon: string;
    title: string;
    message: string;
    details: string;
    gap: string;
  }
> = {
  sm: {
    wrapper: "py-8 px-4",
    icon: "w-8 h-8",
    title: "text-sm font-semibold",
    message: "text-xs",
    details: "text-xs font-mono",
    gap: "gap-2",
  },
  md: {
    wrapper: "py-12 px-6",
    icon: "w-10 h-10",
    title: "text-base font-semibold",
    message: "text-sm",
    details: "text-xs font-mono",
    gap: "gap-3",
  },
  lg: {
    wrapper: "py-20 px-8",
    icon: "w-14 h-14",
    title: "text-xl font-semibold",
    message: "text-base",
    details: "text-sm font-mono",
    gap: "gap-4",
  },
};

const variantMap: Record<ErrorStateVariant, string> = {
  default: "bg-gray-50 rounded-xl",
  dashed: "border-2 border-dashed rounded-xl bg-transparent",
  ghost: "bg-transparent",
};

// Per-severity: icon color, dashed border color, title color
const severityMap: Record<
  ErrorStateSeverity,
  {
    iconColor: string;
    borderColor: string;
    titleColor: string;
    detailsBg: string;
  }
> = {
  error: {
    iconColor: "text-red-400",
    borderColor: "border-red-200",
    titleColor: "text-red-700",
    detailsBg: "bg-red-50 text-red-600",
  },
  warning: {
    iconColor: "text-amber-400",
    borderColor: "border-amber-200",
    titleColor: "text-amber-700",
    detailsBg: "bg-amber-50 text-amber-600",
  },
  info: {
    iconColor: "text-blue-400",
    borderColor: "border-blue-200",
    titleColor: "text-blue-700",
    detailsBg: "bg-blue-50 text-blue-600",
  },
};

// ─── Default Icons ────────────────────────────────────────────────────────────

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const defaultIcons: Record<
  ErrorStateSeverity,
  React.FC<{ className?: string }>
> = {
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  details,
  actions,
  severity = "error",
  size = "md",
  variant = "default",
  icon,
  className = "",
}) => {
  const sz = sizeMap[size];
  const sv = severityMap[severity];

  // Dashed variant picks up the severity border colour
  const variantClass =
    variant === "dashed"
      ? `border-2 border-dashed rounded-xl bg-transparent ${sv.borderColor}`
      : variantMap[variant];

  const DefaultIcon = defaultIcons[severity];

  return (
    <div
      className={[
        "w-full flex flex-col items-center justify-center text-center",
        sz.wrapper,
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon */}
      <div className={["mb-1", sv.iconColor].join(" ")}>
        {icon ? (
          <span className={sz.icon}>{icon}</span>
        ) : (
          <DefaultIcon className={sz.icon} />
        )}
      </div>

      {/* Text */}
      <div className={["flex flex-col items-center", sz.gap].join(" ")}>
        <p className={[sv.titleColor, sz.title].join(" ")}>{title}</p>

        {message && (
          <p className={["text-gray-500 max-w-sm", sz.message].join(" ")}>
            {message}
          </p>
        )}

        {/* Technical detail — subtle, not alarming */}
        {details && (
          <p
            className={[
              "max-w-sm px-3 py-1.5 rounded-md",
              sv.detailsBg,
              sz.details,
            ].join(" ")}
          >
            {details}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div
          className={[
            "flex flex-wrap items-center justify-center gap-2 mt-2",
            sz.gap,
          ].join(" ")}
        >
          {actions.map((action, i) => {
            const isPrimary =
              action.variant === "primary" ||
              (action.variant === undefined && i === 0);

            return isPrimary ? (
              <button
                key={i}
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {action.label}
              </button>
            ) : (
              <button
                key={i}
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 transition-colors"
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
