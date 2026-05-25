import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type MessagesRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

function redirectBack(request: NextRequest, groupId?: string, channelId?: string) {
  if (groupId && channelId) {
    return NextResponse.redirect(
      new URL(`/dashboard/groups/${groupId}/channels/${channelId}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), {
    status: 303,
  });
}

export async function POST(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await getCurrentUser();
  const { channelId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
    select: {
      id: true,
      groupId: true,
      type: true,
      group: {
        select: {
          members: {
            where: {
              userId: user.id,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!channel || !channel.group.members.length) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (channel.type !== "TEXT") {
    return redirectBack(request, channel.groupId, channel.id);
  }

  const formData = await request.formData();
  const content = String(formData.get("content") ?? "").trim();

  if (!content || content.length > 2000) {
    return redirectBack(request, channel.groupId, channel.id);
  }

  await prisma.message.create({
    data: {
      channelId: channel.id,
      senderId: user.id,
      content,
    },
  });

  return redirectBack(request, channel.groupId, channel.id);
}
