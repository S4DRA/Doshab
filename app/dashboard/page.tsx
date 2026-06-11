import { redirect } from "next/navigation";

import { FriendRequestList } from "@/components/friends/friend-request-list";
import { GroupInvitesList } from "@/components/groups/group-invites-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { getDashboardGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
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
    friendships,
    incomingRequests,
    outgoingRequests,
    groupInvites,
  ] = await Promise.all([
    getDashboardGroups(userId),

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
            image: true,
            name: true,
            email: true,
            status: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            image: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    }),

    prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            image: true,
            name: true,
            email: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            image: true,
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
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            image: true,
            name: true,
            email: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            image: true,
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
        createdAt: "desc",
      },
      include: {
        group: {
          select: {
            id: true,
            image: true,
            name: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            image: true,
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
        message: params?.message,
        friends,
        requestsPanel: (
          <section className="grid gap-4">
            <FriendRequestList
              title="Incoming friend requests"
              emptyText="No incoming friend requests."
              requests={incomingRequests}
              kind="incoming"
            />

            <FriendRequestList
              title="Outgoing friend requests"
              emptyText="No outgoing friend requests."
              requests={outgoingRequests}
              kind="outgoing"
            />

            <GroupInvitesList invites={groupInvites} />
          </section>
        ),
      }}
    />
  );
}