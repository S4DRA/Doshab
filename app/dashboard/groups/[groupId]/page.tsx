import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardSession } from "@/lib/dashboard-data";
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
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const { groupId } = await params;
  const pageParams = await searchParams;

  const [selectedGroup, friendships] = await Promise.all([
    prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId: session.userId,
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
  ]);

  const currentMember = selectedGroup?.members.find(
    (member) => member.user.id === session.userId,
  );

  if (!selectedGroup || !currentMember) {
    redirect("/dashboard");
  }

  const memberIds = new Set(selectedGroup.members.map((member) => member.user.id));
  const inviteCandidates = friendships
    .map((friendship) => friendFromPair(friendship, session.userId))
    .filter((friend) => !memberIds.has(friend.id));

  return (
    <DashboardShell
      groups={[]}
      selectedGroup={{
        ...selectedGroup,
        currentUserRole: currentMember.role,
        inviteCandidates,
        notice: pageParams?.message,
      }}
    />
  );
}
