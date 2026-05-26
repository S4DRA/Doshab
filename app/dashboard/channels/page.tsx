import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChannelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
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

  return (
    <DashboardShell
      groups={groups}
      activeSection="channels"
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        status: user.status,
      }}
    />
  );
}
