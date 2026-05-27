import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type InviteRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

function redirectToGroup(request: NextRequest, groupId: string, message: string) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/groups/${groupId}?message=${encodeURIComponent(message)}`,
      request.url,
    ),
    { status: 303 },
  );
}

export async function POST(request: NextRequest, context: InviteRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { groupId } = await context.params;
  const formData = await request.formData();
  const receiverId = String(formData.get("receiverId") ?? "");

  if (!receiverId || receiverId === user.id) {
    return redirectToGroup(request, groupId, "Choose a valid friend to invite.");
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return redirectToGroup(request, groupId, "Only owners and admins can invite friends.");
  }

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      id: true,
    },
  });

  if (!receiver) {
    return redirectToGroup(request, groupId, "That user could not be found.");
  }

  const [userOneId, userTwoId] = orderedFriendshipPair(user.id, receiverId);
  const [friendship, existingMembership, existingInvite] = await Promise.all([
    prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: receiverId,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.groupInvite.findUnique({
      where: {
        groupId_receiverId: {
          groupId,
          receiverId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!friendship) {
    return redirectToGroup(request, groupId, "You can only invite accepted friends.");
  }

  if (existingMembership) {
    return redirectToGroup(request, groupId, "That friend is already in this space.");
  }

  if (existingInvite?.status === "PENDING") {
    return redirectToGroup(request, groupId, "A pending invite already exists.");
  }

  if (existingInvite?.status === "ACCEPTED") {
    return redirectToGroup(request, groupId, "That invite has already been accepted.");
  }

  if (existingInvite?.status === "REJECTED") {
    await prisma.groupInvite.update({
      where: {
        id: existingInvite.id,
      },
      data: {
        inviterId: user.id,
        status: "PENDING",
      },
    });
  } else {
    await prisma.groupInvite.create({
      data: {
        groupId,
        inviterId: user.id,
        receiverId,
        status: "PENDING",
      },
    });
  }

  return redirectToGroup(request, groupId, "Space invite sent.");
}
