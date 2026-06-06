import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function redirectWithError(request: NextRequest, error: string, returnTo = "/dashboard") {
  const params = new URLSearchParams({
    error,
    returnTo: getSafeReturnTo(returnTo),
  });

  return NextResponse.redirect(
    new URL(`/login?${params.toString()}`, request.url),
    { status: 303 },
  );
}

function getSafeReturnTo(returnTo: string) {
  return isDashboardPath(returnTo) ? returnTo : "/dashboard";
}

function isDashboardPath(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/") || path.startsWith("/dashboard?");
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
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const returnTo = getSafeReturnTo(String(formData.get("returnTo") ?? "/dashboard"));

  if (!isValidEmail(email) || !password) {
    return redirectWithError(request, "Enter a valid email and password.", returnTo);
  }

  try {
    const response = NextResponse.redirect(new URL(returnTo, request.url), {
      status: 303,
    });
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "email_not_confirmed") {
        return NextResponse.redirect(
          new URL(
            `/verify-email?error=${encodeURIComponent(
              "Please verify your email before using VAL.",
            )}&email=${encodeURIComponent(email)}`,
            request.url,
          ),
          { status: 303 },
        );
      }

      // Backward-compat: if the user exists in Prisma (old auth), allow them to
      // "upgrade" by creating a Supabase Auth account with the same password.
      const legacyUser = await prisma.user.findUnique({
        where: { email },
        select: { name: true, passwordHash: true },
      });

      if (legacyUser?.passwordHash) {
        const ok = await bcrypt.compare(password, legacyUser.passwordHash).catch(() => false);

        if (ok) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: legacyUser.name,
              },
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });

          // If the user already exists in Supabase Auth but with a different password,
          // guide them to reset their password instead of failing silently.
          if (signUpError?.message?.toLowerCase().includes("already")) {
            return redirectWithError(
              request,
              "This email already exists. Try logging in again, or reset your password in Supabase.",
              returnTo,
            );
          }

          return NextResponse.redirect(
            new URL(
              `/verify-email?message=${encodeURIComponent(
                "Account found. Please check your email to verify your VAL account.",
              )}&email=${encodeURIComponent(email)}`,
              request.url,
            ),
            { status: 303 },
          );
        }
      }

      return redirectWithError(request, "Invalid email or password.", returnTo);
    }

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return redirectWithError(request, "Authentication is temporarily unavailable.", returnTo);
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          `/verify-email?error=${encodeURIComponent(
            "Please verify your email before using VAL.",
          )}&email=${encodeURIComponent(email)}`,
          request.url,
        ),
        { status: 303 },
      );
    }

    const nameFromMetadata =
      typeof data.user.user_metadata?.name === "string"
        ? data.user.user_metadata.name
        : "";

    await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name: nameFromMetadata || email,
      },
      create: {
        email,
        name: nameFromMetadata || email,
      },
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectWithError(request, "Supabase Auth is not configured on this server.", returnTo);
    }

    console.error("Login failed", error);
    return redirectWithError(request, "Authentication is temporarily unavailable.", returnTo);
  }
}
