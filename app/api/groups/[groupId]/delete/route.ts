import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

type DeleteGroupRouteProps = {
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

export async function POST(
  request: NextRequest,
  { params }: DeleteGroupRouteProps,
) {
  const user = await requireAuth().catch(() => null);
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const membership = await requireGroupRole(user.id, groupId, ["OWNER"]).catch((error: unknown) => {
    if (error instanceof SecurityError && error.status === 404) {
      return null;
    }

    return undefined;
  });

  if (membership === null) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (!membership || membership.group.ownerId !== user.id) {
    return redirectToGroup(request, groupId, "Only the space owner can delete this space.");
  }

  await prisma.group.delete({
    where: {
      id: groupId,
    },
  });

  await auditSecurityEvent(
    "group.delete",
    {
      actorId: user.id,
      groupId,
    },
    request,
  );

  return NextResponse.redirect(
    new URL("/dashboard?message=Space%20deleted.", request.url),
    { status: 303 },
  );
}
