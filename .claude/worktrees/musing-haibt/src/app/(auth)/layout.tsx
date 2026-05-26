// app/(auth)/layout.tsx
import BaseLayout from "@/components/layouts/base.layout";
import { BackgroundOverlay } from "@/components/ui/LoadingOverlay";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // maxWidth = width constraint only; positioning/padding go in innerClassName
    <BaseLayout maxWidth="max-w-7xl" innerClassName="relative p-3">
      <BackgroundOverlay />
      <main className="w-full overflow-hidden hide-scrollbar p-1">
        {children}
      </main>
    </BaseLayout>
  );
}
