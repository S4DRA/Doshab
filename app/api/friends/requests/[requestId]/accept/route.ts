import { NextRequest, NextResponse } from "next/server";

import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

type RequestActionProps = {
  params: Promise<{
    requestId: string;
  }>;
};

function redirectToRequestsPanel(request: NextRequest, message: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("message", message);
  url.hash = "requests-and-invites";

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest, { params }: RequestActionProps) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { requestId } = await params;
  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      id: requestId,
      receiverId: user.id,
      status: "PENDING",
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
    },
  });

  if (!friendRequest) {
    return redirectToRequestsPanel(request, "Friend request not found.");
  }

  const [userOneId, userTwoId] = orderedFriendshipPair(
    friendRequest.senderId,
    friendRequest.receiverId,
  );

  await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: friendRequest.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.friendship.upsert({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      create: {
        userOneId,
        userTwoId,
      },
      update: {},
    }),
  ]);

  await auditSecurityEvent(
    "friend-request.accept",
    {
      actorId: user.id,
      requestId: friendRequest.id,
    },
    request,
  );

  return redirectToRequestsPanel(request, "Friend request accepted.");
}
