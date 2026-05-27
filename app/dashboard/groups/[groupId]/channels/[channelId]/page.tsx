import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  getDashboardMessageThreads,
  getDashboardSession,
} from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

type ChannelPageProps = {
  params: Promise<{
    groupId: string;
    channelId: string;
  }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const { groupId, channelId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: session.userId,
      },
    },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          isDirectMessage: true,
          channels: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const messageThreads = await getDashboardMessageThreads(session.userId);
  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
    },
  });

  const selectedChannel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      groupId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        select: {
          id: true,
          content: true,
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
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  if (!selectedChannel) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const channelWithChronologicalMessages = {
    ...selectedChannel,
    messages: [...selectedChannel.messages].reverse(),
  };

  return (
    <DashboardShell
      currentUser={currentUser ?? undefined}
      groups={[]}
      messageThreads={messageThreads}
      selectedChannel={channelWithChronologicalMessages}
      selectedGroup={{
        ...membership.group,
        currentUserRole: membership.role,
      }}
    />
  );
}
