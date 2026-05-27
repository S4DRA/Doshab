import { redirect } from "next/navigation";

import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearchForm } from "@/components/friends/friend-search-form";
import { FriendsList } from "@/components/friends/friends-list";
import { GroupInvitesList } from "@/components/groups/group-invites-list";
import { Alert } from "@/components/ui/alert";
import { getDashboardSession } from "@/lib/dashboard-data";
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
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [friendships, foundUser, incomingRequests, outgoingRequests, groupInvites] =
    await Promise.all([
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
          receiverId: session.userId,
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
          senderId: session.userId,
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
      prisma.groupInvite.findMany({
        where: {
          receiverId: session.userId,
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
              isDirectMessage: true,
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
    friendFromPair(friendship, session.userId),
  );

  return (
    <main className="app-page-scroll bg-[#050705] text-slate-100">
      <div className="app-page-container grid gap-5">
        <section className="app-page-header">
          <p className="app-section-title">Friends</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Message or call a friend
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Pick an accepted friend to open a private message, start a call, or manage pending requests.
          </p>
        </section>

        {params?.message ? <Alert>{params.message}</Alert> : null}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
          <section className="app-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="app-section-title">Contacts</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {friends.length} accepted {friends.length === 1 ? "friend" : "friends"}
                </h2>
              </div>
            </div>
            <FriendsList friends={friends} />
          </section>

          <div className="grid content-start gap-5">
            <FriendSearchForm
              message={
                !foundUser && params?.query
                  ? (params.message ?? "No matching user ready to add.")
                  : undefined
              }
              query={params?.query}
              redirectTo="/dashboard/friends"
              result={foundUser?.id === session.userId ? null : foundUser}
            />
            <FriendRequestList
              emptyText="No incoming friend requests."
              kind="incoming"
              requests={incomingRequests}
              title="Incoming requests"
            />
            <FriendRequestList
              emptyText="No outgoing friend requests."
              kind="outgoing"
              requests={outgoingRequests}
              title="Outgoing requests"
            />
            <GroupInvitesList invites={groupInvites} />
          </div>
        </div>
      </div>
    </main>
  );
}
