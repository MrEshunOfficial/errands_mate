"use client";

import BaseLayout from "@/components/layouts/base.layout";
// app/(admin)/layout.tsx
import LoadingOverlay, {
  BackgroundOverlay,
} from "@/components/ui/LoadingOverlay";
import { useAuth } from "@/hooks/auth/useAuth";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingOverlay
        show={true}
        message="Getting admin ready... please wait"
      />
    );
  }

  return (
    <BaseLayout maxWidth="container">
      <div className="w-full h-dvh flex flex-col p-2 relative">
        <BackgroundOverlay />
        {/* Content */}
        <main
          className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden border rounded"
        >
          {children}
        </main>
      </div>
    </BaseLayout>
  );
}
