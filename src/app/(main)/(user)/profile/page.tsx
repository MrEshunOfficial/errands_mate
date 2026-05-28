"use client";
import ProviderProfile from "@/components/operations/provider/ProviderProfile";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { UserRole } from "@/types/base.types";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const { profile, loading } = useProfile(true);

  const isLoading = loading.exists || loading.profile;
  if (isLoading) return <LoadingOverlay />;

  if (!profile) {
    return (
      <div className="p-2 w-full h-full">
        <EmptyState
          title="Unable to load profile"
          description="looks like you haven't setup your profile yet"
          actions={[
            {
              label: "Setup Profile",
              onClick: () => router.push("/profile/setup"),
            },
          ]}
        />
      </div>
    );
  }

  if (profile.role !== UserRole.PROVIDER) {
    router.replace("/client/preferences");
    return null;
  }

  return (
    <main className="w-full h-full overflow-auto hide-scrollbar">
      <ProviderProfile />
    </main>
  );
}
