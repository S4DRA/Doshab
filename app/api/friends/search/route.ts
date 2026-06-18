import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { areAlreadyFriends } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireAuth } from "@/lib/security/permissions";

function getRedirectPath(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirectTo");

  return redirectTo?.startsWith("/dashboard") ? redirectTo : "/dashboard/friends";
}

function redirectWithParams(
  request: NextRequest,
  params: Record<string, string | undefined>,
) {
  const url = new URL(getRedirectPath(request), request.url);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, {
    key: "friends:search",
    limit: 60,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const email = normalizeEmail(request.nextUrl.searchParams.get("email") ?? "");

  if (!isValidEmail(email)) {
    return redirectWithParams(request, { message: "Enter a valid email." });
  }

  if (email === user.email) {
    return redirectWithParams(request, { message: "You cannot add yourself." });
  }

  const target = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!target) {
    return redirectWithParams(request, {
      message: "No user found.",
      query: email,
    });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userOneId: user.id, userTwoId: target.id },
        { userOneId: target.id, userTwoId: user.id },
      ],
    },
    select: {
      userOneId: true,
      userTwoId: true,
    },
  });

  if (areAlreadyFriends(friendships, user.id, target.id)) {
    return redirectWithParams(request, {
      message: "You are already friends.",
      query: email,
    });
  }

  return redirectWithParams(request, {
    found: target.id,
    query: email,
  });
}
