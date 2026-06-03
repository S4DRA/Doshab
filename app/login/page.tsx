import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    registered?: string;
    returnTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  const params = await searchParams;
  const returnTo = getSafeReturnTo(params?.returnTo);

  if (user) {
    redirect(returnTo);
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to return to your private Doshab workspace."
      footerText="No account yet?"
      footerHref="/register"
      footerLinkText="Create one"
      error={params?.error}
      notice={params?.message ?? (params?.registered ? "Account created. You can log in now." : undefined)}
    >
      <form action="/api/auth/login" className="space-y-4" method="post">
        <input name="returnTo" type="hidden" value={returnTo} />
        <AuthField label="Email" name="email" type="email" autoComplete="email" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <div className="-mt-2 text-right">
          <a
            className="text-sm font-semibold text-[#FF5F25] hover:text-[#ff7847]"
            href="/forgot-password"
          >
            Forgot password?
          </a>
        </div>
        <SubmitButton
          className="app-button-primary mt-2 h-12 w-full rounded-lg text-sm font-bold transition"
          pendingText="Logging in..."
        >
          Log in
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

function getSafeReturnTo(returnTo?: string) {
  return returnTo && isDashboardPath(returnTo) ? returnTo : "/dashboard";
}

function isDashboardPath(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/") || path.startsWith("/dashboard?");
}
