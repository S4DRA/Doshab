import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

<<<<<<< Updated upstream
import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
import { normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
=======
import { shouldBypassEmailVerificationForDev } from "@/lib/auth-dev-flags";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  confirmSupabaseUserEmailForDev,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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

function redirectWithSuccess(request: NextRequest, email: string) {
  return NextResponse.redirect(
    new URL(
      `/login?registered=1&message=${encodeURIComponent(
        "Account created. You can log in now.",
      )}&email=${encodeURIComponent(email)}`,
      request.url,
    ),
    { status: 303 },
  );
}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    if (isDevEmailAuthBypassEnabled()) {
      // TODO: Re-enable email verification/reset before production.
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: {
          name,
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

      return redirectWithSuccess(request, email);
    }

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
=======
    if (!shouldBypassEmailVerificationForDev()) {
      return redirectWithError(
        request,
        "Direct signup is temporarily development-only. Disable Supabase email confirmation before production.",
      );
    }
>>>>>>> Stashed changes

    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
    const supabase = createSupabaseRouteClient(request, response);

    // TODO: Re-enable email verification/reset before production.
    const supabaseAdmin = createSupabaseAdminClient();
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        name,
      },
    });

    if (createError?.message?.toLowerCase().includes("already")) {
      const existingSignIn = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingSignIn.error?.code === "email_not_confirmed") {
        await confirmSupabaseUserEmailForDev(email);
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (retry.error) {
          return redirectWithError(request, retry.error.message || "Could not sign in.");
        }
      } else if (existingSignIn.error) {
        return redirectWithError(
          request,
          "This account already exists. Log in with the existing password.",
        );
      }
    } else if (createError) {
      return redirectWithError(request, createError.message || "Sign up failed.");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return redirectWithError(request, signInError.message || "Could not sign in.");
      }
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

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return redirectWithError(
        request,
<<<<<<< Updated upstream
        "Development signup bypass needs SUPABASE_SERVICE_ROLE_KEY on the server.",
=======
        "Direct signup needs SUPABASE_SERVICE_ROLE_KEY on the server.",
>>>>>>> Stashed changes
      );
    }

    console.error("Registration failed", error);
    return redirectWithError(request, "Authentication is temporarily unavailable.");
  }
}
