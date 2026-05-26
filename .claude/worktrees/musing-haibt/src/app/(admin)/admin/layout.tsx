"use client";
import { AdminNav } from "@/components/layouts/AdminDashboardNav";
import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full flex gap-2 p-2 relative">
      <aside className="w-80 h-full">
        <AdminNav />
      </aside>
      <main className="flex-1 h-full overflow-y-auto hide-scrollbar">
        {children}
      </main>
    </div>
  );
}
