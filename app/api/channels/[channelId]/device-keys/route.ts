import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type DeviceKeysRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export async function GET(_: Request, { params }: DeviceKeysRouteProps) {
  const session = await getSession();
  const { channelId } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      type: "TEXT",
      group: {
        members: {
          some: {
            userId: session.userId,
          },
        },
      },
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

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

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
