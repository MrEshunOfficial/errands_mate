// app/provider/[providerId]/services/edit/[serviceId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useServiceById } from "@/hooks/services/useServices";
import { ServiceWithVirtuals } from "@/types/services/service.types";
import ServiceForm from "@/components/operations/services/categories/form/service.form";

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-muted-foreground">Loading service…</p>
      </div>
    </div>
  );
}

function PageError({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Service not found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            It may have been deleted or you don&apos;t have access.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          Back to Services
        </button>
      </div>
    </div>
  );
}

export default function EditServicePage() {
  const { serviceId } = useParams<{
    providerId: string;
    serviceId: string;
  }>();
  const router = useRouter();

  const backPath = `/provider/services`;
  const handleBack = () => router.push(backPath);

  const {
    data: service,
    isLoading,
    isError,
  } = useServiceById(
    serviceId,
    true, // includeInactive — needed to load draft/rejected services in edit mode
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccess = (_service: ServiceWithVirtuals) =>
    router.push(backPath);

  if (isLoading) return <PageLoader />;
  if (isError || !service) return <PageError onBack={handleBack} />;

  return (
    <div className="h-full overflow-hidden p-4 flex justify-center">
      <ServiceForm
        key={String(
          service._id ?? (service as ServiceWithVirtuals).service?._id,
        )}
        mode="edit"
        service={service}
        onSuccess={handleSuccess}
        onCancel={handleBack}
      />
    </div>
  );
}
