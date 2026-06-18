import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createFriendCallRoomName,
  friendCallDurationMs,
  getFriendCallHref,
  findFriendship,
} from "@/lib/calls";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

const startCallSchema = z.object({
  friendId: z.string().trim().min(1).max(128),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getFriendId(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const parsed = startCallSchema.safeParse(await request.json().catch(() => null));

    return parsed.success ? parsed.data.friendId : "";
  }

  const formData = await request.formData().catch(() => null);
  const parsed = startCallSchema.safeParse({
    friendId: formData?.get("friendId"),
  });

  return parsed.success ? parsed.data.friendId : "";
}

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const limited = await rateLimit(request, {
    identifiers: [`user:${user.id}`],
    key: "friend-calls:start",
    limit: 20,
    windowMs: 60 * 60_000,
  });

  if (limited) {
    return limited;
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
  const expiresAt = new Date(now.getTime() + friendCallDurationMs);
  const href = getFriendCallHref(callId);
  const callerName = user.name || user.email;

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
      expiresAt,
      receiverId: friend.id,
      roomName: createFriendCallRoomName(callId),
    },
    select: {
      id: true,
    },
  });

  await createNotification({
    actorId: user.id,
    body: `${callerName} is calling you on VAL`,
    callId: call.id,
    data: {
      callId: call.id,
      callerId: user.id,
      type: "call",
    },
    expiresAt,
    href,
    title: `Incoming call from ${callerName}`,
    type: "INCOMING_CALL",
    userId: friend.id,
    push: {
      actions: [
        {
          action: "answer",
          title: "Answer",
        },
        {
          action: "decline",
          title: "Decline",
        },
      ],
      data: {
        callerId: user.id,
        url: href,
      },
      requireInteraction: true,
      tag: `friend-call-${call.id}`,
    },
  });

  await auditSecurityEvent(
    "friend-call.start",
    {
      actorId: user.id,
      callId: call.id,
      receiverId: friend.id,
    },
    request,
  );

  if (isJsonRequest) {
    return NextResponse.json({
      callId: call.id,
      href,
    });
  }

  return NextResponse.redirect(new URL(href, request.url), { status: 303 });
}
