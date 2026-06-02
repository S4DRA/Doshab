import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { getDashboardGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams?: Promise<{
    found?: string;
    message?: string;
    query?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const params = await searchParams;
  const [
    groups,
    foundUser,
    incomingRequests,
    outgoingRequests,
    friendships,
    groupInvites,
  ] = await Promise.all([
    getDashboardGroups(userId),
    params?.found
      ? prisma.user.findUnique({
          where: { id: params.found },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        })
      : null,
    prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        userOneId: true,
        userTwoId: true,
        userOne: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    }),
    prisma.groupInvite.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            isDirectMessage: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, userId),
  );

  return (
    <DashboardShell
      groups={groups}
      homeData={{
        addFriendMessage:
          !foundUser && params?.query ? (params.message ?? "No matching user ready to add.") : params?.message,
        addFriendQuery: params?.query,
        addFriendResult: foundUser?.id === userId ? null : foundUser,
        friends,
        groupInvites,
        incomingRequests,
        outgoingRequests,
      }}
    />
  );
}
