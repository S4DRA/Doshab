import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start with a simple email and password. More sign-in options can come later."
      footerText="Already have an account?"
      footerHref="/login"
      footerLinkText="Log in"
      error={params?.error}
    >
      <form action="/api/auth/register" className="space-y-4" method="post">
        <AuthField label="Name" name="name" autoComplete="name" />
        <AuthField label="Email" name="email" type="email" autoComplete="email" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        <button
          className="mt-2 h-11 w-full rounded-md bg-[#FF5F25] text-sm font-semibold text-white shadow-lg shadow-[#FF5F25]/40 transition hover:bg-[#FF5F25]/90"
          type="submit"
        >
          Create account
        </button>
      </form>
    </AuthCard>
  );
}
