// pages/admin/users/components/UserDetailsModal.tsx

import { useState } from "react";
import {
  User,
  SystemRole,
  AuthProvider,
  UpdateUserRoleData,
  isSuperAdmin,
} from "@/types/user.types";
import { useAccountDeletion } from "@/hooks/auth/useAccDeletion";
import { useAuth } from "@/hooks/auth/useAuth";
import type {
  LinkProviderData,
  GoogleAuthData,
  AppleAuthData,
} from "@/lib/api/auth/oauth.api";
import {
  X,
  Mail,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Activity,
  UserCircle,
  ShieldCheck,
  LogIn,
  Link,
  AlertCircle,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useOAuth } from "@/hooks/auth/useOauth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OAUTH_PROVIDERS: {
  provider: AuthProvider;
  label: string;
  icon: string;
}[] = [
  { provider: AuthProvider.GOOGLE, label: "Google", icon: "G" },
  { provider: AuthProvider.APPLE, label: "Apple", icon: "" },
  { provider: AuthProvider.GITHUB, label: "GitHub", icon: "" },
  { provider: AuthProvider.FACEBOOK, label: "Facebook", icon: "f" },
];

const ROLE_OPTIONS: {
  value: SystemRole;
  label: string;
  description: string;
}[] = [
  { value: SystemRole.USER, label: "User", description: "Standard access" },
  {
    value: SystemRole.ADMIN,
    label: "Admin",
    description: "Manage users & content",
  },
  {
    value: SystemRole.SUPER_ADMIN,
    label: "Super Admin",
    description: "Full system access",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "warning" | "info" | "danger" | "neutral";
}) {
  const styles = {
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800",
    warning:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800",
    info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800",
    danger:
      "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800",
    neutral:
      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-gray-900 dark:text-white ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Confirmation variants ────────────────────────────────────────────────────

type ConfirmAction = "soft-delete" | "restore" | "permanent-delete" | null;

// ─── Component ────────────────────────────────────────────────────────────────

export function UserDetailsModal({
  user,
  onClose,
  onUpdate,
}: UserDetailsModalProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SystemRole>(user.systemRole);
  const [oauthLinkTarget, setOauthLinkTarget] = useState<AuthProvider | null>(
    null,
  );

  // ── Current session user (admin performing the action) ────────────────────
  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.systemRole === SystemRole.ADMIN ||
    currentUser?.systemRole === SystemRole.SUPER_ADMIN;
  const isSuperAdminUser = currentUser?.systemRole === SystemRole.SUPER_ADMIN;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const {
    isLoading,
    error: adminError,
    updateUserRole,
    deleteUser,
    restoreUser,
    permanentlyDeleteUser,
    clearError: clearAdminError,
  } = useAccountDeletion();

  const {
    isLoading: oauthLoading,
    error: oauthError,
    googleAuth,
    appleAuth,
    linkProvider,
    clearError: clearOAuthError,
  } = useOAuth();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRoleUpdate = async () => {
    if (selectedRole === user.systemRole) {
      setShowRoleChange(false);
      return;
    }
    const result = await updateUserRole(user.id, {
      systemRole: selectedRole,
    } as UpdateUserRoleData);
    if (result) {
      setShowRoleChange(false);
      onUpdate();
    }
  };

  const handleSoftDelete = async () => {
    const result = await deleteUser(user.id);
    if (result) {
      onUpdate();
      onClose();
    }
  };

  const handleRestore = async () => {
    const result = await restoreUser(user.id);
    if (result) {
      onUpdate();
      onClose();
    }
  };

  const handlePermanentDelete = async () => {
    const result = await permanentlyDeleteUser(user.id);
    if (result) {
      onUpdate();
      onClose();
    }
  };

  const handleConfirm = async () => {
    switch (confirmAction) {
      case "soft-delete":
        await handleSoftDelete();
        break;
      case "restore":
        await handleRestore();
        break;
      case "permanent-delete":
        await handlePermanentDelete();
        break;
    }
    setConfirmAction(null);
  };

  const handleLinkProvider = async (provider: AuthProvider) => {
    clearOAuthError();
    setOauthLinkTarget(provider);
    try {
      if (provider === AuthProvider.GOOGLE) {
        await googleAuth({ userId: user.id } as unknown as GoogleAuthData);
      } else if (provider === AuthProvider.APPLE) {
        await appleAuth({ userId: user.id } as unknown as AppleAuthData);
      } else {
        await linkProvider({
          provider,
          userId: user.id,
        } as unknown as LinkProviderData);
      }
      onUpdate();
    } finally {
      setOauthLinkTarget(null);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return "Never";
    const diffInDays = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 86_400_000,
    );
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  const roleLabel =
    ROLE_OPTIONS.find((r) => r.value === user.systemRole)?.label ??
    user.systemRole;

  // ── Confirmation dialog config ─────────────────────────────────────────────

  const confirmConfig = {
    "soft-delete": {
      icon: AlertTriangle,
      iconClass: "text-amber-500 dark:text-amber-400",
      message: "Soft-delete this user? They can be restored later.",
      confirmLabel: "Delete User",
      confirmClass: "bg-red-600 hover:bg-red-700",
    },
    restore: {
      icon: RotateCcw,
      iconClass: "text-emerald-500 dark:text-emerald-400",
      message: `Restore ${user.name}'s account? They will regain full access.`,
      confirmLabel: "Restore Account",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700",
    },
    "permanent-delete": {
      icon: Flame,
      iconClass: "text-red-600 dark:text-red-400",
      message: "Permanently delete this user? This cannot be undone.",
      confirmLabel: "Permanently Delete",
      confirmClass: "bg-red-700 hover:bg-red-800",
    },
  } satisfies Record<NonNullable<ConfirmAction>, unknown>;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            User Details
          </p>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* ── Identity Block ── */}
          <div className="flex items-center gap-5 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold select-none ${
                  user.isDeleted
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-950 ${
                  user.isDeleted
                    ? "bg-red-500"
                    : user.isEmailVerified
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2
                className={`text-xl font-semibold truncate ${
                  user.isDeleted
                    ? "text-gray-400 dark:text-gray-500 line-through"
                    : "text-gray-900 dark:text-white"
                }`}>
                {user.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              {user.isDeleted && user.deletedAt && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Deleted {formatRelativeTime(user.deletedAt)}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {user.isDeleted && (
                <StatusPill variant="danger">
                  <XCircle className="w-3 h-3" /> Deleted
                </StatusPill>
              )}
              {isSuperAdmin(user) && (
                <StatusPill variant="info">
                  <ShieldCheck className="w-3 h-3" /> Super Admin
                </StatusPill>
              )}
              {user.systemRole === SystemRole.ADMIN && !isSuperAdmin(user) && (
                <StatusPill variant="info">
                  <Shield className="w-3 h-3" /> Admin
                </StatusPill>
              )}
              {!user.isDeleted &&
                (user.isEmailVerified ? (
                  <StatusPill variant="success">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </StatusPill>
                ) : (
                  <StatusPill variant="warning">
                    <Clock className="w-3 h-3" /> Unverified
                  </StatusPill>
                ))}
            </div>
          </div>

          {/* ── Quick Stats Bar ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
            {[
              {
                icon: Activity,
                label: "Last Active",
                value: formatRelativeTime(user.lastLogin),
              },
              {
                icon: Calendar,
                label: "Member Since",
                value: formatRelativeTime(user.createdAt),
              },
              { icon: Shield, label: "Role", value: roleLabel },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-4 px-3 gap-1">
                <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {label}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Details Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-5">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <UserCircle className="w-3.5 h-3.5" /> Account
              </h3>
              <InfoRow
                label="Auth Provider"
                value={<span className="capitalize">{user.authProvider}</span>}
              />
              <InfoRow label="Created" value={formatDate(user.createdAt)} />
              {user.profileId && (
                <InfoRow label="Profile ID" value={user.profileId} mono />
              )}
            </div>

            <div className="px-6 py-5">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Activity
              </h3>
              <InfoRow
                label="Last Login"
                value={
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(user.lastLogin)}
                  </span>
                }
              />
              {user.isDeleted && user.deletedAt && (
                <InfoRow
                  label="Deleted At"
                  value={
                    <span className="text-red-500 dark:text-red-400">
                      {formatDate(user.deletedAt)}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          {/* ── Admin Error Banner ── */}
          {adminError && (
            <div className="mx-6 mt-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl ring-1 ring-red-200 dark:ring-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 flex-1">
                  {adminError}
                </p>
                <button
                  onClick={clearAdminError}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── OAuth Provider Management (active accounts only) ── */}
          {!user.isDeleted && (
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
              <div className="rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Link className="w-3.5 h-3.5" /> OAuth Providers
                  </h4>
                </div>

                {oauthError && (
                  <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{oauthError}</span>
                    <button onClick={clearOAuthError} aria-label="Dismiss">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 p-4">
                  {OAUTH_PROVIDERS.map(({ provider, label, icon }) => {
                    const isCurrentProvider = user.authProvider === provider;
                    const isLinking =
                      oauthLinkTarget === provider && oauthLoading;

                    return (
                      <div
                        key={provider}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          isCurrentProvider
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                            {icon}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </div>

                        {isCurrentProvider ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Linked
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLinkProvider(provider)}
                            disabled={isLoading || oauthLoading}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {isLinking ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Link className="w-3 h-3" />
                            )}
                            {isLinking ? "Linking…" : "Link"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Role Management (active accounts + admin only) ── */}
          {!user.isDeleted && isAdmin && (
            <div className="px-6 pb-6">
              <div className="rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Role Management
                  </h4>
                  {!showRoleChange && (
                    <button
                      onClick={() => setShowRoleChange(true)}
                      disabled={isLoading}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 transition-colors">
                      Change
                    </button>
                  )}
                </div>

                <div className="px-4 py-4">
                  {showRoleChange ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={selectedRole}
                          onChange={(e) =>
                            setSelectedRole(e.target.value as SystemRole)
                          }
                          disabled={isLoading}
                          className="w-full appearance-none px-4 py-2.5 pr-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:opacity-50">
                          {ROLE_OPTIONS.map(({ value, label, description }) => (
                            <option key={value} value={value}>
                              {label} — {description}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRoleUpdate}
                          disabled={
                            isLoading || selectedRole === user.systemRole
                          }
                          className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                          {isLoading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setShowRoleChange(false);
                            setSelectedRole(user.systemRole);
                          }}
                          disabled={isLoading}
                          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Current role
                      </span>
                      <StatusPill
                        variant={
                          isSuperAdmin(user) ||
                          user.systemRole === SystemRole.ADMIN
                            ? "info"
                            : "neutral"
                        }>
                        {isSuperAdmin(user) ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        {roleLabel}
                      </StatusPill>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          {confirmAction ? (
            // ── Inline confirmation ──────────────────────────────────────────
            (() => {
              const cfg = confirmConfig[confirmAction];
              const CfgIcon = cfg.icon;
              return (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className={`flex items-center gap-2.5 ${cfg.iconClass}`}>
                    <CfgIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cfg.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setConfirmAction(null)}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 ${cfg.confirmClass}`}>
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {cfg.confirmLabel}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : user.isDeleted ? (
            // ── Deleted user footer ──────────────────────────────────────────
            <>
              <div className="flex items-center gap-2">
                {/* Restore — available to all admins */}
                <button
                  onClick={() => setConfirmAction("restore")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Restore User
                </button>

                {/* Permanent delete — super-admin override only */}
                {isSuperAdminUser && (
                  <button
                    onClick={() => setConfirmAction("permanent-delete")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Flame className="w-4 h-4" />
                    Permanent Delete
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
                Close
              </button>
            </>
          ) : (
            // ── Active user footer ───────────────────────────────────────────
            <>
              {isAdmin && (
                <button
                  onClick={() => setConfirmAction("soft-delete")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              )}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="ml-auto px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
