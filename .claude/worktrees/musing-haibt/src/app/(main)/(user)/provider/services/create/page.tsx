// app/provider/[providerId]/services/create/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ServiceWithVirtuals } from "@/types/services/service.types";
import ServiceForm from "@/components/operations/services/categories/form/service.form";

export default function CreateServicePage() {
  // const { providerId } = useParams<{ providerId: string }>();
  const router = useRouter();

  const handleSuccess = (_service: ServiceWithVirtuals) => {
    router.push(`/provider/services`);
  };

  const handleCancel = () => {
    router.push(`/provider/services`);
  };

  return (
    <div className="h-full w-full flex justify-center p-4">
      <ServiceForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
