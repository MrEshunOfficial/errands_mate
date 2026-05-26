"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, Coffee, Moon, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

const LogoutPage = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully.");
      router.push("/");
    } catch (err) {
      toast.error("Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => router.push("/profile");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Coffee };
    if (hour < 17) return { text: "Good afternoon", icon: TrendingUp };
    return { text: "Good evening", icon: Moon };
  };

  const { text, icon: Icon } = getGreeting();

  return (
    <div className="w-full max-w-md border-2 p-2 border-dashed rounded-2xl shadow-xl">
      {/* Header */}
      <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {text}, {user?.name || "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to log out?
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="text-sm text-gray-700 dark:text-gray-300 text-center leading-relaxed">
          Your work is saved automatically. You can continue right where you
          left off when you sign back in.
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 font-medium transition"
          >
            {isLoggingOut ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging out…
              </span>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Log out
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
