import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getDashboardGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import { MobileSearch } from "@/components/mobile/mobile-search";

export default async function SearchPage() {
  const auth = await getAuthState();
  if (auth.status !== "authenticated") redirect("/login");
  const userId = auth.user.id;
  const [groups, friendships, messages] = await Promise.all([
    getDashboardGroups(userId),
    prisma.friendship.findMany({ where: { OR: [{ userOneId: userId }, { userTwoId: userId }] }, select: { userOneId: true, userTwoId: true, userOne: { select: { id: true, name: true, email: true, image: true, status: true } }, userTwo: { select: { id: true, name: true, email: true, image: true, status: true } } } }),
    prisma.message.findMany({ where: { channel: { group: { members: { some: { userId } } } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, content: true, createdAt: true, sender: { select: { name: true } }, channel: { select: { id: true, name: true, group: { select: { id: true, name: true } } } } } }),
  ]);
  // Only friends and members of joined spaces are searchable. Actions reuse existing friendship gates.
  return <MobileSearch userId={userId} groups={groups} people={friendships.map((pair) => friendFromPair(pair, userId))} messages={messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))} />;
}
