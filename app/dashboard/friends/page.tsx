import { redirect } from "next/navigation";

import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearchForm } from "@/components/friends/friend-search-form";
import { FriendsList } from "@/components/friends/friends-list";
import { GroupInvitesList } from "@/components/groups/group-invites-list";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type FriendsPageProps = {
  searchParams?: Promise<{
    found?: string;
    message?: string;
    query?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  const [foundUser, incomingRequests, outgoingRequests, friendships, groupInvites] =
    await Promise.all([
      params?.found
        ? prisma.user.findUnique({
            where: { id: params.found },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : null,
      prisma.friendRequest.findMany({
        where: {
          receiverId: user.id,
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
            },
          },
        },
      }),
      prisma.friendRequest.findMany({
        where: {
          senderId: user.id,
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
            },
          },
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
            },
          },
          userTwo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.groupInvite.findMany({
        where: {
          receiverId: user.id,
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
            },
          },
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, user.id),
  );

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-100">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#0b1020]/95 px-5 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-300">
            Friends
          </p>
          <h1 className="text-lg font-semibold text-white">People you know</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            className="h-9 rounded-md border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/12"
            href="/dashboard"
          >
            Dashboard
          </a>
          <form action="/api/auth/logout" method="post">
            <button
              className="h-9 rounded-md border border-white/10 bg-white/7 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/12"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-5 py-6">
        {params?.message ? (
          <Alert>{params.message}</Alert>
        ) : null}

        <FriendSearchForm
          message={!foundUser && params?.query ? "No matching user ready to add." : undefined}
          query={params?.query}
          result={foundUser?.id === user.id ? null : foundUser}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <FriendRequestList
            emptyText="Incoming friend requests will appear here."
            kind="incoming"
            requests={incomingRequests}
            title="Incoming requests"
          />
          <FriendRequestList
            emptyText="Outgoing pending requests will appear here."
            kind="outgoing"
            requests={outgoingRequests}
            title="Outgoing requests"
          />
        </div>

        <GroupInvitesList invites={groupInvites} />

        <FriendsList friends={friends} />
      </div>
    </main>
  );
}
