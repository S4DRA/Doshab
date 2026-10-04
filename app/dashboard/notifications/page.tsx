import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { MobileNotifications } from "@/components/mobile/mobile-notifications";

export default async function NotificationsPage() {
  const auth = await getAuthState();
  if (auth.status !== "authenticated") redirect("/login");
  const notifications = await prisma.notification.findMany({ where: { userId: auth.user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: "desc" }, take: 60, select: dashboardNotificationSelect });
  return <MobileNotifications initial={notifications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null, expiresAt: item.expiresAt?.toISOString() ?? null }))} />;
}
