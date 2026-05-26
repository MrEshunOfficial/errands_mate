"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminNav } from "@/components/layouts/AdminDashboardNav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="w-full h-full flex gap-2 p-2 relative">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-80 h-full shrink-0">
        <AdminNav />
      </aside>

      {/* Mobile nav Sheet */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          <AdminNav />
        </SheetContent>
      </Sheet>

      <main className="flex-1 h-full overflow-y-auto hide-scrollbar">
        {/* Mobile nav trigger */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b bg-background sticky top-0 z-30 mb-2">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open admin navigation"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Admin Menu</span>
        </div>
        {children}
      </main>
    </div>
  );
}
