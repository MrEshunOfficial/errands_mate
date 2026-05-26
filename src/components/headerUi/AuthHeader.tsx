import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ThemeModeToggle } from "./ThemeModeToggle";

export default function AuthHeader() {
  return (
    <header className="border rounded-2xl p-3 flex items-center justify-between bg-background text-foreground shadow-sm">
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-all"
      >
        <HomeIcon size={18} />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <ThemeModeToggle />
    </header>
  );
}
