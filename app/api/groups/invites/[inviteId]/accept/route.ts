import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AcceptInviteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

function redirectWithMessage(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/friends?message=${encodeURIComponent(message)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest, context: AcceptInviteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { inviteId } = await context.params;
  const invite = await prisma.groupInvite.findFirst({
    where: {
      id: inviteId,
      receiverId: user.id,
      status: "PENDING",
    },
    select: {
      id: true,
      groupId: true,
      receiverId: true,
    },
  });

  if (!invite) {
    return redirectWithMessage(request, "That space invite is no longer available.");
  }

  const existingMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: invite.groupId,
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingMembership) {
    await prisma.groupInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    return redirectWithMessage(request, "You are already a member of that space.");
  }

  await prisma.$transaction([
    prisma.groupMember.create({
      data: {
        groupId: invite.groupId,
        userId: user.id,
        role: "MEMBER",
      },
    }),
    prisma.groupInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: "ACCEPTED",
      },
    }),
  ]);

  return NextResponse.redirect(
    new URL(`/dashboard/groups/${invite.groupId}`, request.url),
    { status: 303 },
  );
}
