import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { canManageSpace, getMessageAccess } from "@/lib/community-permissions";
import { prisma } from "@/lib/prisma";

type PinRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(_request: Request, { params }: PinRouteProps) {
  const user = await getCurrentUser();
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getMessageAccess(messageId, user.id);
  const role = access?.channel.group.members[0]?.role;

  if (!access) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (access.channel.group.isDirectMessage || !canManageSpace(role)) {
    return NextResponse.json({ error: "Only owners and admins can pin messages." }, { status: 403 });
  }

  const current = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      pinnedAt: true,
    },
  });

  const message = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: current?.pinnedAt
      ? {
          pinnedAt: null,
          pinnedById: null,
        }
      : {
          pinnedAt: new Date(),
          pinnedById: user.id,
        },
    select: chatMessageBaseSelect,
  });

  return NextResponse.json(await formatChatMessage(message, user.id));
}
