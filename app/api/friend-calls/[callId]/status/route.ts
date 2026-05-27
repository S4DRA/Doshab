import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isCallExpired } from "@/lib/calls";
import { prisma } from "@/lib/prisma";

type CallStatusRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

export async function GET(_: NextRequest, { params }: CallStatusRouteProps) {
  const user = await getCurrentUser();
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
      expiresAt: true,
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

    return NextResponse.json({ status: "MISSED" });
  }

  return NextResponse.json({ status: call.status });
}
