// app/(public)/layout.tsx
import BaseLayout from "@/components/layouts/base.layout";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout maxWidth="container" height="h-full">
      <div className="w-full h-full">{children}</div>
    </BaseLayout>
  );
}
