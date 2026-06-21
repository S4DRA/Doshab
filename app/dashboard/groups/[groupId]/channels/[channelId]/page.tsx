import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { chatMessageBaseSelect, formatChatMessages } from "@/lib/chat-messages";
import {
  getDashboardMessageThreads,
} from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

type ChannelPageProps = {
  params: Promise<{
    groupId: string;
    channelId: string;
  }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const auth = await getAuthState();

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const { groupId, channelId } = await params;

  const [membership, currentUser, selectedChannel] = await Promise.all([
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      select: {
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
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
            members: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                role: true,
                createdAt: true,
                user: {
                  select: {
                    email: true,
                    id: true,
                    image: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
      },
    }),
    prisma.channel.findFirst({
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
          select: chatMessageBaseSelect,
        },
      },
    }),
  ]);

  if (!membership) {
    redirect("/dashboard");
  }

  if (!selectedChannel) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const channelWithChronologicalMessages = {
    ...selectedChannel,
    messages: await formatChatMessages([...selectedChannel.messages].reverse(), userId),
  };
  const messageThreads = membership.group.isDirectMessage
    ? await getDashboardMessageThreads(userId)
    : [];

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
