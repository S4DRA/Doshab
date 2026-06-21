"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/layout/auth-card";
import { AuthField } from "@/components/ui/auth-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseBrowserClientFromRuntimeConfig } from "@/lib/supabase/client";

type ResetStatus = "checking" | "ready" | "error";

const fallbackError =
  "We couldn't verify your reset link. Please request a new password reset email.";

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return fallbackError;
}

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("Checking your reset link...");
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<ResetStatus>("checking");

  useEffect(() => {
    let isActive = true;

    async function preparePasswordReset() {
      const supabase = await createSupabaseBrowserClientFromRuntimeConfig({
        auth: {
          detectSessionInUrl: false,
        },
      });

      if (!supabase) {
        throw new Error("Supabase Auth is not configured on this server.");
      }

      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const routeError = searchParams.get("error");
      const routeMessage = searchParams.get("message");
      const callbackError =
        searchParams.get("error_description") ??
        hashParams.get("error_description") ??
        hashParams.get("error") ??
        (searchParams.has("error_code") ? searchParams.get("error") : null);

      if (callbackError) {
        throw new Error(callbackError);
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
      const type = searchParams.get("type");
      const accessToken =
        hashParams.get("access_token") ?? searchParams.get("access_token");
      const refreshToken =
        hashParams.get("refresh_token") ?? searchParams.get("refresh_token");

      if (tokenHash && type) {
        setMessage("Verifying your reset link...");

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });

        if (error) {
          throw error;
        }
      } else if (code) {
        setMessage("Creating a secure reset session...");

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      } else if (accessToken && refreshToken) {
        setMessage("Saving your reset session...");

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }
      }

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        throw error ?? new Error(routeError ?? fallbackError);
      }

      window.history.replaceState(null, "", window.location.pathname);

      if (isActive) {
        setFormError(routeError);
        setMessage(routeMessage ?? "Choose a new password for your account.");
        setStatus("ready");
      }
    }

    preparePasswordReset().catch((error) => {
      if (isActive) {
        setMessage(getSafeErrorMessage(error));
        setStatus("error");
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AuthCard
      title="Create a new password"
      subtitle="Use a fresh password with at least 8 characters."
      footerText="Need another link?"
      footerHref="/forgot-password"
      footerLinkText="Request one"
      error={status === "error" ? message : formError ?? undefined}
      notice={status !== "error" ? message : undefined}
    >
      <form action="/api/auth/update-password" className="space-y-4" method="post">
        <input name="returnTo" type="hidden" value="reset" />
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
          className="app-button-primary mt-2 h-12 w-full rounded-lg text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status !== "ready"}
          pendingText="Updating password..."
          title={status !== "ready" ? "Wait for the reset link to finish verifying" : "Update password"}
        >
          Update password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
