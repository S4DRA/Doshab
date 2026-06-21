import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireAuth } from "@/lib/security/permissions";

const voteSchema = z.object({
  optionId: z.string().trim().min(1).max(128),
});

type PollVoteRouteProps = {
  params: Promise<{
    pollId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: PollVoteRouteProps) {
  const limited = await rateLimit(request, {
    key: "polls:vote",
    limit: 120,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const user = await requireAuth().catch(() => null);
  const { pollId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = voteSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a poll option." }, { status: 400 });
  }

  const optionId = parsed.data.optionId;

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
