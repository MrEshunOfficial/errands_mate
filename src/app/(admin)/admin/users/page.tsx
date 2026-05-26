import { AdminUsersPage } from "@/components/operations/admin/users/adminUserPage";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Home, Shield, UserIcon } from "lucide-react";

export default function page() {
  return (
    <main className="h-full flex flex-col space-y-2">
      {/* Breadcrumb */}
      <div className="w-full p-3 border-b">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin/users"
                  className="flex items-center gap-2 text-gray-700 hover:text-teal-600 dark:text-white/90 dark:hover:text-teal-400 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Users
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-500 dark:text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                  Users List
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <section className="w-full flex-1">
        <AdminUsersPage />
      </section>
    </main>
  );
}
