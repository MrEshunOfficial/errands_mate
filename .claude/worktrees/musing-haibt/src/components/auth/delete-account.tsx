"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

const AccountDeletePage = () => {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const router = useRouter();
  const { deleteAccount, isLoading } = useAuth();

  const isValid = confirmation.trim().toLowerCase() === "delete my account";

  const handleDelete = async () => {
    try {
      await deleteAccount();
      toast.success("Account deleted successfully.");
      router.push("/");
    } catch {
      toast.error("Unable to delete account. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl  shadow-xl">
      {!confirming ? (
        /* Warning state */
        <div className="p-6 space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Delete account
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <ul className="space-y-2">
              <li>• All your data will be permanently removed</li>
              <li>• Your profile and content will be deleted</li>
              <li>• You will lose access immediately</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setConfirming(true)}
              className="w-full rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700"
            >
              I understand, continue
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Keep my account
            </button>
          </div>
        </div>
      ) : (
        /* Confirmation state */
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Final confirmation
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Type{" "}
              <span className="font-medium text-red-600">
                delete my account
              </span>{" "}
              to confirm.
            </p>
          </div>

          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="delete my account"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />

          <div className="space-y-3">
            <button
              onClick={handleDelete}
              disabled={!isValid || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:bg-gray-400"
            >
              {isLoading ? (
                "Deleting…"
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Permanently delete
                </>
              )}
            </button>

            <button
              onClick={() => setConfirming(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDeletePage;
