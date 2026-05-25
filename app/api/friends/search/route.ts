import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, normalizeEmail, getCurrentUser } from "@/lib/auth";
import { areAlreadyFriends } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const email = normalizeEmail(request.nextUrl.searchParams.get("email") ?? "");

  if (!isValidEmail(email)) {
    return NextResponse.redirect(
      new URL("/dashboard/friends?message=Enter%20a%20valid%20email.", request.url),
      { status: 303 },
    );
  }

  if (email === user.email) {
    return NextResponse.redirect(
      new URL("/dashboard/friends?message=You%20cannot%20add%20yourself.", request.url),
      { status: 303 },
    );
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
    return NextResponse.redirect(
      new URL(
        `/dashboard/friends?query=${encodeURIComponent(email)}&message=No%20user%20found.`,
        request.url,
      ),
      { status: 303 },
    );
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
    return NextResponse.redirect(
      new URL(
        `/dashboard/friends?query=${encodeURIComponent(email)}&message=You%20are%20already%20friends.`,
        request.url,
      ),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard/friends?query=${encodeURIComponent(email)}&found=${encodeURIComponent(target.id)}`,
      request.url,
    ),
    { status: 303 },
  );
}
