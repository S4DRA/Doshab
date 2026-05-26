import Link from "next/link";
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
    <main className="min-h-screen bg-[#070a12] text-slate-100">
      <header className="flex min-h-16 flex-col gap-4 border-b border-white/8 bg-[#0b1020]/95 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
            Profile settings
          </p>
          <h1 className="text-2xl font-semibold text-white">Your account and preferences</h1>
          <p className="mt-1 text-sm text-slate-400">
            Customize your display name, status, and profile photo.
          </p> */}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="h-10 rounded-full border border-white/10 bg-white/7 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/12"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.4fr_0.9fr]">
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
