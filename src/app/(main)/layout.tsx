// app/(main)/layout.tsx
import MainHeader from "@/components/headerUi/MainHeader";
import BaseLayout from "@/components/layouts/base.layout";
import { BackgroundOverlay } from "@/components/ui/LoadingOverlay";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout
      maxWidth="container"
      innerClassName="flex-col p-2 space-y-2 relative">
      <BackgroundOverlay />

      <div className="w-full shrink-0">
        <MainHeader />
      </div>

      {/*
        flex-1 + min-h-0: the critical pair for a flex-column child.
        Without min-h-0, the browser uses content height as the minimum,
        blowing past the viewport. overflow-hidden seals it so children
        manage their own scroll — the sidebar won't scroll here.
      */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden border rounded">
        {children}
      </div>
    </BaseLayout>
  );
}
