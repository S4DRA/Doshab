import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { getDashboardGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const params = await searchParams;
  const [groups, friendships] = await Promise.all([
    getDashboardGroups(userId),
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
    }),
  ]);

  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, userId),
  );

  return (
    <DashboardShell
      groups={groups}
      homeData={{
        message: params?.message,
        friends,
      }}
    />
  );
}
