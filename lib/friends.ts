import type { FriendPerson } from "@/types";

export function orderedFriendshipPair(userId: string, otherUserId: string) {
  return [userId, otherUserId].sort() as [string, string];
}

export function areAlreadyFriends(
  friendships: Array<{
    userOneId: string;
    userTwoId: string;
  }>,
  userId: string,
  otherUserId: string,
) {
  const [userOneId, userTwoId] = orderedFriendshipPair(userId, otherUserId);

  return friendships.some(
    (friendship) =>
      friendship.userOneId === userOneId && friendship.userTwoId === userTwoId,
  );
}

export function friendFromPair(
  friendship: {
    userOneId: string;
    userTwoId: string;
    userOne: FriendPerson;
    userTwo: FriendPerson;
  },
  currentUserId: string,
) {
  return friendship.userOneId === currentUserId
    ? friendship.userTwo
    : friendship.userOne;
}
