import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
import { normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/permissions";
import {
  confirmSupabaseEmailForDev,
=======
=======
>>>>>>> Stashed changes
import { shouldBypassEmailVerificationForDev } from "@/lib/auth-dev-flags";
import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  confirmSupabaseUserEmailForDev,
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

    let { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
<<<<<<< Updated upstream
      if (error.code === "email_not_confirmed") {
<<<<<<< Updated upstream
        if (isDevEmailAuthBypassEnabled()) {
          // TODO: Re-enable email verification/reset before production.
          await confirmSupabaseEmailForDev(email);
=======
        if (shouldBypassEmailVerificationForDev()) {
          // TODO: Re-enable email verification/reset before production.
          await confirmSupabaseUserEmailForDev(email);
>>>>>>> Stashed changes
          const retry = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          signInData = retry.data;
          error = retry.error;
        }

<<<<<<< Updated upstream
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
=======
        if (error) {
          return redirectWithError(
            request,
            "Email verification is disabled for development. Ask the server to confirm this account or create it again.",
            returnTo,
>>>>>>> Stashed changes
          );
=======
      if (error.code === "email_not_confirmed" && shouldBypassEmailVerificationForDev()) {
        // TODO: Re-enable email verification/reset before production.
        await confirmSupabaseUserEmailForDev(email);
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        signInData = retry.data;
        error = retry.error;
      }

      if (error) {
        const legacyUser = await prisma.user.findUnique({
          where: { email },
          select: { name: true, passwordHash: true },
        });

        if (legacyUser?.passwordHash) {
          const ok = await bcrypt.compare(password, legacyUser.passwordHash).catch(() => false);

          if (ok) {
            if (!shouldBypassEmailVerificationForDev()) {
              return redirectWithError(
                request,
                "Direct signup is temporarily development-only. Disable Supabase email confirmation before production.",
                returnTo,
              );
            }

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
                "This email already exists. Try logging in again.",
                returnTo,
              );
            }

            if (createError) {
              return redirectWithError(
                request,
                createError.message || "Could not create account.",
                returnTo,
              );
            }

            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (retry.error) {
              return redirectWithError(request, retry.error.message || "Could not sign in.", returnTo);
            }

            signInData = retry.data;
            error = null;
          }
>>>>>>> Stashed changes
        }
      }

      if (error) {
<<<<<<< Updated upstream
        // Backward-compat: if the user exists in Prisma (old auth), allow them to
<<<<<<< Updated upstream
        // "upgrade" by creating a Supabase Auth account with the same password.
=======
        // "upgrade" by creating a confirmed Supabase Auth account with the same password.
>>>>>>> Stashed changes
        const legacyUser = await prisma.user.findUnique({
          where: { email },
          select: { name: true, passwordHash: true },
        });

        if (legacyUser?.passwordHash) {
          const ok = await bcrypt.compare(password, legacyUser.passwordHash).catch(() => false);

          if (ok) {
<<<<<<< Updated upstream
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
=======
            if (!shouldBypassEmailVerificationForDev()) {
              return redirectWithError(
                request,
                "Direct signup is temporarily development-only. Disable Supabase email confirmation before production.",
                returnTo,
              );
            }

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
                "This email already exists. Try logging in again.",
                returnTo,
              );
            }

            if (createError) {
              return redirectWithError(
                request,
                createError.message || "Could not create account.",
                returnTo,
              );
            }

            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (retry.error) {
              return redirectWithError(request, retry.error.message || "Could not sign in.", returnTo);
            }

            signInData = retry.data;
            error = null;
          }
        }
      }

      if (error) {
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        return redirectWithError(request, "Invalid email or password.", returnTo);
      }
    }

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

<<<<<<< Updated upstream
    // TODO: Re-enable email verification/reset before production.
<<<<<<< Updated upstream
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
=======
    if (!authenticatedUser.email_confirmed_at && !shouldBypassEmailVerificationForDev()) {
      await supabase.auth.signOut();
      return redirectWithError(
        request,
        "Email verification is disabled for development. Confirm this account before production login.",
        returnTo,
>>>>>>> Stashed changes
=======
    if (!authenticatedUser.email_confirmed_at && !shouldBypassEmailVerificationForDev()) {
      return redirectWithError(
        request,
        "Email confirmation is disabled in this build. Confirm this account before production login.",
        returnTo,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        "Development email bypass needs SUPABASE_SERVICE_ROLE_KEY on the server.",
=======
        "Direct auth needs SUPABASE_SERVICE_ROLE_KEY on the server.",
>>>>>>> Stashed changes
=======
        "Direct auth needs SUPABASE_SERVICE_ROLE_KEY on the server.",
>>>>>>> Stashed changes
        returnTo,
      );
    }

    console.error("Login failed", error);
    return redirectWithError(request, "Authentication is temporarily unavailable.", returnTo);
  }
}
