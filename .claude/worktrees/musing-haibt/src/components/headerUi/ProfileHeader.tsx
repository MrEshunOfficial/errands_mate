import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IUserProfile,
  isPopulatedPicture,
} from "@/types/core.user.profile.types";
import { UserRole } from "@/types/base.types";
import { Mail, Phone, CreditCard } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  profile: Partial<IUserProfile> | null;
  isLoading?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getRoleLabel(role?: UserRole): string {
  if (role === UserRole.PROVIDER) return "Service Provider";
  if (role === UserRole.CUSTOMER) return "Customer";
  return "User";
}

function getPictureUrl(pic: IUserProfile["profilePictureId"]): string | null {
  return isPopulatedPicture(pic) ? pic.url : null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileHeaderSkeleton() {
  return (
    <Card className="relative h-52 overflow-hidden border-0">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2.5 p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44 bg-white/20" />
          <Skeleton className="h-5 w-24 rounded-full bg-white/15" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3.5 w-36 bg-white/15" />
          <Skeleton className="h-3.5 w-28 bg-white/15" />
        </div>
      </div>
    </Card>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProfileHeader({
  profile,
  isLoading = false,
}: ProfileHeaderProps) {
  if (isLoading) return <ProfileHeaderSkeleton />;

  const pictureUrl = getPictureUrl(profile?.profilePictureId);
  const roleLabel = getRoleLabel(profile?.role);
  const mainContact = profile?.contactInfo?.mainContact;
  const businessEmail = profile?.contactInfo?.businessEmail;
  const ghanaCard = profile?.idDetails?.ghana_card_number;
  const isDeleted = profile?.isDeleted;
  const isActive = (profile as { isActive?: boolean })?.isActive && !isDeleted;

  return (
    <Card className="relative h-full overflow-hidden border-0 shadow-md">
      {pictureUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: `url(${pictureUrl})` }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-linear-to-br from-slate-700 to-slate-900"
          aria-hidden="true"
        />
      )}

      {/* ── Gradient: only the bottom third darkens for text legibility ── */}
      <div
        className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
        aria-hidden="true"
      />

      {/* ── Text overlaid at the bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-5">
        {/* Name + status badge */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow">
            {mainContact ?? "Unnamed User"}
          </h1>

          {isActive && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          )}

          <Badge
            variant="secondary"
            className={
              isDeleted
                ? "border border-red-400/40 bg-red-500/20 text-red-300 hover:bg-red-500/20"
                : "border border-white/20 bg-white/15 text-white/90 backdrop-blur-sm hover:bg-white/20"
            }>
            {isDeleted ? "Deactivated" : roleLabel}
          </Badge>
        </div>

        {/* Contact meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {businessEmail && (
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <Mail className="h-3 w-3 shrink-0" />
              {businessEmail}
            </span>
          )}
          {mainContact && (
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <Phone className="h-3 w-3 shrink-0" />
              {mainContact}
            </span>
          )}
          {ghanaCard && (
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <CreditCard className="h-3 w-3 shrink-0" />
              {ghanaCard}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
