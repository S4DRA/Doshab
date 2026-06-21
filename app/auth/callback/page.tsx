"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/layout/auth-card";
import { createSupabaseBrowserClientFromRuntimeConfig } from "@/lib/supabase/client";

const fallbackError =
  "We couldn't complete this auth link. Please try logging in again.";

function getCallbackError(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  return (
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    hashParams.get("error_description") ??
    hashParams.get("error")
  );
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return fallbackError;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing authentication...");

  useEffect(() => {
    let isActive = true;

    async function completeAuthCallback() {
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
      const callbackError = getCallbackError(searchParams, hashParams);

      if (callbackError) {
        throw new Error(callbackError);
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
      const type = searchParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (tokenHash && type) {
        setMessage("Verifying your auth link...");

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });

        if (error) {
          throw error;
        }
      } else if (code) {
        setMessage("Creating your secure session...");

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      } else if (accessToken && refreshToken) {
        setMessage("Saving your session...");

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          throw error ?? new Error(fallbackError);
        }
      }

      if (isActive) {
        router.replace("/dashboard");
      }
    }

    completeAuthCallback().catch((error) => {
      const message = encodeURIComponent(getSafeErrorMessage(error));

      if (isActive) {
        router.replace(`/login?error=${message}`);
      }
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <AuthCard
      title="Completing sign-in"
      subtitle="Hang tight while VAL finishes your secure sign-in."
      footerText="Ready?"
      footerHref="/login"
      footerLinkText="Log in"
      notice={message}
    >
      <div className="space-y-4 text-sm leading-6 text-slate-300">
        <p>This should only take a moment.</p>
      </div>
    </AuthCard>
  );
}
