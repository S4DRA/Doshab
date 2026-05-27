import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

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
