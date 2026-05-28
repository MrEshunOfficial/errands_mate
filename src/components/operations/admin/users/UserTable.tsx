// pages/admin/users/components/UserTable.tsx

import { User, isAdmin, isSuperAdmin } from "@/types/user.types";
import {
  Mail,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  User as UserIcon,
} from "lucide-react";

interface UserTableProps {
  users: User[];
  onUserClick: (user: User) => void;
}

export function UserTable({ users, onUserClick }: UserTableProps) {
  const getRoleBadge = (user: User) => {
    if (isSuperAdmin(user)) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Super Admin
        </div>
      );
    }
    if (isAdmin(user)) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          <Shield className="w-3 h-3" />
          Admin
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
        <UserIcon className="w-3 h-3" />
        {user.systemRole}
      </div>
    );
  };

  const getStatusBadge = (user: User) => {
    // Deleted takes priority — check this before email-verification state
    if (user.isDeleted) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <XCircle className="w-3 h-3" />
          Deleted
        </div>
      );
    }
    if (!user.isEmailVerified) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <Clock className="w-3 h-3" />
          Pending
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        <CheckCircle className="w-3 h-3" />
        Active
      </div>
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <>
      {/* ── Mobile card list (< sm) ── */}
      <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onUserClick(user)}
            className={`cursor-pointer flex items-start gap-3 px-3 py-3.5 transition-colors ${
              user.isDeleted
                ? "bg-red-50/40 dark:bg-red-900/10 opacity-75"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}>
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shrink-0 text-sm ${
                user.isDeleted
                  ? "bg-gray-400 dark:bg-gray-600"
                  : "bg-linear-to-br from-blue-500 to-purple-600"
              }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      user.isDeleted
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : "text-gray-900 dark:text-white"
                    }`}>
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mt-0.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                </div>
                {getStatusBadge(user)}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getRoleBadge(user)}
                <span className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">
                  {user.authProvider}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table (>= sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-teal-950 text-white dark:bg-orange-700 dark:text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Auth Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserClick(user)}
                className={`cursor-pointer transition-colors ${
                  user.isDeleted
                    ? "bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-75"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${
                        user.isDeleted
                          ? "bg-gray-400 dark:bg-gray-600"
                          : "bg-linear-to-br from-blue-500 to-purple-600"
                      }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-medium ${
                          user.isDeleted
                            ? "text-gray-400 dark:text-gray-500 line-through"
                            : "text-gray-900 dark:text-white"
                        }`}>
                        {user.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white capitalize">
                    {user.authProvider}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(user.lastLogin)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(user.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
