import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { reactionEmojis } from "@/lib/chat-constants";
import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { getMessageAccess } from "@/lib/community-permissions";
import { prisma } from "@/lib/prisma";

type ReactionRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: ReactionRouteProps) {
  const user = await getCurrentUser();
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { emoji?: unknown } | null;
  const emoji = typeof body?.emoji === "string" ? body.emoji : "";

  if (!reactionEmojis.includes(emoji as (typeof reactionEmojis)[number])) {
    return NextResponse.json({ error: "Unsupported reaction." }, { status: 400 });
  }

  const access = await getMessageAccess(messageId, user.id);

  if (!access) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        emoji,
        messageId,
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await prisma.messageReaction.create({
      data: {
        emoji,
        messageId,
        userId: user.id,
      },
    });
  }

  const message = await prisma.message.findUniqueOrThrow({
    where: {
      id: messageId,
    },
    select: chatMessageBaseSelect,
  });

  return NextResponse.json(await formatChatMessage(message, user.id));
}
