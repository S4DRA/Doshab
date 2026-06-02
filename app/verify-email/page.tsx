import { redirect } from "next/navigation";
import Link from "next/link";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { getCurrentUser } from "@/lib/auth";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    email?: string;
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
      title="Verify your email"
      subtitle="Doshab requires email verification before you can use your workspace."
      footerText="Already verified?"
      footerHref="/login"
      footerLinkText="Log in"
      error={params?.error}
      notice={
        params?.message ??
        "Account created. Please check your email to verify your Doshab account."
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-300">
        <p>
          Check your inbox{params?.email ? ` (${params.email})` : ""} and your spam folder for the
          verification email.
        </p>
        <p>
          After verifying, Doshab will finish signing you in automatically.
        </p>
        <form action="/api/auth/resend-confirmation" className="space-y-4" method="post">
          {params?.email ? (
            <input name="email" type="hidden" value={params.email} />
          ) : (
            <AuthField label="Email" name="email" type="email" autoComplete="email" />
          )}
          <button
            className="app-button-secondary inline-flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition"
            type="submit"
          >
            Send a fresh verification email
          </button>
        </form>
        <Link
          className="app-button-primary inline-flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition"
          href="/login"
        >
          Back to login
        </Link>
      </div>
    </AuthCard>
  );
}
