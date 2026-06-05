import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { prisma } from "@/lib/prisma";

type PollVoteRouteProps = {
  params: Promise<{
    pollId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: PollVoteRouteProps) {
  const user = await getCurrentUser();
  const { pollId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { optionId?: unknown } | null;
  const optionId = typeof body?.optionId === "string" ? body.optionId : "";

  if (!optionId) {
    return NextResponse.json({ error: "Choose a poll option." }, { status: 400 });
  }

  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      message: {
        channel: {
          group: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
      options: {
        some: {
          id: optionId,
        },
      },
    },
    select: {
      id: true,
      messageId: true,
    },
  });

  if (!poll) {
    return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  }

  await prisma.pollVote.upsert({
    create: {
      optionId,
      pollId,
      userId: user.id,
    },
    update: {
      optionId,
    },
    where: {
      pollId_userId: {
        pollId,
        userId: user.id,
      },
    },
  });

  const message = await prisma.message.findUniqueOrThrow({
    where: {
      id: poll.messageId,
    },
    select: chatMessageBaseSelect,
  });

  return NextResponse.json(await formatChatMessage(message, user.id));
}
