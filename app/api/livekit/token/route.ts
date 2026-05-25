import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createLiveKitRoomName, createLiveKitToken } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getChannelId(request: NextRequest) {
  const queryChannelId = request.nextUrl.searchParams.get("channelId");

  if (queryChannelId) {
    return queryChannelId;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      channelId?: unknown;
    } | null;

    return typeof body?.channelId === "string" ? body.channelId : "";
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData().catch(() => null);
    const formChannelId = formData?.get("channelId");

    return typeof formChannelId === "string" ? formChannelId : "";
  }

  return "";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const channelId = await getChannelId(request);

  if (!channelId) {
    return jsonError("channelId is required.", 400);
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
    select: {
      id: true,
      groupId: true,
      type: true,
      group: {
        select: {
          members: {
            where: {
              userId: user.id,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!channel) {
    return jsonError("Channel not found.", 404);
  }

  if (channel.type !== "VOICE") {
    return jsonError("LiveKit tokens are only available for voice channels.", 400);
  }

  if (!channel.group.members.length) {
    return jsonError("You are not a member of this group.", 403);
  }

  const roomName = createLiveKitRoomName(channel.groupId, channel.id);
  const tokenResponse = await createLiveKitToken({
    roomName,
    participant: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });

  if (!tokenResponse) {
    return jsonError("LiveKit is not configured.", 500);
  }

  return NextResponse.json(tokenResponse);
}
