import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InviteFriendForm } from "@/components/groups/invite-friend-form";
import { getAuthState } from "@/lib/auth";
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
  const auth = await getAuthState();

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const { groupId } = await params;
  const pageParams = await searchParams;

  const [selectedGroup, currentUser] = await Promise.all([
    prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
          },
        },
      },
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
                id: true,
                image: true,
                name: true,
                email: true,
                status: true,
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
        status: true,
      },
    }),
  ]);

  const currentMember = selectedGroup?.members.find(
    (member) => member.user.id === userId,
  );

  if (!selectedGroup || !currentMember) {
    redirect("/dashboard");
  }

  const canInvite =
    !selectedGroup.isDirectMessage &&
    (currentMember.role === "OWNER" || currentMember.role === "ADMIN");
  const memberIds = selectedGroup.members.map((member) => member.user.id);

  return (
    <DashboardShell
      currentUser={currentUser ?? undefined}
      groups={[]}
      invitePanel={
        canInvite ? (
          <Suspense fallback={<InvitePanelFallback />}>
            <InviteCandidatesPanel
              groupId={selectedGroup.id}
              memberIds={memberIds}
              userId={userId}
            />
          </Suspense>
        ) : undefined
      }
      selectedGroup={{
        ...selectedGroup,
        currentUserRole: currentMember.role,
        notice: pageParams?.message,
      }}
    />
  );
}

async function InviteCandidatesPanel({
  groupId,
  memberIds,
  userId,
}: {
  groupId: string;
  memberIds: string[];
  userId: string;
}) {
  const friendships = await prisma.friendship.findMany({
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
  });

  const groupMemberIds = new Set(memberIds);
  const inviteCandidates = friendships
    .map((friendship) => friendFromPair(friendship, userId))
    .filter((friend) => !groupMemberIds.has(friend.id));

  return <InviteFriendForm friends={inviteCandidates} groupId={groupId} />;
}

function InvitePanelFallback() {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
        Invite
      </p>
      <div className="mt-4 h-11 rounded-md border border-white/10 bg-[#0b1020]" />
    </section>
  );
}
