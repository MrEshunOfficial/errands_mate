"use client";

// components/homepage/RightContentWrapper.tsx

import React from "react";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/base.types";
// import PostTaskForm from "@/components/operations/task_operations/clients/forms/tasks/PostTaskForm";
import VisitorView from "@/components/homepage/VisitorView";
// import { TaskWithProvidersResponse } from "@/types/task/task.types";
import ProviderDashboard from "./ProviderDashboard";

export interface RightContentWrapperProps {
  isAuthenticated: boolean;
  /** True while the auth session is still being resolved */
  authLoading: boolean;
  /** True while the core user profile is being fetched (loading.profile) */
  profileLoading: boolean;
  /** Undefined until the profile resolves */
  userRole: UserRole | undefined;
  onBrowseServices: () => void;
  // onTaskCreated?: (response: TaskWithProvidersResponse) => void;
}

export default function RightContentWrapper({
  isAuthenticated,
  authLoading,
  profileLoading,
  userRole,
}: RightContentWrapperProps) {
  // ── 1. Auth or profile still resolving ────────────────────────────────────
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <VisitorView />;
  }
  if (userRole === UserRole.PROVIDER) {
    return <ProviderDashboard />;
  }
  return <div>task form here</div>;
}
