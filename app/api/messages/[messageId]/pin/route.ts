import { NextResponse } from "next/server";

import { chatMessageBaseSelect, formatChatMessage } from "@/lib/chat-messages";
import { prisma } from "@/lib/prisma";
import {
  auditSecurityEvent,
  canModerateMessage,
  requireAuth,
  requireMessageAccess,
} from "@/lib/security/permissions";

type PinRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: Request, { params }: PinRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await requireMessageAccess(user.id, messageId).catch(() => null);
  const role = access?.channel.group.members[0]?.role;

  if (!access) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (access.channel.group.isDirectMessage || !canModerateMessage(role)) {
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

  await auditSecurityEvent(
    current?.pinnedAt ? "message.unpin" : "message.pin",
    {
      actorId: user.id,
      messageId,
    },
    request,
  );

  return NextResponse.json(await formatChatMessage(message, user.id));
}
