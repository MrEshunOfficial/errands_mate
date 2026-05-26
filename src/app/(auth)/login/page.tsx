//(auth)/login/page.tsx
import FeaturedCarousel from "@/components/auth/featured/FeaturedCarousel";
import { BaseAuthForm } from "@/components/auth/featured/shared/SharedAuthComponents";
import React from "react";

export default function Page() {
  return (
    <section className="w-full flex flex-col md:flex-row gap-2 py-4">
      <aside className="w-full md:w-2/5 lg:w-1/3 flex flex-col items-center justify-start md:justify-center border-b md:border-b-0 md:border-r rounded-md px-4 py-6 md:py-4">
        <BaseAuthForm mode="login" defaultMethod="google" />
      </aside>
      <article className="flex flex-1 items-center justify-center">
        <FeaturedCarousel />
      </article>
    </section>
  );
}
