import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardGroups, getDashboardSession } from "@/lib/dashboard-data";
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
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const [
    groups,
    foundUser,
    incomingRequests,
    outgoingRequests,
    friendships,
    groupInvites,
  ] = await Promise.all([
    getDashboardGroups(session.userId),
    params?.found
      ? prisma.user.findUnique({
          where: { id: params.found },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        })
      : null,
    prisma.friendRequest.findMany({
      where: {
        receiverId: session.userId,
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
            image: true,
            status: true,
          },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        senderId: session.userId,
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
            image: true,
            status: true,
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: session.userId }, { userTwoId: session.userId }],
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
            image: true,
            status: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
      },
    }),
    prisma.groupInvite.findMany({
      where: {
        receiverId: session.userId,
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
            image: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, session.userId),
  );

  return (
    <DashboardShell
      groups={groups}
      homeData={{
        addFriendMessage:
          !foundUser && params?.query ? (params.message ?? "No matching user ready to add.") : params?.message,
        addFriendQuery: params?.query,
        addFriendResult: foundUser?.id === session.userId ? null : foundUser,
        friends,
        groupInvites,
        incomingRequests,
        outgoingRequests,
      }}
    />
  );
}
