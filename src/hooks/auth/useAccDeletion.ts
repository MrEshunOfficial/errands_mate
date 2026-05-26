import { useState, useCallback, useEffect } from "react";
import {
  User,
  AuthResponse,
  DeletionStatusResponse,
  DeletionReviewQueueResponse,
  RetryDeletionResponse,
  UpdateUserRoleData,
  GetUsersParams,
} from "@/types/user.types";
import { authAPI } from "@/lib/api/auth/auth.api";
import { APIError } from "@/lib/api/base/api-client";
import { accountDeletionAPI } from "@/lib/api/auth/account.deletion.api";

// ─── Pagination ───────────────────────────────────────────────────────────────

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Options ──────────────────────────────────────────────────────────────────

interface UseAccountDeletionOptions {
  /** When true, getAllUsers fires automatically whenever `params` changes. */
  autoLoad?: boolean;
}

// ─── Return Type ──────────────────────────────────────────────────────────────

interface UseAccountDeletionReturn {
  // ── User list state ───────────────────────────────────────────────────────
  users: User[] | null;
  pagination: Pagination | null;
  listLoading: boolean;
  listError: string | null;
  refetch: () => void;
  clearListError: () => void;

  // ── Mutation state ────────────────────────────────────────────────────────
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  resetState: () => void;

  // ── Current-user deletion lifecycle ──────────────────────────────────────
  requestDeletion: () => Promise<AuthResponse | null>;
  cancelDeletion: () => Promise<AuthResponse | null>;
  getDeletionStatus: () => Promise<DeletionStatusResponse | null>;

  // ── Admin — deletion pipeline management ─────────────────────────────────
  getAdminReviewQueue: () => Promise<DeletionReviewQueueResponse | null>;
  retryDeletion: (eventId: string) => Promise<RetryDeletionResponse | null>;

  // ── Admin — user management ───────────────────────────────────────────────
  getUserById: (userId: string) => Promise<AuthResponse | null>;
  updateUserRole: (
    userId: string,
    data: UpdateUserRoleData,
  ) => Promise<AuthResponse | null>;
  deleteUser: (userId: string) => Promise<AuthResponse | null>;
  restoreUser: (userId: string) => Promise<AuthResponse | null>;
  /**
   * Permanently and irreversibly removes a user from the database.
   * Admin-only — bypasses the soft-delete grace period entirely.
   */
  permanentlyDeleteUser: (userId: string) => Promise<AuthResponse | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAccountDeletion = (
  params?: GetUsersParams,
  options?: UseAccountDeletionOptions,
): UseAccountDeletionReturn => {
  // ── User list state ───────────────────────────────────────────────────────

  const [users, setUsers] = useState<User[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Mutation state ────────────────────────────────────────────────────────

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Shared Mutation Wrapper ───────────────────────────────────────────────

  const handleAction = useCallback(
    async <T>(
      action: () => Promise<T>,
      fallbackMessage: string,
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await action();
      } catch (err) {
        const apiError = err as APIError;
        setError(apiError.message ?? fallbackMessage);
        console.error(fallbackMessage, err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── User List ─────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      setListLoading(true);
      setListError(null);
      const res = await authAPI.getAllUsers(params);
      if (res.users) setUsers(res.users);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      const apiError = err as APIError;
      setListError(apiError.message ?? "Failed to load users");
      console.error("Failed to load users", err);
    } finally {
      setListLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (options?.autoLoad) fetchUsers();
  }, [fetchUsers, options?.autoLoad]);

  const refetch = useCallback(() => fetchUsers(), [fetchUsers]);

  // ── Current-user Deletion Lifecycle ──────────────────────────────────────

  const requestDeletion = useCallback(
    () =>
      handleAction(
        () => accountDeletionAPI.requestDeletion(),
        "Failed to request account deletion",
      ),
    [handleAction],
  );

  const cancelDeletion = useCallback(
    () =>
      handleAction(
        () => accountDeletionAPI.cancelDeletion(),
        "Failed to cancel account deletion",
      ),
    [handleAction],
  );

  const getDeletionStatus = useCallback(
    () =>
      handleAction(
        () => accountDeletionAPI.getDeletionStatus(),
        "Failed to fetch deletion status",
      ),
    [handleAction],
  );

  // ── Admin — Deletion Pipeline Management ─────────────────────────────────

  const getAdminReviewQueue = useCallback(
    () =>
      handleAction(
        () => accountDeletionAPI.getAdminReviewQueue(),
        "Failed to fetch admin review queue",
      ),
    [handleAction],
  );

  const retryDeletion = useCallback(
    (eventId: string) =>
      handleAction(
        () => accountDeletionAPI.retryDeletion(eventId),
        "Failed to retry deletion",
      ),
    [handleAction],
  );

  // ── Admin — User Management ───────────────────────────────────────────────

  /**
   * Fetch a single user by ID (includes soft-deleted accounts so admins can
   * inspect deleted users before deciding to restore or permanently remove).
   */
  const getUserById = useCallback(
    (userId: string) =>
      handleAction(
        () => authAPI.getUserById(userId),
        "Failed to fetch user details",
      ),
    [handleAction],
  );

  const updateUserRole = useCallback(
    (userId: string, data: UpdateUserRoleData) =>
      handleAction(
        () => authAPI.updateUserRole(userId, data),
        "Failed to update user role",
      ),
    [handleAction],
  );

  const deleteUser = useCallback(
    (userId: string) =>
      handleAction(() => authAPI.deleteUser(userId), "Failed to delete user"),
    [handleAction],
  );

  const restoreUser = useCallback(
    (userId: string) =>
      handleAction(() => authAPI.restoreUser(userId), "Failed to restore user"),
    [handleAction],
  );

  /**
   * Permanently and irreversibly removes the user document from the database.
   * This bypasses the soft-delete grace period and cannot be undone.
   * Only super-admins should have access to this action in the UI.
   */
  const permanentlyDeleteUser = useCallback(
    (userId: string) =>
      handleAction(
        () => authAPI.permanentlyDeleteUser(userId),
        "Failed to permanently delete user",
      ),
    [handleAction],
  );

  // ── Utilities ─────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);
  const clearListError = useCallback(() => setListError(null), []);
  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    users,
    pagination,
    listLoading,
    listError,
    refetch,
    clearListError,
    isLoading,
    error,
    clearError,
    resetState,
    requestDeletion,
    cancelDeletion,
    getDeletionStatus,
    getAdminReviewQueue,
    retryDeletion,
    getUserById,
    updateUserRole,
    deleteUser,
    restoreUser,
    permanentlyDeleteUser,
  };
};
