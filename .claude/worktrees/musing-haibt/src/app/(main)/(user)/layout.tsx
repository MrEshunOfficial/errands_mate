// components/layouts/profile.layout.tsx
"use client";
import UserProfileNav from "@/components/layouts/UserProfileNav";
import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="h-full border-r border-border z-50">
        <UserProfileNav />
      </aside>
      {/* flex-1 + min-h-0 constrains height; overflow-hidden contains the child */}
      <section className="flex-1 min-h-0 overflow-hidden hide-scrollbar">
        {children}
      </section>
    </div>
  );
}
