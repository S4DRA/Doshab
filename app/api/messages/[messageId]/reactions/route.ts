import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { reactionEmojis } from "@/lib/chat-constants";
import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireAuth, requireMessageAccess } from "@/lib/security/permissions";

const reactionSchema = z.object({
  emoji: z.enum(reactionEmojis),
});

type ReactionRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: ReactionRouteProps) {
  const limited = await rateLimit(request, {
    key: "messages:reactions",
    limit: 120,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const user = await requireAuth().catch(() => null);
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reactionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Unsupported reaction." }, { status: 400 });
  }

  const emoji = parsed.data.emoji;
  const access = await requireMessageAccess(user.id, messageId).catch(() => null);

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
