import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { isDevPasswordResetEnabled } from "@/lib/auth-dev-flags";
import { getCurrentUser } from "@/lib/auth";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard/profile");
  }

  const params = await searchParams;
  const devResetEnabled = isDevPasswordResetEnabled();

  return (
    <AuthCard
      title="Reset your password"
      subtitle={
        devResetEnabled
          ? "Development reset is enabled. Set a new password directly without email."
          : "Password reset is temporarily unavailable."
      }
      footerText="Remembered it?"
      footerHref="/login"
      footerLinkText="Back to login"
      error={params?.error}
      notice={params?.message}
    >
      {devResetEnabled ? (
        // TODO: Re-enable email verification/reset before production.
        <form action="/api/auth/forgot-password" className="space-y-4" method="post">
          <AuthField label="Email" name="email" type="email" autoComplete="email" />
          <AuthField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
          />
          <AuthField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
          />
          <SubmitButton
            className="app-button-primary mt-2 h-12 w-full rounded-lg text-sm font-bold transition"
            pendingText="Updating password..."
          >
            Update password
          </SubmitButton>
        </form>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          Password reset is temporarily unavailable.
        </div>
      )}
    </AuthCard>
  );
}
