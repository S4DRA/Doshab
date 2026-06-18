import { NextRequest, NextResponse } from "next/server";

import { isCallExpired, markFriendCallMissed } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";

type CallStatusRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

export async function GET(_: NextRequest, { params }: CallStatusRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { callId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const call = await prisma.friendCall.findUnique({
    where: {
      id: callId,
    },
    select: {
      caller: {
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
          status: true,
        },
      },
      callerId: true,
      expiresAt: true,
      receiver: {
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
          status: true,
        },
      },
      receiverId: true,
      status: true,
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (call.callerId !== user.id && call.receiverId !== user.id) {
    return NextResponse.json({ error: "You cannot view this call." }, { status: 403 });
  }

  if (call.status === "RINGING" && isCallExpired(call.expiresAt)) {
    await prisma.friendCall.update({
      where: {
        id: callId,
      },
      data: {
        endedAt: new Date(),
        status: "MISSED",
      },
    });
    await markFriendCallMissed({
      callId,
      caller: call.caller,
      receiverId: call.receiverId,
    });

    return NextResponse.json({
      call: buildCallStatusResponse(call, user.id, "MISSED"),
      status: "MISSED",
    });
  }

  return NextResponse.json({
    call: buildCallStatusResponse(call, user.id, call.status),
    status: call.status,
  });
}

function buildCallStatusResponse(
  call: {
    caller: {
      email: string;
      id: string;
      image: string | null;
      name: string;
      status: string;
    };
    callerId: string;
    expiresAt: Date;
    receiver: {
      email: string;
      id: string;
      image: string | null;
      name: string;
      status: string;
    };
    receiverId: string;
  },
  userId: string,
  status: string,
) {
  const isCaller = call.callerId === userId;

  return {
    expiresAt: call.expiresAt.toISOString(),
    friend: isCaller ? call.receiver : call.caller,
    isCaller,
    isReceiver: call.receiverId === userId,
    status,
  };
}
