import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

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
        <button
          className="app-button-primary mt-2 h-12 w-full rounded-lg text-sm font-bold transition"
          type="submit"
        >
          Log in
        </button>
      </form>
    </AuthCard>
  );
}
