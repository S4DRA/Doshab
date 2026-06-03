"use client";

import { useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import type { UserStatus } from "@/types";

type ProfileFormProps = {
  user: {
    email: string;
    image: string | null;
    name: string;
    status: UserStatus;
  };
};

const statuses: Array<{
  label: string;
  value: UserStatus;
}> = [
  { label: "Online", value: "ONLINE" },
  { label: "Idle", value: "IDLE" },
  { label: "Do not disturb", value: "DO_NOT_DISTURB" },
  { label: "Offline", value: "OFFLINE" },
];

const maxProfileImageBytes = 262_144;

export function ProfileForm({ user }: ProfileFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image);
  const [removeImage, setRemoveImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(user.image);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > maxProfileImageBytes) {
      setUploadError("Image must be under 256 KB.");
      event.target.value = "";
      return;
    }

    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(typeof reader.result === "string" ? reader.result : user.image);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="app-panel p-5">
      <div className="grid gap-6">
        <div className="app-card p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarInitials imageUrl={previewUrl} size="lg" value={user.name || user.email} />
            <div className="min-w-0">
              <p className="app-section-title">
                Profile
              </p>
              <h1 className="mt-2 truncate text-2xl font-bold text-white">
                {user.name}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
            </div>
          </div>

          <form action="/api/profile" className="mt-8 grid gap-4" method="post" encType="multipart/form-data">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Display name
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                defaultValue={user.name}
                maxLength={40}
                minLength={2}
                name="name"
                required
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Status
              </span>
              <select
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                defaultValue={user.status}
                name="status"
                required
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="app-row p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center justify-center rounded-lg bg-[#0a0e19] p-3 shadow-inner shadow-black/20">
                  <AvatarInitials imageUrl={previewUrl} size="md" value={user.name || user.email} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Profile picture</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Upload a custom avatar for your account. Supported image types only.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="block rounded-lg border border-white/10 bg-[#0b1020] px-4 py-3">
                  <span className="text-sm font-semibold text-white">Choose photo</span>
                  <input
                    className="mt-3 w-full text-base text-slate-200 file:rounded-lg file:border file:border-white/10 file:bg-[#FF5F25]/20 file:px-3 file:py-2 file:text-sm file:text-slate-100 sm:text-sm"
                    accept="image/*"
                    name="profileImage"
                    onChange={handleFileChange}
                    type="file"
                  />
                </label>

                {user.image ? (
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-slate-400">
                    <input
                      checked={removeImage}
                      className="h-4 w-4 rounded border-white/10 bg-[#090d18] text-[#FF5F25]"
                      name="removeImage"
                      onChange={(event) => {
                        setRemoveImage(event.target.checked);
                        if (event.target.checked) {
                          setPreviewUrl(null);
                        } else {
                          setPreviewUrl(user.image);
                        }
                      }}
                      type="checkbox"
                    />
                    Remove current photo
                  </label>
                ) : null}

                {uploadError ? (
                  <p className="text-sm text-red-300">{uploadError}</p>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    Keep images under 256 KB to protect monthly database egress.
                  </p>
                )}
              </div>
            </div>

            <SubmitButton
              className="app-button-primary mt-2 h-12 w-full rounded-lg px-5 text-sm font-semibold transition sm:h-11 sm:w-max"
              pendingText="Saving..."
            >
              Save profile
            </SubmitButton>
          </form>
        </div>
      </div>
    </section>
  );
}
