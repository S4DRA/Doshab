import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8),
});

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/register?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

function redirectToLogin(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url, { status: 303 });
}

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

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, {
    key: "auth:register",
    limit: 3,
    windowMs: 60 * 60_000,
  });

  if (limited) {
    return limited;
  }

  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return redirectWithError(request, "Enter a valid name, email, and password.");
  }

  const name = parsed.data.name;
  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;

  try {
    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (signUpError?.message?.toLowerCase().includes("already")) {
      const existingSignIn = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingSignIn.error?.code === "email_not_confirmed") {
        return redirectToLogin(request, {
          message: "Account exists, but the email is not confirmed yet. Check your inbox.",
        });
      } else if (existingSignIn.error) {
        return redirectWithError(
          request,
          "This account already exists. Log in with the existing password.",
        );
      }

      return response;
    }

    if (signUpError) {
      return redirectWithError(request, signUpError.message || "Sign up failed.");
    }

    if (!signUpData.session) {
      return redirectToLogin(request, {
        message: "Account created. Check your email to confirm it, then log in.",
      });
    }

    if (signUpData.user) {
      const nameFromMetadata =
        typeof signUpData.user.user_metadata?.name === "string"
          ? signUpData.user.user_metadata.name
          : "";

      if (!nameFromMetadata) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            name,
          },
        });

        if (updateError) {
          return redirectWithError(
            request,
            updateError.message || "Account created, but profile setup failed.",
          );
        }
      }
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectWithError(request, "Supabase Auth is not configured on this server.");
    }

    console.error("Registration failed", error);
    return redirectWithError(request, "Authentication is temporarily unavailable.");
  }
}
