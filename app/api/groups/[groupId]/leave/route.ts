import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LeaveGroupRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

function redirectToSettings(request: NextRequest, groupId: string, error: string) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/groups/${groupId}/settings?error=${encodeURIComponent(error)}`,
      request.url,
    ),
    { status: 303 },
  );
}

export async function POST(
  request: NextRequest,
  { params }: LeaveGroupRouteProps,
) {
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
    select: {
      id: true,
      role: true,
      group: {
        select: {
          isDirectMessage: true,
          ownerId: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (membership.group.isDirectMessage) {
    return redirectToSettings(request, groupId, "Private messages cannot be left here.");
  }

  if (membership.group.ownerId === user.id || membership.role === "OWNER") {
    return redirectToSettings(request, groupId, "Owners must delete the space instead of leaving it.");
  }

  await prisma.groupMember.delete({
    where: {
      id: membership.id,
    },
  });

  return NextResponse.redirect(
    new URL("/dashboard?message=You%20left%20the%20space.", request.url),
    { status: 303 },
  );
}
