import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      ownerId: true,
    },
  });

  if (!group) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (group.ownerId !== user.id) {
    return redirectToGroup(request, groupId, "Only the group owner can delete this group.");
  }

  await prisma.group.delete({
    where: {
      id: groupId,
    },
  });

  return NextResponse.redirect(
    new URL("/dashboard?message=Group%20deleted.", request.url),
    { status: 303 },
  );
}
