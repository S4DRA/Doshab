import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { getCurrentUser } from "@/lib/auth";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <AuthCard
      title="Email verification disabled"
      subtitle="VAL is not using email verification during development."
      footerText="Ready to continue?"
      footerHref="/login"
      footerLinkText="Log in"
      error={params?.error}
      notice={params?.message ?? "Create an account or log in to enter VAL directly."}
    >
      {/* TODO: Re-enable email verification/reset before production. */}
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
        No verification email or code is required.
      </div>
    </AuthCard>
  );
}
