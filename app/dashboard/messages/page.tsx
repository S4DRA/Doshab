import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  getDashboardMessageThreads,
  getDashboardSession,
} from "@/lib/dashboard-data";

export default async function MessagesPage() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const messageThreads = await getDashboardMessageThreads(session.userId);

  return (
    <DashboardShell
      activeSection="messages"
      groups={[]}
      messageThreads={messageThreads}
    />
  );
}
