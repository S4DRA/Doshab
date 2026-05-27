import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isCallExpired } from "@/lib/calls";
import { createLiveKitToken } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

type CallTokenRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_: NextRequest, { params }: CallTokenRouteProps) {
  const user = await getCurrentUser();
  const { callId } = await params;

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const call = await prisma.friendCall.findUnique({
    where: {
      id: callId,
    },
    select: {
      callerId: true,
      expiresAt: true,
      id: true,
      receiverId: true,
      roomName: true,
      status: true,
      caller: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
    },
  });

  if (!call) {
    return jsonError("Call not found.", 404);
  }

  const isCaller = call.callerId === user.id;
  const isReceiver = call.receiverId === user.id;

  if (!isCaller && !isReceiver) {
    return jsonError("You cannot join this call.", 403);
  }

  if (call.status === "RINGING" && isCallExpired(call.expiresAt)) {
    await prisma.friendCall.update({
      where: {
        id: call.id,
      },
      data: {
        endedAt: new Date(),
        status: "MISSED",
      },
    });

    return jsonError("This call was missed.", 410);
  }

  if (call.status === "DECLINED") {
    return jsonError("This call was declined.", 409);
  }

  if (call.status === "MISSED" || call.status === "ENDED") {
    return jsonError("This call has ended.", 409);
  }

  if (isReceiver && call.status === "RINGING") {
    await prisma.friendCall.update({
      where: {
        id: call.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });
  }

  const tokenResponse = await createLiveKitToken({
    roomName: call.roomName,
    participant: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });

  if (!tokenResponse) {
    return jsonError("LiveKit is not configured.", 500);
  }

  const friend = isCaller ? call.receiver : call.caller;

  return NextResponse.json({
    ...tokenResponse,
    call: {
      id: call.id,
      friend,
      status: isReceiver ? "ACCEPTED" : call.status,
    },
  });
}
