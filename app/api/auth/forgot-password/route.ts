import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/permissions";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
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
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return redirectToForgotPassword(request, "error", "Enter a valid email address.");
  }

  const email = normalizeEmail(parsed.data.email);
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

    console.error("Password reset email failed", error);
    return redirectToForgotPassword(
      request,
      "error",
      "Authentication is temporarily unavailable.",
    );
  }
}
