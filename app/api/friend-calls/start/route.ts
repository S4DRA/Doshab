import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  createFriendCallRoomName,
  friendCallDurationMs,
  getFriendCallHref,
  findFriendship,
} from "@/lib/calls";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotifications } from "@/lib/push";

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

  await sendPushNotifications({
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
    body: `${user.name || user.email} is calling you.`,
    data: {
      callId: call.id,
      type: "call",
    },
    href,
    recipientIds: [friend.id],
    requireInteraction: true,
    tag: `friend-call-${call.id}`,
    title: "Incoming call",
  }).catch((error: unknown) => {
    console.error("Failed to send call push notification", error);
  });

  if (isJsonRequest) {
    return NextResponse.json({
      callId: call.id,
      href,
    });
  }

  return NextResponse.redirect(new URL(href, request.url), { status: 303 });
}
