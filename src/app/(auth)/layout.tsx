// app/(auth)/layout.tsx
import { BackgroundOverlay } from "@/components/ui/LoadingOverlay";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-h-screen bg-white dark:bg-black overflow-y-auto">
      <BackgroundOverlay />
      <main className="relative w-full max-w-7xl mx-auto p-3">
        {children}
      </main>
    </div>
  );
}
