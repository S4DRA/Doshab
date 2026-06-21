import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
<<<<<<< Updated upstream
import { AuthField } from "@/components/ui/auth-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
=======
>>>>>>> Stashed changes
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
  const devEmailBypassEnabled = isDevEmailAuthBypassEnabled();

  return (
    <AuthCard
<<<<<<< Updated upstream
      title={devEmailBypassEnabled ? "Email verification disabled" : "Verify your email"}
      subtitle={
        devEmailBypassEnabled
          ? "Development mode is letting accounts log in without email verification."
          : "VAL requires email verification before you can use your workspace."
      }
      footerText={devEmailBypassEnabled ? "Ready to continue?" : "Already verified?"}
      footerHref="/login"
      footerLinkText="Log in"
      error={params?.error}
      notice={
        params?.message ??
        (devEmailBypassEnabled
          ? "Email verification is temporarily bypassed for development."
          : "Account created. Please check your email to verify your VAL account.")
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-300">
        {devEmailBypassEnabled ? (
          // TODO: Re-enable email verification/reset before production.
          <p>
            Use the login page to continue. No verification email is sent while the
            development bypass is enabled.
          </p>
        ) : (
          <>
            <p>
              Check your inbox{params?.email ? ` (${params.email})` : ""} and your spam folder for the
              verification email.
            </p>
            <p>
              After verifying, VAL will finish signing you in automatically.
            </p>
            <form action="/api/auth/resend-confirmation" className="space-y-4" method="post">
              {params?.email ? (
                <input name="email" type="hidden" value={params.email} />
              ) : (
                <AuthField label="Email" name="email" type="email" autoComplete="email" />
              )}
              <SubmitButton
                className="app-button-secondary inline-flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition"
                pendingText="Sending email..."
              >
                Send a fresh verification email
              </SubmitButton>
            </form>
          </>
        )}
        <Link
          className="app-button-primary inline-flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition"
          href="/login"
        >
          Back to login
        </Link>
=======
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
>>>>>>> Stashed changes
      </div>
    </AuthCard>
  );
}
