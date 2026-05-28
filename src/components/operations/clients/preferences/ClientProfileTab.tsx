"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, User2, Pencil, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { useProfilePicture } from "@/hooks/files/useProfilePicture";
import { isPopulatedPicture } from "@/types/core.user.profile.types";
import type { ContactDetails } from "@/types/base.types";
import {
  FieldLabel,
  ReadValue,
  InlineFeedback,
} from "@/components/operations/profile/shared";

export default function ClientProfileTab() {
  const { profile, loading, errors, updateProfile } = useProfile(true);
  const {
    optimizedUrl,
    loading: picLoading,
    errors: picErrors,
    fetchOptimizedUrl,
    uploadPicture,
    deleteMyCloudinaryPicture,
  } = useProfilePicture();

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [picUploadSuccess, setPicUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [mainContact, setMainContact] = useState("");
  const [additionalContact, setAdditionalContact] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");

  const contact = profile?.contactInfo;
  const isLoading = loading.profile || loading.exists;
  const busy = picLoading.uploading || picLoading.deleting;

  const avatarUrl =
    optimizedUrl ??
    (isPopulatedPicture(profile?.profilePictureId)
      ? profile.profilePictureId.url
      : null);

  useEffect(() => {
    fetchOptimizedUrl();
  }, [fetchOptimizedUrl]);

  useEffect(() => {
    if (!editing) {
      setMainContact(contact?.mainContact ?? "");
      setAdditionalContact(contact?.additionalContact ?? "");
      setBusinessEmail(contact?.businessEmail ?? "");
    }
  }, [contact, editing]);

  const handleUpload = async (file: File) => {
    const result = await uploadPicture(file);
    if (result) {
      setPicUploadSuccess(true);
      setTimeout(() => setPicUploadSuccess(false), 3000);
      await fetchOptimizedUrl();
    }
  };

  const openEdit = () => {
    setMainContact(contact?.mainContact ?? "");
    setAdditionalContact(contact?.additionalContact ?? "");
    setBusinessEmail(contact?.businessEmail ?? "");
    setEditing(true);
  };

  const save = async () => {
    const result = await updateProfile({
      contactInfo: {
        mainContact: mainContact.trim(),
        additionalContact: additionalContact.trim() || undefined,
        businessEmail: businessEmail.trim() || undefined,
      } as ContactDetails,
    });
    if (result) {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      setEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-xl" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 mb-3" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">
          Profile Picture
        </p>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-700">
              <User2 size={24} className="text-zinc-400" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="gap-1.5 text-xs">
              {picLoading.uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Camera size={12} />
              )}
              {avatarUrl ? "Change Photo" : "Upload Photo"}
            </Button>
            {avatarUrl && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => deleteMyCloudinaryPicture()}
                className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                {picLoading.deleting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Remove
              </Button>
            )}
          </div>
        </div>
        {(picErrors.mutation || picUploadSuccess) && (
          <div className="mt-3">
            <InlineFeedback
              loading={false}
              error={picErrors.mutation}
              success={picUploadSuccess}
              successMsg="Picture updated"
            />
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">
            Contact Information
          </p>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={openEdit}>
              <Pencil size={12} />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <FieldLabel>Main Contact (Phone) *</FieldLabel>
              <Input
                value={mainContact}
                onChange={(e) => setMainContact(e.target.value)}
                placeholder="e.g. 024 000 0000"
                className="dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Additional Contact</FieldLabel>
              <Input
                value={additionalContact}
                onChange={(e) => setAdditionalContact(e.target.value)}
                placeholder="e.g. 054 000 0000"
                className="dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Business Email</FieldLabel>
              <Input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="e.g. you@example.com"
                className="dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <InlineFeedback
                loading={loading.updating}
                error={errors.mutation}
                success={updateSuccess}
                successMsg="Contact info updated"
              />
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!mainContact.trim() || loading.updating}
                  onClick={save}
                  className="bg-amber-500 hover:bg-amber-600 text-white">
                  {loading.updating ? (
                    <Loader2 size={13} className="animate-spin mr-1.5" />
                  ) : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ReadValue label="Main Contact" value={contact?.mainContact} />
            <ReadValue
              label="Additional Contact"
              value={contact?.additionalContact}
            />
            <ReadValue label="Business Email" value={contact?.businessEmail} />
          </div>
        )}
      </div>
    </div>
  );
}
