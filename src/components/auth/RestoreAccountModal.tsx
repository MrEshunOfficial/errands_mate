"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RestoreAccountModalProps {
  open: boolean;
  deletedAt: string | null;
  onRestore: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export function RestoreAccountModal({
  open,
  deletedAt,
  onRestore,
  onCancel,
  isLoading,
  error,
}: RestoreAccountModalProps) {
  const formattedDate = deletedAt
    ? new Date(deletedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "recently";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isLoading) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <DialogTitle>Account Pending Deletion</DialogTitle>
          </div>
          <DialogDescription>
            Your account was deleted on{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formattedDate}
            </span>
            . Would you like to restore it?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            No, stay deleted
          </Button>
          <Button
            onClick={onRestore}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Restoring..." : "Restore My Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
