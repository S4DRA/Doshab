import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
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
      subtitle="Log in to return to your private Palaver workspace."
      footerText="No account yet?"
      footerHref="/register"
      footerLinkText="Create one"
      error={params?.error}
      notice={params?.registered ? "Account created. You can log in now." : undefined}
    >
      <form action="/api/auth/login" className="space-y-4" method="post">
        <AuthField label="Email" name="email" type="email" autoComplete="email" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <button
          className="mt-2 h-11 w-full rounded-md bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400"
          type="submit"
        >
          Log in
        </button>
      </form>
    </AuthCard>
  );
}
