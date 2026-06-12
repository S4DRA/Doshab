import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeleteChannelRouteProps = {
  params: Promise<{
    channelId: string;
    groupId: string;
  }>;
};

function redirectAfterChannelDelete(
  request: NextRequest,
  groupId: string,
  type: "error" | "message",
  message: string,
  returnTo: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings`
      : `/dashboard/groups/${groupId}`;
  const url = new URL(pathname, request.url);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url, { status: 303 });
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
    return redirectAfterChannelDelete(
      request,
      groupId,
      "error",
      "Only owners and admins can delete channels.",
      returnTo,
    );
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
    return redirectAfterChannelDelete(
      request,
      groupId,
      "error",
      "That channel could not be found.",
      returnTo,
    );
  }

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });

  return redirectAfterChannelDelete(
    request,
    groupId,
    "message",
    "Channel deleted.",
    returnTo,
  );
}
