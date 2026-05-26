// components/LoadingOverlay.tsx
import React from "react";

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
}

export default function LoadingOverlay({
  message = "Updating preferences...",
  show = false,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 rounded-2xl flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated dots */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Message */}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {message}
        </span>
      </div>
    </div>
  );
}

export const BackgroundOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 opacity-25 dark:opacity-35 pointer-events-none">
      <div className="w-full h-full bg-linear-to-br from-red-100 via-pink-50 to-blue-100 dark:from-red-950 dark:via-pink-950 dark:to-blue-950 blur-3xl"></div>
    </div>
  );
};
