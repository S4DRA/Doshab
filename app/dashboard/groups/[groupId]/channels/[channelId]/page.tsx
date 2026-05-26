import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ChannelPageProps = {
  params: Promise<{
    groupId: string;
    channelId: string;
  }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { groupId, channelId } = await params;

  const [groups, selectedGroup, membership, selectedChannel] = await Promise.all([
    prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
    prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
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
    }),
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
      select: {
        role: true,
      },
    }),
    prisma.channel.findFirst({
      where: {
        id: channelId,
        groupId,
        group: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!selectedGroup || !membership) {
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
      groups={groups}
      selectedChannel={channelWithChronologicalMessages}
      selectedGroup={{
        ...selectedGroup,
        currentUserRole: membership.role,
      }}
      user={{ name: user.name, email: user.email }}
    />
  );
}
