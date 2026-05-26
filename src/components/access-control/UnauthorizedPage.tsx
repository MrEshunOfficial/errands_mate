"use client";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { BackgroundOverlay } from "@/components/ui/LoadingOverlay";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function UnauthorizedPage() {
  const router = useRouter();
  const mounted = useIsMounted();

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-6 overflow-hidden">
      <BackgroundOverlay />

      <div className="relative z-10 max-w-md w-full">
        {/* Error code */}
        <p className="text-xs font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-6">
          Error 403
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-zinc-900 dark:bg-zinc-100 mb-8" />

        {/* Heading */}
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Access denied
        </h1>

        {/* Description */}
        <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed mb-10">
          You don&apos;t have permission to view this page. This may be due to
          insufficient privileges or an expired session.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>

          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors duration-150"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        {/* Footer help text */}
        <p className="mt-12 text-xs text-zinc-400 dark:text-zinc-600">
          Think this is a mistake?{" "}
          <button
            onClick={() => router.push("/contact")}
            className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            Contact support
          </button>
        </p>
      </div>
    </div>
  );
}
