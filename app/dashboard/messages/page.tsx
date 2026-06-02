import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";
import { getDashboardMessageThreads } from "@/lib/dashboard-data";

export default async function MessagesPage() {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const messageThreads = await getDashboardMessageThreads(auth.user.id);

  return (
    <DashboardShell
      activeSection="messages"
      groups={[]}
      messageThreads={messageThreads}
    />
  );
}
