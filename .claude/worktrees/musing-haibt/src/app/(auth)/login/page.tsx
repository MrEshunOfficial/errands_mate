//(auth)/login/page.tsx
import FeaturedCarousel from "@/components/auth/featured/FeaturedCarousel";
import { BaseAuthForm } from "@/components/auth/featured/shared/SharedAuthComponents";
import React from "react";

export default function Page() {
  return (
    <section className="w-full h-full flex p-2 justify-center flex-wrap gap-2">
      <aside className="w-1/3 overflow-y-auto flex flex-col items-center justify-center border-r rounded-md p-2">
        <BaseAuthForm mode="login" defaultMethod="google" />
      </aside>
      <article className="flex-1 flex items-center justify-center">
        <FeaturedCarousel />
      </article>
    </section>
  );
}
