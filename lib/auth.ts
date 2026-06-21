import { prisma } from "@/lib/prisma";
import type { Prisma, UserStatus } from "@/lib/generated/prisma/client";
<<<<<<< Updated upstream
import { isDevEmailAuthBypassEnabled } from "@/lib/auth-dev-flags";
=======
import { shouldBypassEmailVerificationForDev } from "@/lib/auth-dev-flags";
>>>>>>> Stashed changes
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export type AuthState =
  | { status: "unauthenticated" }
  | { status: "unverified"; email: string }
  | {
      status: "authenticated";
      user: {
        id: string;
        name: string;
        email: string;
        status: UserStatus;
        image?: string | null;
      };
    };

export async function getAuthState(options?: { includeImage?: boolean }): Promise<AuthState> {
  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return { status: "unauthenticated" };
    }
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return { status: "unauthenticated" };
    }

    const email = normalizeEmail(data.user.email ?? "");

    if (!email) {
      return { status: "unauthenticated" };
    }

    const select: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      status: true,
    };

    if (options?.includeImage) {
      select.image = true;
    }

    const prismaUser = await prisma.user.findUnique({
      where: { email },
      select,
    });

    // TODO: Re-enable email verification/reset before production.
<<<<<<< Updated upstream
    if (!data.user.email_confirmed_at && !isDevEmailAuthBypassEnabled()) {
=======
    if (!data.user.email_confirmed_at && !shouldBypassEmailVerificationForDev()) {
>>>>>>> Stashed changes
      return { status: "unverified", email };
    }

    if (prismaUser) {
      return { status: "authenticated", user: prismaUser };
    }

    const nameFromMetadata =
      typeof data.user.user_metadata?.name === "string"
        ? data.user.user_metadata.name
        : "";

    const createdUser = await prisma.user.create({
      data: {
        email,
        name: nameFromMetadata || email,
      },
      select,
    });

    return { status: "authenticated", user: createdUser };
  } catch {
    return { status: "unauthenticated" };
  }
}

export async function getCurrentUser(options?: { includeImage?: boolean }) {
  const state = await getAuthState(options);

  if (state.status !== "authenticated") {
    return null;
  }

  return state.user;
}
