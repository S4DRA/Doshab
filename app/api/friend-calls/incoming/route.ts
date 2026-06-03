import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { markFriendCallMissed } from "@/lib/calls";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const expiredCalls = await prisma.friendCall.findMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
      receiverId: user.id,
      status: "RINGING",
    },
    select: {
      caller: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
      id: true,
    },
  });

  if (expiredCalls.length) {
    await prisma.friendCall.updateMany({
      where: {
        id: {
          in: expiredCalls.map((call) => call.id),
        },
      },
      data: {
        endedAt: new Date(),
        status: "MISSED",
      },
    });

    await Promise.all(
      expiredCalls.map((expiredCall) =>
        markFriendCallMissed({
          callId: expiredCall.id,
          caller: expiredCall.caller,
          receiverId: user.id,
        }),
      ),
    );
  }

  const call = await prisma.friendCall.findFirst({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      receiverId: user.id,
      status: "RINGING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      caller: {
        select: {
          id: true,
          image: true,
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({ call });
}
