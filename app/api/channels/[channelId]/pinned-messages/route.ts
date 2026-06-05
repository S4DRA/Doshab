import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { chatMessageBaseSelect, formatChatMessages } from "@/lib/chat-messages";
import { getChannelMembership } from "@/lib/community-permissions";
import { prisma } from "@/lib/prisma";

type PinnedRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export async function GET(_request: Request, { params }: PinnedRouteProps) {
  const user = await getCurrentUser();
  const { channelId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = await getChannelMembership(channelId, user.id);

  if (!channel) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      pinnedAt: {
        not: null,
      },
    },
    orderBy: {
      pinnedAt: "desc",
    },
    take: 50,
    select: chatMessageBaseSelect,
  });

  return NextResponse.json({ messages: await formatChatMessages(messages, user.id) });
}
