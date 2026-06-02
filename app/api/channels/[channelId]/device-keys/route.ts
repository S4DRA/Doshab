import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeviceKeysRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export async function GET(_: Request, { params }: DeviceKeysRouteProps) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { channelId } = await params;

  const userId = auth.user.id;

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      type: "TEXT",
      group: {
        members: {
          some: {
            userId,
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
