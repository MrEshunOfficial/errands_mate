"use client";

import type { ReactNode } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
      {children}
    </Label>
  );
}

export function ReadValue({
  label,
  value,
  empty = "Not set",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p
        className={
          value
            ? "text-sm font-semibold text-foreground"
            : "text-sm italic text-muted-foreground/60"
        }>
        {value || empty}
      </p>
    </div>
  );
}

export function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${className}`}>
      <Icon size={16} />
    </span>
  );
}

export interface InlineFeedbackProps {
  loading: boolean;
  error: string | null;
  success: boolean;
  successMsg?: string;
}

export function InlineFeedback({
  loading,
  error,
  success,
  successMsg = "Saved",
}: InlineFeedbackProps) {
  if (loading)
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  if (error)
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle size={12} /> {error}
      </span>
    );
  if (success)
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={12} /> {successMsg}
      </span>
    );
  return null;
}
