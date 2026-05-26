"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const [isAnimated] = useState(true);
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back(); // Go back if possible
    } else {
      router.push("/login"); // Fallback route
    }
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="h-[calc(100vh-(--spacing(16)))] max-w-2xl mx-auto">
        <div className="w-full text-center">
          {/* Animated 404 Number */}
          <div
            className={`relative mb-8 transition-all duration-1000 ${
              isAnimated
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-blue-100 dark:text-gray-700 -z-10">
              404
            </div>
          </div>

          {/* Main Content */}
          <div
            className={`space-y-6 transition-all duration-1000 delay-300 ${
              isAnimated
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Oops! Page Not Found
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                The requested page could not be located. It may have been
                removed or is temporarily unavailable.
              </p>
            </div>

            {/* Floating Elements */}
            <div className="relative py-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-linear-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
              </div>
              <div className="relative">
                <svg
                  className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.691-2.583L12 9l5.691 3.417A7.962 7.962 0 0112 15z"
                  />
                </svg>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoHome}
                className="px-8 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Go Home
                </span>
              </button>

              <button
                onClick={handleGoBack}
                className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Go Back
                </span>
              </button>
            </div>

            {/* Helpful Links */}
            <div
              className={`pt-8 transition-all duration-1000 delay-500 ${
                isAnimated
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Or try one of these popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a
                  href="/about"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  About
                </a>
                <a
                  href="/contact"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Contact
                </a>
                <a
                  href="/help"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Help
                </a>
                <a
                  href="/blog"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Blog
                </a>
              </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
