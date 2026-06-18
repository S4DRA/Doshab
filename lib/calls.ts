import { orderedFriendshipPair } from "@/lib/friends";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { auditSecurityEvent } from "@/lib/security/permissions";

export const friendCallDurationMs = 60_000;

export function createFriendCallRoomName(callId: string) {
  return `doshab-friend-call-${callId}`;
}

export function getFriendCallHref(callId: string) {
  return `/dashboard/calls/${callId}`;
}

export async function findFriendship(userId: string, friendId: string) {
  const [userOneId, userTwoId] = orderedFriendshipPair(userId, friendId);

  return prisma.friendship.findUnique({
    where: {
      userOneId_userTwoId: {
        userOneId,
        userTwoId,
      },
    },
  });
}

export function isCallExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

export async function markFriendCallMissed({
  callId,
  caller,
  receiverId,
}: {
  callId: string;
  caller: {
    email: string;
    id: string;
    name: string;
  };
  receiverId: string;
}) {
  const existingNotification = await prisma.notification.findFirst({
    where: {
      callId,
      type: "MISSED_CALL",
      userId: receiverId,
    },
    select: {
      id: true,
    },
  });

  if (existingNotification) {
    return;
  }

  await createNotification({
    actorId: caller.id,
    body: `You missed a call from ${caller.name || caller.email}.`,
    callId,
    data: {
      callId,
    },
    href: getFriendCallHref(callId),
    title: "Missed call",
    type: "MISSED_CALL",
    userId: receiverId,
  });

  await auditSecurityEvent("friend-call.missed", {
    actorId: caller.id,
    callId,
    receiverId,
  });
}
