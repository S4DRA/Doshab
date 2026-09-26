import { ValPageHero } from "@/components/layout/val-page-hero";
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
  const user = await getCurrentUser({ includeImage: true });

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <main className="app-page-scroll bg-[#050705] text-slate-100">
      <div className="app-page-container grid gap-5">
        <ValPageHero eyebrow="Settings / Your account" title="Your account" description="Your identity, your availability, your way of connecting. Make yourself at home." />

        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
          <div className="space-y-5">
            {params?.error ? <Alert tone="error">{params.error}</Alert> : null}
            {params?.message ? <Alert tone="success">{params.message}</Alert> : null}
            <ProfileForm
              user={{
                email: user.email,
                image: user.image ?? null,
                name: user.name,
                status: user.status,
              }}
            />
          </div>
          <ProfileSettingsPanel />
        </div>
      </div>
    </main>
  );
}
