// components/ui/Loading.tsx
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export default function Loading({
  fullScreen = false,
  message = "Loading...",
  className,
}: LoadingProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-background/80 z-50"
    : "flex items-center justify-center";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
