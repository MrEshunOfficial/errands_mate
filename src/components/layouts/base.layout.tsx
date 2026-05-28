// components/layouts/base.layout.tsx
import type { ReactNode } from "react";

interface BaseLayoutProps {
  children: ReactNode;
  maxWidth?: string;
  innerClassName?: string;
  background?: string;
  height?: string;
}

export default function BaseLayout({
  children,
  maxWidth = "max-w-screen",
  innerClassName = "",
  background = "bg-white dark:bg-black",
  height = "h-dvh",
}: BaseLayoutProps) {
  return (
    <div
      className={`flex w-full items-center justify-center ${background} ${height}`}>
      <main
        className={`w-full h-full ${maxWidth} flex items-center justify-center ${innerClassName}`}>
        {children}
      </main>
    </div>
  );
}
