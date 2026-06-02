import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

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
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) {
    return redirectToForgotPassword(request, "error", "Enter a valid email address.");
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
      return redirectToForgotPassword(
        request,
        "error",
        error.message || "Could not send the password reset email.",
      );
    }

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
