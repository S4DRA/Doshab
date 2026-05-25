import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

function redirectWithMessage(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/friends?message=${encodeURIComponent(message)}`, request.url),
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

  if (!receiverId || receiverId === user.id) {
    return redirectWithMessage(request, "You cannot send that friend request.");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });

  if (!receiver) {
    return redirectWithMessage(request, "User not found.");
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
    return redirectWithMessage(request, "You are already friends.");
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
    return redirectWithMessage(request, "A pending request already exists.");
  }

  await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId,
      status: "PENDING",
    },
  });

  return redirectWithMessage(request, "Friend request sent.");
}
