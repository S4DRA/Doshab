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
    },
  });

  return <DashboardShell groups={groups} activeSection="channels" />;
}
