import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getFriendCallHref } from "@/lib/calls";
import { createNotification } from "@/lib/notifications";
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
      expiredCalls.map(async (expiredCall) => {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            callId: expiredCall.id,
            type: "MISSED_CALL",
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

        if (existingNotification) {
          return;
        }

        await createNotification({
          actorId: expiredCall.caller.id,
          body: `You missed a call from ${expiredCall.caller.name || expiredCall.caller.email}.`,
          callId: expiredCall.id,
          data: {
            callId: expiredCall.id,
          },
          href: getFriendCallHref(expiredCall.id),
          title: "Missed call",
          type: "MISSED_CALL",
          userId: user.id,
        });
      }),
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
