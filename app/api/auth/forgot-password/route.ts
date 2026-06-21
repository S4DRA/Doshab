import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  isDevPasswordResetEnabled,
  isLegacyEmailPasswordResetEnabled,
} from "@/lib/auth-dev-flags";
import { normalizeEmail } from "@/lib/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/permissions";
import {
  createSupabaseAdminClient,
  findSupabaseUserByEmail,
} from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  confirmPassword: z.string().min(8).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).optional(),
});

function getRequestOrigin(request: NextRequest) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? url.protocol.replace(":", "")}://${host}`;
  }

  return url.origin;
}

function redirectToForgotPassword(
  request: NextRequest,
  type: "error" | "message",
  text: string,
) {
  const url = new URL("/forgot-password", request.url);
  url.searchParams.set(type, text);

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = forgotPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword") ?? undefined,
    email: formData.get("email"),
    password: formData.get("password") ?? undefined,
  });

  if (!parsed.success) {
    return redirectToForgotPassword(request, "error", "Enter a valid email address.");
  }

  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;
  const confirmPassword = parsed.data.confirmPassword;
  const limited = await rateLimit(request, {
    identifiers: [`email:${email}`],
    key: "auth:forgot-password",
    limit: 3,
    windowMs: 60 * 60_000,
  });

  if (limited) {
    return limited;
  }

  try {
    if (isDevPasswordResetEnabled()) {
      // TODO: Re-enable email verification/reset before production.
      if (!password || !confirmPassword) {
        return redirectToForgotPassword(
          request,
          "error",
          "Enter and confirm a new password with at least 8 characters.",
        );
      }

      if (password !== confirmPassword) {
        return redirectToForgotPassword(request, "error", "Passwords do not match.");
      }

      const supabaseAdmin = createSupabaseAdminClient();
      const user = await findSupabaseUserByEmail(email);

      if (user) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password,
        });

        if (error) {
          await auditSecurityEvent(
            "auth.password_reset.failure",
            {
              email,
              reason: error.message || "dev_reset_failed",
            },
            request,
          );
          return redirectToForgotPassword(
            request,
            "error",
            error.message || "Could not update the password.",
          );
        }
      }

      await auditSecurityEvent(
        "auth.password_reset.dev_update",
        {
          email,
          userFound: Boolean(user),
        },
        request,
      );

      return NextResponse.redirect(
        new URL(
          `/login?message=${encodeURIComponent(
            "Password updated. Log in with your new password.",
          )}`,
          request.url,
        ),
        { status: 303 },
      );
    }

    if (!isLegacyEmailPasswordResetEnabled()) {
      // TODO: Re-enable email verification/reset before production.
      return redirectToForgotPassword(
        request,
        "error",
        "Password reset is temporarily unavailable.",
      );
    }

    const response = redirectToForgotPassword(
      request,
      "message",
      "If that email has an account, we sent a password reset link.",
    );
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      await auditSecurityEvent(
        "auth.password_reset.failure",
        {
          email,
          reason: error.message || "reset_email_failed",
        },
        request,
      );
      return redirectToForgotPassword(
        request,
        "error",
        error.message || "Could not send the password reset email.",
      );
    }

    await auditSecurityEvent(
      "auth.password_reset.request",
      {
        email,
      },
      request,
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectToForgotPassword(
        request,
        "error",
        "Supabase Auth is not configured on this server.",
      );
    }

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return redirectToForgotPassword(
        request,
        "error",
        "Development password reset needs SUPABASE_SERVICE_ROLE_KEY on the server.",
      );
    }

    console.error("Password reset email failed", error);
    return redirectToForgotPassword(
      request,
      "error",
      "Authentication is temporarily unavailable.",
    );
  }
}
