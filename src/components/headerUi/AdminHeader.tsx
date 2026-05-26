import { HomeIcon } from "lucide-react";
import { ThemeModeToggle } from "./ThemeModeToggle";
import Link from "next/link";

export default function AdminHeader() {
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
