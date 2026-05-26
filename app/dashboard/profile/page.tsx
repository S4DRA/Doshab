import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";

type ProfilePageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#050705] text-slate-100">
      <header className="flex min-h-12 flex-col gap-3 border-b border-white/20 bg-[#050505] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          {/* <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
            Profile settings
          </p>
          <h1 className="text-2xl font-semibold text-white">Your account and preferences</h1>
          <p className="mt-1 text-sm text-slate-400">
            Customize your display name, status, and profile photo.
          </p> */}
        </div>
        <div aria-hidden="true" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-5 sm:py-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          {params?.error ? <Alert tone="error">{params.error}</Alert> : null}
          {params?.message ? <Alert tone="success">{params.message}</Alert> : null}
          <ProfileForm
            user={{
              email: user.email,
              image: user.image,
              name: user.name,
              status: user.status,
            }}
          />
        </div>
        <ProfileSettingsPanel />
      </div>
    </main>
  );
}
