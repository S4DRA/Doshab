import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  createFriendCallRoomName,
  friendCallDurationMs,
  getFriendCallHref,
  findFriendship,
} from "@/lib/calls";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getFriendId(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      friendId?: unknown;
    } | null;

    return typeof body?.friendId === "string" ? body.friendId : "";
  }

  const formData = await request.formData().catch(() => null);
  const friendId = formData?.get("friendId");

  return typeof friendId === "string" ? friendId : "";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const friendId = await getFriendId(request);
  const isJsonRequest = request.headers
    .get("content-type")
    ?.includes("application/json");

  if (!friendId || friendId === user.id) {
    return jsonError("Choose a valid friend.", 400);
  }

  const [friendship, friend] = await Promise.all([
    findFriendship(user.id, friendId),
    prisma.user.findUnique({
      where: {
        id: friendId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  if (!friendship || !friend) {
    return jsonError("You can only call accepted friends.", 403);
  }

  const now = new Date();
  const callId = randomUUID();
  const href = getFriendCallHref(callId);

  const previousRingingCalls = await prisma.friendCall.findMany({
    where: {
      callerId: user.id,
      receiverId: friend.id,
      status: "RINGING",
    },
    select: {
      id: true,
    },
  });

  await prisma.friendCall.updateMany({
    where: {
      callerId: user.id,
      receiverId: friend.id,
      status: "RINGING",
    },
    data: {
      endedAt: now,
      status: "MISSED",
    },
  });

  await Promise.all(
    previousRingingCalls.map((previousCall) =>
      createNotification({
        actorId: user.id,
        body: `You missed a call from ${user.name || user.email}.`,
        callId: previousCall.id,
        data: {
          callId: previousCall.id,
        },
        href: getFriendCallHref(previousCall.id),
        title: "Missed call",
        type: "MISSED_CALL",
        userId: friend.id,
      }),
    ),
  );

  const call = await prisma.friendCall.create({
    data: {
      id: callId,
      callerId: user.id,
      expiresAt: new Date(now.getTime() + friendCallDurationMs),
      receiverId: friend.id,
      roomName: createFriendCallRoomName(callId),
    },
    select: {
      id: true,
    },
  });

  await createNotification({
    actorId: user.id,
    body: `${user.name || user.email} is calling you.`,
    callId: call.id,
    data: {
      callId: call.id,
      type: "call",
    },
    expiresAt: new Date(now.getTime() + friendCallDurationMs),
    href,
    title: "Incoming call",
    type: "INCOMING_CALL",
    userId: friend.id,
    push: {
      actions: [
        {
          action: "answer-call",
          title: "Answer",
        },
        {
          action: "decline-call",
          title: "Decline",
        },
      ],
      requireInteraction: true,
      tag: `friend-call-${call.id}`,
    },
  });

  if (isJsonRequest) {
    return NextResponse.json({
      callId: call.id,
      href,
    });
  }

  return NextResponse.redirect(new URL(href, request.url), { status: 303 });
}
