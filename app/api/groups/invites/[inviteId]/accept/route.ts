import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

type AcceptInviteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

function redirectToRequestsPanel(request: NextRequest, message: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("message", message);
  url.hash = "requests-and-invites";

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest, context: AcceptInviteContext) {
  const user = await requireAuth().catch(() => null);

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
    return redirectToRequestsPanel(request, "That space invite is no longer available.");
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

    return redirectToRequestsPanel(request, "You are already a member of that space.");
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

  await auditSecurityEvent(
    "group-invite.accept",
    {
      actorId: user.id,
      groupId: invite.groupId,
      inviteId: invite.id,
    },
    request,
  );

  return NextResponse.redirect(
    new URL(`/dashboard/groups/${invite.groupId}`, request.url),
    { status: 303 },
  );
}
