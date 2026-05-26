//(auth)/login/page.tsx
import FeaturedCarousel from "@/components/auth/featured/FeaturedCarousel";
import { BaseAuthForm } from "@/components/auth/featured/shared/SharedAuthComponents";
import React from "react";

export default function Page() {
  return (
    <section className="w-full min-h-screen flex flex-col md:flex-row p-2 gap-2">
      <aside className="w-full md:w-2/5 lg:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r rounded-md p-4 md:p-2">
        <BaseAuthForm mode="login" defaultMethod="google" />
      </aside>
      <article className="hidden md:flex flex-1 items-center justify-center">
        <FeaturedCarousel />
      </article>
    </section>
  );
}
