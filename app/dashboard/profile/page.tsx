import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";
import { AgentAmirIdBadge } from "@/components/theme/presets/agent-amir/agent-amir-id-badge";
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
  const isAmir = user.name.trim().toLowerCase() === "amir";

  return (
    <main className="app-page-scroll bg-[#050705] text-slate-100">
      <div className="app-page-container grid gap-5">
        <section className="app-page-header">
          <p className="app-section-title">Profile settings</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Your account and preferences
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Keep your identity, availability, alerts, and display settings in one predictable place.
          </p>
        </section>

        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <div className="space-y-5">
          {params?.error ? <Alert tone="error">{params.error}</Alert> : null}
          {params?.message ? <Alert tone="success">{params.message}</Alert> : null}
          {isAmir ? (
            <AgentAmirIdBadge
              email={user.email}
              image={user.image ?? null}
              name={user.name}
              status={user.status}
            />
          ) : null}
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
