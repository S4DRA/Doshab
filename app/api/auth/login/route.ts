import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
import { normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/permissions";
import {
  confirmSupabaseEmailForDev,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  returnTo: z.string().optional(),
});

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
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo") ?? undefined,
  });

  if (!parsed.success) {
    return redirectWithError(request, "Enter a valid email and password.");
  }

  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;
  const returnTo = getSafeReturnTo(parsed.data.returnTo ?? "/dashboard");
  const limited = await rateLimit(request, {
    identifiers: [`email:${email}`],
    key: "auth:login",
    limit: 5,
    windowMs: 10 * 60_000,
  });

  if (limited) {
    return limited;
  }

  try {
    const response = NextResponse.redirect(new URL(returnTo, request.url), {
      status: 303,
    });
    const supabase = createSupabaseRouteClient(request, response);
    const origin = getRequestOrigin(request);

    let { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "email_not_confirmed") {
        if (isDevEmailAuthBypassEnabled()) {
          // TODO: Re-enable email verification/reset before production.
          await confirmSupabaseEmailForDev(email);
          const retry = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          signInData = retry.data;
          error = retry.error;
        }

        if (!error) {
          await auditSecurityEvent(
            "auth.login.dev_email_bypass",
            {
              email,
            },
            request,
          );
        } else {
          await auditSecurityEvent(
            "auth.login.failure",
            {
              email,
              reason: "email_not_confirmed",
            },
            request,
          );
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
      }

      if (error) {
        // Backward-compat: if the user exists in Prisma (old auth), allow them to
        // "upgrade" by creating a Supabase Auth account with the same password.
        const legacyUser = await prisma.user.findUnique({
          where: { email },
          select: { name: true, passwordHash: true },
        });

        if (legacyUser?.passwordHash) {
          const ok = await bcrypt.compare(password, legacyUser.passwordHash).catch(() => false);

          if (ok) {
            if (isDevEmailAuthBypassEnabled()) {
              // TODO: Re-enable email verification/reset before production.
              const supabaseAdmin = createSupabaseAdminClient();
              const { error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                email_confirm: true,
                password,
                user_metadata: {
                  name: legacyUser.name,
                },
              });

              if (createError?.message?.toLowerCase().includes("already")) {
                return redirectWithError(
                  request,
                  "This email already exists. Try logging in again, or use the development reset flow.",
                  returnTo,
                );
              }

              if (createError) {
                return redirectWithError(request, createError.message, returnTo);
              }

              const retry = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (retry.error) {
                return redirectWithError(request, retry.error.message, returnTo);
              }

              return response;
            }

            if (error) {
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
        }

        await auditSecurityEvent(
          "auth.login.failure",
          {
            email,
            reason: "invalid_credentials",
          },
          request,
        );
        return redirectWithError(request, "Invalid email or password.", returnTo);
      }
    }

    // Prefer the signed-in user returned by Auth directly. In local SSR flows,
    // a same-request getUser() can miss the freshly written auth cookies.
    let authenticatedUser: typeof signInData.user | null = signInData.user;

    if (!authenticatedUser) {
      const { data } = await supabase.auth.getUser();
      authenticatedUser = data.user;
    }

    if (!authenticatedUser) {
      await auditSecurityEvent(
        "auth.login.failure",
        {
          email,
          reason: "missing_authenticated_user",
        },
        request,
      );
      return redirectWithError(request, "Authentication is temporarily unavailable.", returnTo);
    }

    // TODO: Re-enable email verification/reset before production.
    if (!authenticatedUser.email_confirmed_at && !isDevEmailAuthBypassEnabled()) {
      await supabase.auth.signOut();
      await auditSecurityEvent(
        "auth.login.failure",
        {
          email,
          reason: "email_unconfirmed",
        },
        request,
      );
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
      typeof authenticatedUser.user_metadata?.name === "string"
        ? authenticatedUser.user_metadata.name
        : "";

    const prismaUser = await prisma.user.upsert({
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

    await auditSecurityEvent(
      "auth.login.success",
      {
        actorId: prismaUser.id,
        email,
      },
      request,
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectWithError(request, "Supabase Auth is not configured on this server.", returnTo);
    }

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return redirectWithError(
        request,
        "Development email bypass needs SUPABASE_SERVICE_ROLE_KEY on the server.",
        returnTo,
      );
    }

    console.error("Login failed", error);
    return redirectWithError(request, "Authentication is temporarily unavailable.", returnTo);
  }
}
