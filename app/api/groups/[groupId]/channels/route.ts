import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ChannelRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

function normalizeChannelName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function redirectAfterChannelSubmit(
  request: NextRequest,
  groupId: string,
  returnTo: string,
  type: "error" | "message",
  message: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings`
      : `/dashboard/groups/${groupId}`;
  const url = new URL(pathname, request.url);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url, { status: 303 });
}

function redirectAfterChannelChange(
  request: NextRequest,
  groupId: string,
  channelId: string,
  returnTo: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings?message=${encodeURIComponent("Channel created.")}`
      : `/dashboard/groups/${groupId}/channels/${channelId}`;

  return NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
}

export async function POST(request: NextRequest, { params }: ChannelRouteProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const name = normalizeChannelName(String(formData.get("name") ?? ""));
  const returnTo = String(formData.get("returnTo") ?? "");
  const type = String(formData.get("type") ?? "TEXT");

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
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "Only owners and admins can create channels.",
    );
  }

  if (!name) {
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "Channel name is required.",
    );
  }

  if (type !== "TEXT" && type !== "VOICE") {
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "Channel type is invalid.",
    );
  }

  const existingChannel = await prisma.channel.findUnique({
    where: {
      groupId_name: {
        groupId,
        name,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingChannel) {
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "A channel with that name already exists.",
    );
  }

  const channel = await prisma.channel.create({
    data: {
      groupId,
      name,
      type,
    },
    select: {
      id: true,
    },
  });

  return redirectAfterChannelChange(request, groupId, channel.id, returnTo);
}
