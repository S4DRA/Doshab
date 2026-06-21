import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
import { normalizeEmail } from "@/lib/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const resendConfirmationSchema = z.object({
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

function redirectToVerifyEmail(
  request: NextRequest,
  type: "error" | "message",
  text: string,
  email?: string,
) {
  const url = new URL("/verify-email", request.url);

  url.searchParams.set(type, text);

  if (email) {
    url.searchParams.set("email", email);
  }

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  if (isDevEmailAuthBypassEnabled()) {
    // TODO: Re-enable email verification/reset before production.
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(
          "Email verification is temporarily disabled for development.",
        )}`,
        request.url,
      ),
      { status: 303 },
    );
  }

  const formData = await request.formData();
  const parsed = resendConfirmationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return redirectToVerifyEmail(request, "error", "Enter a valid email address.");
  }

  const email = normalizeEmail(parsed.data.email);
  const limited = await rateLimit(request, {
    identifiers: [`email:${email}`],
    key: "auth:resend-confirmation",
    limit: 3,
    windowMs: 60 * 60_000,
  });

  if (limited) {
    return limited;
  }

  try {
    const response = redirectToVerifyEmail(
      request,
      "message",
      "We sent a fresh verification email. Please use the newest link.",
      email,
    );
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirectToVerifyEmail(
        request,
        "error",
        error.message || "Could not resend the verification email.",
        email,
      );
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectToVerifyEmail(
        request,
        "error",
        "Supabase Auth is not configured on this server.",
        email,
      );
    }

    console.error("Resend confirmation failed", error);
    return redirectToVerifyEmail(
      request,
      "error",
      "Authentication is temporarily unavailable.",
      email,
    );
  }
=======
export async function POST(request: NextRequest) {
=======
export async function POST(request: NextRequest) {
>>>>>>> Stashed changes
  // TODO: Re-enable email verification/reset before production.
  return NextResponse.redirect(
    new URL(
      `/login?message=${encodeURIComponent(
        "Email verification is disabled for development. Log in to continue.",
      )}`,
      request.url,
    ),
    { status: 303 },
  );
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
}
