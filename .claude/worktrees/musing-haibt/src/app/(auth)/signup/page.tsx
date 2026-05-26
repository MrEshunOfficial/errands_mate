//(auth)/signup/page.tsx
import FeaturedCarousel from "@/components/auth/featured/FeaturedCarousel";
import { BaseAuthForm } from "@/components/auth/featured/shared/SharedAuthComponents";
import React from "react";

export default function Page() {
  return (
    <section className="w-full h-full flex p-2 justify-center flex-wrap gap-2">
      <aside className="w-1/3 overflow-y-auto flex flex-col items-center justify-center border-r rounded-md p-2">
        <BaseAuthForm mode="register" defaultMethod="email" />
      </aside>
      <article className="flex-1 overflow-y-auto flex items-center justify-center hide-scrollbar">
        <FeaturedCarousel />
      </article>
    </section>
  );
}
