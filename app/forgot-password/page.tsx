import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { SubmitButton } from "@/components/ui/submit-button";
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

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and VAL will send you a secure reset link."
      footerText="Remembered it?"
      footerHref="/login"
      footerLinkText="Back to login"
      error={params?.error}
      notice={params?.message}
    >
      <form action="/api/auth/forgot-password" className="space-y-4" method="post">
        <AuthField label="Email" name="email" type="email" autoComplete="email" />
        <SubmitButton
          className="app-button-primary mt-2 h-12 w-full rounded-lg text-sm font-bold transition"
          pendingText="Sending link..."
        >
          Send reset link
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
