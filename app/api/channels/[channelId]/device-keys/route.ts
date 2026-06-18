import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireChannelMember } from "@/lib/security/permissions";

type DeviceKeysRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export async function GET(_: Request, { params }: DeviceKeysRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { channelId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelAccess = await requireChannelMember(user.id, channelId).catch(() => null);

  if (!channelAccess || channelAccess.type !== "TEXT") {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const channel = await prisma.channel.findUniqueOrThrow({
    where: {
      id: channelId,
    },
    select: {
      group: {
        select: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });
  const memberIds = channel.group.members.map((member) => member.userId);
  const devices = await prisma.userDeviceKey.findMany({
    where: {
      userId: {
        in: memberIds,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      publicKey: true,
      userId: true,
    },
  });

  return NextResponse.json({ devices });
}
