import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const updatePasswordSchema = z.object({
  confirmPassword: z.string().min(8),
  password: z.string().min(8),
  returnTo: z.enum(["profile", "reset"]).optional(),
});

type PasswordReturnTarget = "profile" | "reset";

function getReturnTarget(value: FormDataEntryValue | null): PasswordReturnTarget {
  return value === "profile" ? "profile" : "reset";
}

function getRedirectPath(target: PasswordReturnTarget, type: "error" | "message", text: string) {
  const path = target === "profile" ? "/dashboard/profile" : "/reset-password";
  const params = new URLSearchParams({ [type]: text });

  return `${path}?${params.toString()}`;
}

function redirectWithStatus(
  request: NextRequest,
  target: PasswordReturnTarget,
  type: "error" | "message",
  text: string,
) {
  return NextResponse.redirect(
    new URL(getRedirectPath(target, type, text), request.url),
    { status: 303 },
  );
}

function getSuccessResponse(request: NextRequest, target: PasswordReturnTarget) {
  if (target === "reset") {
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

  return redirectWithStatus(request, target, "message", "Password updated.");
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, {
    key: "auth:update-password",
    limit: 6,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const formData = await request.formData();
  const returnTarget = getReturnTarget(formData.get("returnTo"));
  const parsed = updatePasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo") ?? undefined,
  });

  if (!parsed.success) {
    return redirectWithStatus(
      request,
      returnTarget,
      "error",
      "Password must be at least 8 characters.",
    );
  }

  const password = parsed.data.password;
  const confirmPassword = parsed.data.confirmPassword;

  if (password !== confirmPassword) {
    return redirectWithStatus(
      request,
      returnTarget,
      "error",
      "Passwords do not match.",
    );
  }

  try {
    const response = getSuccessResponse(request, returnTarget);
    const supabase = createSupabaseRouteClient(request, response);
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      return returnTarget === "profile"
        ? NextResponse.redirect(new URL("/login", request.url), { status: 303 })
        : redirectWithStatus(request, returnTarget, "error", "Your reset link expired. Request a new one.");
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return redirectWithStatus(
        request,
        returnTarget,
        "error",
        error.message || "Could not update your password.",
      );
    }

    if (returnTarget === "reset") {
      await supabase.auth.signOut().catch(() => null);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      return redirectWithStatus(
        request,
        returnTarget,
        "error",
        "Supabase Auth is not configured on this server.",
      );
    }

    console.error("Password update failed", error);
    return redirectWithStatus(
      request,
      returnTarget,
      "error",
      "Authentication is temporarily unavailable.",
    );
  }
}
