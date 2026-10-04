import type { DashboardGroup } from "@/types";

export const mobileLayoutQuery = "(max-width: 639px), (display-mode: standalone) and (pointer: coarse) and (max-width: 1024px)";

export function mobileDestination(path: string) {
  if (path.startsWith("/dashboard/profile")) return "profile";
  if (path.startsWith("/dashboard/messages") || path.startsWith("/dashboard/calls")) return "messages";
  if (path.startsWith("/dashboard/channels") || path.startsWith("/dashboard/groups") || path.startsWith("/dashboard/create")) return "groups";
  return "home";
}

export function rememberedChannelHref(group: DashboardGroup, remembered: string | null) {
  const channel = group.channels?.find((item) => item.id === remembered)
    ?? group.channels?.find((item) => item.type === "TEXT");
  return channel ? `/dashboard/groups/${group.id}/channels/${channel.id}` : `/dashboard/groups/${group.id}`;
}

export function matchesSearch(query: string, ...values: Array<string | null | undefined>) {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();
  return values.some((value) => value && normalize(value).includes(normalize(query)));
}

/** Keep the OS back edges and vertical scrolling outside the optional reply gesture. */
export function isReplySwipe(startX: number, width: number, dx: number, dy: number) {
  return startX > 24 && startX < width - 24 && dx <= -64 && Math.abs(dy) < 24;
}
