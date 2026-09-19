import { NextRequest, NextResponse } from "next/server";

import { isCallExpired, markFriendCallMissed } from "@/lib/calls";
import { createMediaCredential, mediaServerUrl } from "@/lib/media/credential";
import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

type CallTokenRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest, { params }: CallTokenRouteProps) {
  const user = await requireAuth().catch(() => null);
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
          status: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
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
    await markFriendCallMissed({
      callId: call.id,
      caller: call.caller,
      receiverId: call.receiverId,
    });

    return jsonError("This call was missed.", 410);
  }

  if (call.status === "DECLINED") {
    return jsonError("This call was declined.", 409);
  }

  if (call.status === "MISSED" || call.status === "ENDED") {
    return jsonError("Call ended.", 409);
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

  const credential = createMediaCredential({ roomId: `call:${call.id}`, userId: user.id, metadata: { name: user.name, email: user.email } });

  if (!credential) {
    return jsonError("Media credentials are not configured.", 500);
  }

  const friend = isCaller ? call.receiver : call.caller;
  await auditSecurityEvent(
    "friend-call.token",
    {
      actorId: user.id,
      callId: call.id,
    },
    request,
  );

  return NextResponse.json({
    credential,
    mediaServerUrl: mediaServerUrl(),
    roomId: `call:${call.id}`,
    call: {
      id: call.id,
      friend,
      status: isReceiver ? "ACCEPTED" : call.status,
    },
  });
}
