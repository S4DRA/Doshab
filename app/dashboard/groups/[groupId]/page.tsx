import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { groupId } = await params;
  const pageParams = await searchParams;

  const [groups, selectedGroup, membership, friendships] = await Promise.all([
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
    prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
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
  ]);

  if (!selectedGroup || !membership) {
    redirect("/dashboard");
  }

  const memberIds = new Set(selectedGroup.members.map((member) => member.user.id));
  const inviteCandidates = friendships
    .map((friendship) => friendFromPair(friendship, user.id))
    .filter((friend) => !memberIds.has(friend.id));

  return (
    <DashboardShell
      groups={groups}
      selectedGroup={{
        ...selectedGroup,
        currentUserRole: membership.role,
        inviteCandidates,
        notice: pageParams?.message,
      }}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        status: user.status,
      }}
    />
  );
}
