import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeleteChannelRouteProps = {
  params: Promise<{
    channelId: string;
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

function redirectAfterChannelDelete(
  request: NextRequest,
  groupId: string,
  message: string,
  returnTo: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings?message=${encodeURIComponent(message)}`
      : `/dashboard/groups/${groupId}?message=${encodeURIComponent(message)}`;

  return NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
}

export async function POST(
  request: NextRequest,
  { params }: DeleteChannelRouteProps,
) {
  const user = await getCurrentUser();
  const { channelId, groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? "");

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

  if (!membership) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return redirectToGroup(request, groupId, "Only owners and admins can delete channels.");
  }

  const channel = await prisma.channel.findFirst({
    where: {
      groupId,
      id: channelId,
    },
    select: {
      id: true,
    },
  });

  if (!channel) {
    return redirectToGroup(request, groupId, "That channel could not be found.");
  }

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });

  return redirectAfterChannelDelete(request, groupId, "Channel deleted.", returnTo);
}
