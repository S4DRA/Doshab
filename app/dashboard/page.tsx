import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardGroups, getDashboardSession } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const groups = await getDashboardGroups(session.userId);

  return (
    <DashboardShell
      groups={groups}
    />
  );
}
