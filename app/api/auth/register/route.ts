import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/register?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
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
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!name) {
    return redirectWithError(request, "Name is required.");
  }

  if (!isValidEmail(email)) {
    return redirectWithError(request, "Enter a valid email address.");
  }

  if (!isValidPassword(password)) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }

  try {
    const response = NextResponse.redirect(
      new URL(
        `/verify-email?message=${encodeURIComponent(
          "Account created. Please check your email to verify your VAL account.",
        )}&email=${encodeURIComponent(email)}`,
        request.url,
      ),
      { status: 303 },
    );
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirectWithError(request, error.message || "Sign up failed.");
    }

    await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name,
      },
      create: {
        email,
        name,
      },
    });

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
