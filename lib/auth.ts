import { shouldBypassEmailVerificationForDev } from "@/lib/auth-dev-flags";
import { prisma } from "@/lib/prisma";
import type { Prisma, UserStatus } from "@/lib/generated/prisma/client";
import { getSession } from "@/lib/session";
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
    const select: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      status: true,
    };

    if (options?.includeImage) {
      select.image = true;
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return getLegacySessionAuthState(select);
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return getLegacySessionAuthState(select);
    }

    const email = normalizeEmail(data.user.email ?? "");

    if (!email) {
      return getLegacySessionAuthState(select);
    }

    const prismaUser = await prisma.user.findUnique({
      where: { email },
      select,
    });

    // TODO: Re-enable email verification/reset before production.
    if (!data.user.email_confirmed_at && !shouldBypassEmailVerificationForDev()) {
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

async function getLegacySessionAuthState(
  select: Prisma.UserSelect,
): Promise<AuthState> {
  const session = await getSession();

  if (!session) {
    return { status: "unauthenticated" };
  }

  const prismaUser = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select,
  });

  if (!prismaUser) {
    return { status: "unauthenticated" };
  }

  return { status: "authenticated", user: prismaUser };
}

export async function getCurrentUser(options?: { includeImage?: boolean }) {
  const state = await getAuthState(options);

  if (state.status !== "authenticated") {
    return null;
  }

  return state.user;
}
