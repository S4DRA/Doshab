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
              image: true,
              status: true,
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
              image: true,
              status: true,
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
              image: true,
              status: true,
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
              image: true,
              status: true,
            },
          },
        },
      }),
    ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, user.id),
  );

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#050705] text-slate-100">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-white/20 bg-[#050505] px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
            Friends
          </p>
          <h1 className="truncate text-lg font-semibold text-white">People you know</h1>
        </div>
        <div aria-hidden="true" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-5 sm:py-8">
        {params?.message ? <Alert>{params.message}</Alert> : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Friends hub
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Stay close with your circle</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Search contacts, accept requests, and keep your community feeling calm and connected.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Incoming</p>
              <p className="mt-3 text-3xl font-bold text-white">{incomingRequests.length}</p>
            </div>
            <div className="rounded-3xl bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outgoing</p>
              <p className="mt-3 text-3xl font-bold text-white">{outgoingRequests.length}</p>
            </div>
            <div className="rounded-3xl bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Friends</p>
              <p className="mt-3 text-3xl font-bold text-white">{friends.length}</p>
            </div>
            <div className="rounded-3xl bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Invites</p>
              <p className="mt-3 text-3xl font-bold text-white">{groupInvites.length}</p>
            </div>
          </div>
        </section>

        <FriendSearchForm
          message={!foundUser && params?.query ? "No matching user ready to add." : undefined}
          query={params?.query}
          result={foundUser?.id === user.id ? null : foundUser}
        />

        <div className="grid gap-5 xl:grid-cols-2">
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
