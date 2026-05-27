import { redirect } from "next/navigation";

import { FriendsList } from "@/components/friends/friends-list";
import { Alert } from "@/components/ui/alert";
import { getDashboardSession } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type FriendsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const friendships = await prisma.friendship.findMany({
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
  });

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, session.userId),
  );

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#050705] text-slate-100">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-white/20 bg-[#050505] px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
            Friends
          </p>
          <h1 className="truncate text-lg font-semibold text-white">Choose a friend</h1>
        </div>
        <div aria-hidden="true" />
      </header>

      <div className="mx-auto grid w-full max-w-3xl gap-3 px-3 py-4 sm:px-5 sm:py-6">
        {params?.message ? <Alert>{params.message}</Alert> : null}
        <FriendsList friends={friends} />
      </div>
    </main>
  );
}
