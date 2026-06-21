import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChannelsPage() {
  const auth = await getAuthState();

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const groups = await prisma.group.findMany({
    where: {
      isDirectMessage: false,
      members: {
        some: {
          userId,
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
              name: true,
              email: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return <DashboardShell groups={groups} activeSection="channels" />;
}
