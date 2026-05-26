"use client";

// components/HomePage.tsx

import { Shield, TrendingUp, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { UserRole } from "@/types/base.types";
import RightContentWrapper from "@/components/homepage/RightContentWrapper";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import HowItWorks from "../layouts/HowItWorks";

// ── CTA shapes ─────────────────────────────────────────────────────────────────

interface CtaLink {
  type: "link";
  label: string;
  route: string;
}

interface CtaPair {
  type: "pair";
  primary: { label: string; route: string };
  secondary: { label: string; route: string };
}

// ── Role-keyed hero content ────────────────────────────────────────────────────

interface BadgeConfig {
  label: string;
  sub: string;
}

interface HeroView {
  headingLine1: string;
  headingLine2: string;
  body: string;
  badge1: BadgeConfig;
  badge2: BadgeConfig;
  cta: CtaLink | CtaPair;
}

const HERO_VIEWS: Record<"visitor" | "client" | "provider", HeroView> = {
  visitor: {
    headingLine1: "Get things done.",
    headingLine2: "Or get paid doing them.",
    body: "Whether you need help with errands and home services, or you're a skilled provider looking for steady work — ErrandsMate connects both sides.",
    badge1: {
      label: "Trusted & Verified",
      sub: "All members vetted",
    },
    badge2: {
      label: "Flexible for All",
      sub: "Clients and providers",
    },
    cta: {
      type: "pair",
      primary: { label: "I need help", route: "/register" },
      secondary: { label: "I offer services", route: "/register" },
    },
  },

  client: {
    headingLine1: "Post a task and find",
    headingLine2: "the right helper instantly",
    body: "Post what you need and receive fast responses from trusted providers ready to help—whether it's daily errands, home services, or specialised tasks.",
    badge1: {
      label: "Verified Providers",
      sub: "Background checked",
    },
    badge2: {
      label: "Best Rates",
      sub: "Competitive pricing",
    },
    cta: {
      type: "link",
      label: "View my tasks",
      route: "/tasks/posted",
    },
  },

  provider: {
    headingLine1: "Find tasks and",
    headingLine2: "grow your business",
    body: "Connect with clients who need your services. Browse available tasks, respond to opportunities, and build your reputation on our trusted platform.",
    badge1: {
      label: "Verified Clients",
      sub: "Background checked",
    },
    badge2: {
      label: "Fast Payments",
      sub: "Reliable earnings",
    },
    cta: {
      type: "link",
      label: "Browse available tasks",
      route: "/tasks",
    },
  },
};

// ── Loading skeleton ───────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="w-full h-full bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-start animate-pulse">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-12 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-12 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          </div>
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, loading: profileLoadingState } = useProfile(isAuthenticated);
  const profileLoading = profileLoadingState.profile;

  // Show skeleton while we don't yet know the user's role
  if (authLoading || (isAuthenticated && profileLoading)) {
    return <HeroSkeleton />;
  }

  const userRole = profile?.role;
  const isProvider = userRole === UserRole.PROVIDER;

  const viewKey = !isAuthenticated ? "visitor" : isProvider ? "provider" : "client";
  const view = HERO_VIEWS[viewKey];

  return (
    <>
      <div className="w-full h-full bg-gray-50 dark:bg-gray-950 relative">
        {/* Subtle teal ambient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-48 -left-24 w-72 h-72 bg-teal-300/10 dark:bg-teal-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* ── Left column ── */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                {view.headingLine1}
                <span className="block text-teal-600 dark:text-teal-400">
                  {view.headingLine2}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                {view.body}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950">
                    <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {view.badge1.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {view.badge1.sub}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {view.badge2.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {view.badge2.sub}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CTA ── */}
              <div className="pt-2">
                {view.cta.type === "pair" ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => router.push((view.cta as CtaPair).primary.route)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm">
                      {(view.cta as CtaPair).primary.label}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push((view.cta as CtaPair).secondary.route)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-sm font-semibold transition-colors">
                      {(view.cta as CtaPair).secondary.label}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  isAuthenticated && (
                    <button
                      onClick={() => router.push((view.cta as CtaLink).route)}
                      className="inline-flex items-center gap-2 font-medium transition-colors group text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
                      {(view.cta as CtaLink).label}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ── Right column — role-aware widget ── */}
            <RightContentWrapper
              isAuthenticated={isAuthenticated}
              authLoading={authLoading}
              profileLoading={profileLoading}
              userRole={userRole}
              onBrowseServices={() => router.push("/services")}
            />
          </div>
        </div>

        <HowItWorks
          userRole={
            !isAuthenticated ? "visitor" : isProvider ? "provider" : "client"
          }
        />
      </div>
    </>
  );
}
