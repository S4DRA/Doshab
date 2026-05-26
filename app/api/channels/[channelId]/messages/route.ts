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

export async function GET(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await getCurrentUser();
  const { channelId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messageId = request.nextUrl.searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      channelId,
      channel: {
        type: "TEXT",
        group: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}
