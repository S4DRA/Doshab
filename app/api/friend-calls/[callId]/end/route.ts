import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

type EndCallRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: EndCallRouteProps) {
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
      callerId: true,
      receiverId: true,
      status: true,
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (call.callerId !== user.id && call.receiverId !== user.id) {
    return NextResponse.json({ error: "You cannot end this call." }, { status: 403 });
  }

  if (call.status === "RINGING" || call.status === "ACCEPTED") {
    await prisma.friendCall.update({
      where: {
        id: callId,
      },
      data: {
        endedAt: new Date(),
        status: "ENDED",
      },
    });
    await auditSecurityEvent(
      "friend-call.end",
      {
        actorId: user.id,
        callId,
      },
      request,
    );
  }

  return NextResponse.json({ ok: true });
}
