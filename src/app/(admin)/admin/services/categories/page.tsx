
import CategoryListPanel from "@/components/operations/services/categories/admin/CategoryListPanel";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Briefcase, Home, Shield } from "lucide-react";

export default function page() {
  return (
    <main className="h-full space-y-2 relative hide-scrollbar">
      <div className="absolute inset-0 opacity-25 dark:opacity-35 pointer-events-none">
        <div className="w-full h-full bg-linear-to-br from-red-100 via-pink-50 to-blue-100 dark:from-red-950 dark:via-pink-950 dark:to-blue-950 blur-3xl"></div>
      </div>
      {/* Breadcrumb */}
      <div className="w-full p-3 border-b">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors">
                  <Home className="w-4 h-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors">
                  <Shield className="w-4 h-4" />
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin/service"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors">
                  <Briefcase className="w-4 h-4" />
                  Services
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                  Service Categories
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Content */}
      <section className="w-full relative overflow-hidden flex flex-col gap-2 items-center justify-center">
        <CategoryListPanel />
      </section>
    </main>
  );
}
