import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EndCallRouteProps = {
  params: Promise<{
    callId: string;
  }>;
};

export async function POST(_: NextRequest, { params }: EndCallRouteProps) {
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
  }

  return NextResponse.json({ ok: true });
}
