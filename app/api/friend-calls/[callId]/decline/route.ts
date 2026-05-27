import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeclineCallRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

export async function POST(_: NextRequest, { params }: DeclineCallRouteProps) {
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
      receiverId: true,
      status: true,
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (call.receiverId !== user.id) {
    return NextResponse.json({ error: "Only the receiver can decline." }, { status: 403 });
  }

  if (call.status === "RINGING") {
    await prisma.friendCall.update({
      where: {
        id: callId,
      },
      data: {
        endedAt: new Date(),
        status: "DECLINED",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
