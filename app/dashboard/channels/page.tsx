import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardSession } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

export default async function ChannelsPage() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const groups = await prisma.group.findMany({
    where: {
      isDirectMessage: false,
      members: {
        some: {
          userId: session.userId,
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
              image: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return <DashboardShell groups={groups} activeSection="channels" />;
}
