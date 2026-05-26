// app/(main)/layout.tsx
import MainHeader from "@/components/headerUi/MainHeader";
import BaseLayout from "@/components/layouts/base.layout";
import { BackgroundOverlay } from "@/components/ui/LoadingOverlay";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout
      maxWidth="container"
      innerClassName="flex-col p-2 space-y-2 relative">
      <BackgroundOverlay />

      {/* Header slot */}
      <div className="w-full shrink-0">
        <MainHeader />
      </div>
      <ScrollArea className="w-full flex-1 overflow-auto flex border rounded">
        {children}
      </ScrollArea>
    </BaseLayout>
  );
}
