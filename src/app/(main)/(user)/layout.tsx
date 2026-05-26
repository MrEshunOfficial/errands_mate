// components/layouts/profile.layout.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogOut, Menu, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import UserProfileNav from "@/components/layouts/UserProfileNav";
import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { exists, loading: profileLoading, fetchExists } = useProfile(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchExists();
  }, [fetchExists]);

  const isSetupRoute = pathname?.includes("/profile/setup");

  // Re-fetch when leaving the setup route so the layout picks up the
  // newly-created profile without a full page reload.
  const prevIsSetupRef = useRef(isSetupRoute);
  useEffect(() => {
    if (prevIsSetupRef.current && !isSetupRoute) {
      fetchExists();
    }
    prevIsSetupRef.current = isSetupRoute;
  }, [isSetupRoute, fetchExists]);
  // exists starts as null (unchecked) — fetchDone only once we have a real answer
  const fetchDone = !authLoading && !profileLoading.exists && exists !== null;
  const profileMissing = fetchDone && exists === false;

  // Determining profile state — show a neutral spinner, not the nav skeleton
  if (!fetchDone) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Profile not set up yet
  if (profileMissing) {
    // Let the setup page render cleanly without any sidebar
    if (isSetupRoute) {
      return (
        <main className="w-full h-full overflow-auto hide-scrollbar">
          {children}
        </main>
      );
    }

    // Any other protected page — block access and prompt setup
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-sm px-6 py-12">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950">
              <UserCircle className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Complete your profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
            You need to set up your profile before you can access your
            dashboard. It only takes a minute.
          </p>
          <button
            onClick={() => router.push("/profile/setup")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-500/25">
            Set up my profile
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/logout")}
            className="inline-flex items-center gap-2 mt-3 px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors w-full justify-center">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Profile exists — normal layout
  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar — CSS-hidden on mobile; Sheet portal inside still works on mobile */}
      <aside className="hidden lg:flex shrink-0 h-full border-r border-border z-50">
        <UserProfileNav
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </aside>
      <section className="flex-1 min-h-0 overflow-auto hide-scrollbar">
        {/* Mobile nav trigger — only shown on mobile */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b bg-background sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Menu</span>
        </div>
        {children}
      </section>
    </div>
  );
}
