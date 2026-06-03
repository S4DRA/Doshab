import { redirect } from "next/navigation";
import Link from "next/link";

import { FriendSearchForm } from "@/components/friends/friend-search-form";
import { FriendsList } from "@/components/friends/friends-list";
import { Alert } from "@/components/ui/alert";
import { getAuthState } from "@/lib/auth";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type FriendsPageProps = {
  searchParams?: Promise<{
    add?: string;
    found?: string;
    message?: string;
    query?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const params = await searchParams;

  const [friendships, foundUser] =
    await Promise.all([
      prisma.friendship.findMany({
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
              name: true,
              email: true,
              status: true,
            },
          },
          userTwo: {
            select: {
              id: true,
              name: true,
              email: true,
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
              status: true,
            },
          })
        : null,
    ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, userId),
  );
  const addOpen = params?.add === "1" || Boolean(params?.found || params?.query);

  return (
    <main className="app-page-scroll bg-[#050705] text-slate-100">
      <div className="app-page-container grid gap-5">
        <section className="app-page-header">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-section-title">Friends</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Friends
              </h1>
            </div>
            <Link
              aria-label="Add friend"
              className="app-button-primary grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl font-bold transition"
              href="/dashboard/friends?add=1"
              prefetch={false}
              title="Add friend"
            >
              +
            </Link>
          </div>
        </section>

        {params?.message ? <Alert>{params.message}</Alert> : null}
        {addOpen ? (
          <div className="grid gap-5">
            <FriendSearchForm
              message={
                !foundUser && params?.query
                  ? (params.message ?? "No matching user ready to add.")
                  : undefined
              }
              query={params?.query}
              redirectTo="/dashboard/friends?add=1"
              result={foundUser?.id === userId ? null : foundUser}
            />
          </div>
        ) : null}
        <section className="app-panel p-5">
          <FriendsList friends={friends} />
        </section>
      </div>
    </main>
  );
}
