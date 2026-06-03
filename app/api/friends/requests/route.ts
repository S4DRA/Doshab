import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { orderedFriendshipPair } from "@/lib/friends";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function getRedirectPath(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard/friends";
}

function redirectWithMessage(request: NextRequest, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("message", message);

  return NextResponse.redirect(
    url,
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const receiverId = String(formData.get("receiverId") ?? "");
  const redirectPath = getRedirectPath(formData);

  if (!receiverId || receiverId === user.id) {
    return redirectWithMessage(request, redirectPath, "You cannot send that friend request.");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });

  if (!receiver) {
    return redirectWithMessage(request, redirectPath, "User not found.");
  }

  const [userOneId, userTwoId] = orderedFriendshipPair(user.id, receiverId);
  const existingFriendship = await prisma.friendship.findUnique({
    where: {
      userOneId_userTwoId: {
        userOneId,
        userTwoId,
      },
    },
    select: { id: true },
  });

  if (existingFriendship) {
    return redirectWithMessage(request, redirectPath, "You are already friends.");
  }

  const existingPendingRequest = await prisma.friendRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { senderId: user.id, receiverId },
        { senderId: receiverId, receiverId: user.id },
      ],
    },
    select: { id: true },
  });

  if (existingPendingRequest) {
    return redirectWithMessage(request, redirectPath, "A pending request already exists.");
  }

  const requestRecord = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  await createNotification({
    actorId: user.id,
    body: `${user.name || user.email} sent you a friend request.`,
    data: {
      friendRequestId: requestRecord.id,
    },
    href: "/dashboard/friends",
    title: "New friend request",
    type: "FRIEND_REQUEST",
    userId: receiverId,
  });

  return redirectWithMessage(request, redirectPath, "Friend request sent.");
}
