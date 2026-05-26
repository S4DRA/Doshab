import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const groups = user
    ? await prisma.group.findMany({
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
        },
      })
    : [];

  return (
    <>
      <DashboardSidebar groups={groups} />
      <div className="pl-16">{children}</div>
    </>
  );
}
