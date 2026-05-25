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

  const [groups, selectedGroup, membership] = await Promise.all([
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
            messages: {
              orderBy: {
                createdAt: "asc",
              },
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
  ]);

  if (!selectedGroup || !membership) {
    redirect("/dashboard");
  }

  const selectedChannel = selectedGroup.channels.find(
    (channel) => channel.id === channelId,
  );

  if (!selectedChannel) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  return (
    <DashboardShell
      groups={groups}
      selectedChannel={selectedChannel}
      selectedGroup={{
        ...selectedGroup,
        currentUserRole: membership.role,
      }}
      user={{ name: user.name, email: user.email }}
    />
  );
}
