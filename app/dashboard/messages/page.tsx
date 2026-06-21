import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MessagesPageClient } from "@/components/messages/messages-page-client";
import { getAuthState } from "@/lib/auth";
import { getDashboardMessageThreads } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type MessagesPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const auth = await getAuthState();

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;
  const params = await searchParams;
  const [messageThreads, friendships] = await Promise.all([
    getDashboardMessageThreads(userId),
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
            email: true,
            id: true,
            image: true,
            name: true,
            status: true,
          },
        },
        userTwo: {
          select: {
            email: true,
            id: true,
            image: true,
            name: true,
            status: true,
          },
        },
      },
    }),
  ]);
  const friends = friendships.map((friendship) => friendFromPair(friendship, userId));

  return (
    <DashboardShell
      activeSection="messages"
      groups={[]}
      messageThreads={messageThreads}
      messagesPageContent={
        <MessagesPageClient
          error={params?.error}
          friends={friends}
          message={params?.message}
          threads={messageThreads}
        />
      }
    />
  );
}
