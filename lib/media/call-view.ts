import type { LocalMedia, MediaParticipant, RemoteMedia } from "./types";

export type CallPerson = { id: string; name: string; image?: string | null; isLocal: boolean; muted: boolean; connectionState: string };
export type CallView = { id: string; person: CallPerson; source: "camera" | "screen"; media?: LocalMedia | RemoteMedia };
export type CallLayoutMode = "auto" | "gallery" | "focus";

/** Only visible pages mount video players; audio stays with the persistent session. */
export function pageCallViews(views: CallView[], requestedPage: number, pageSize = 6) {
  const pages = Math.max(1, Math.ceil(views.length / pageSize));
  const page = Math.max(0, Math.min(requestedPage, pages - 1));
  return { page, pages, items: views.slice(page * pageSize, (page + 1) * pageSize) };
}

export function selectCallLayout(views: CallView[], mode: CallLayoutMode, pinnedId: string | null, speakingIds: string[]) {
  const pinned = views.find((view) => view.id === pinnedId);
  // A departed participant or stopped share must not leave an invisible pin behind.
  const effectiveMode = pinnedId && !pinned ? "auto" : mode;
  const screen = views.find((view) => view.source === "screen");
  const activeView = pinned ?? screen
    ?? views.find((view) => !view.person.isLocal && speakingIds.includes(view.person.id)) ?? views[0];
  const gallery = effectiveMode === "gallery" || (effectiveMode === "auto" && !screen && views.length > 1);
  const galleryViews = [...views.filter((view) => view.source === "screen"), ...views.filter((view) => view.source === "camera")];
  return { mode: effectiveMode, gallery, activeView, galleryViews };
}

export function buildCallViews(
  participant: { id: string; name: string; image?: string | null },
  local: LocalMedia[], remote: RemoteMedia[], participants: MediaParticipant[], micMuted: boolean,
) {
  const people: CallPerson[] = [{ ...participant, isLocal: true, muted: micMuted, connectionState: "connected" }];
  for (const other of participants) {
    const existing = people.find((person) => person.id === other.userId);
    if (existing) {
      if (!existing.isLocal) {
        existing.muted = existing.muted && other.muted;
        if (other.connectionState === "connected") existing.connectionState = "connected";
      }
      continue;
    }
    people.push({ id: other.userId, name: other.metadata?.name || "Participant", isLocal: false,
      image: other.metadata?.image, muted: other.muted, connectionState: other.connectionState ?? "connecting" });
  }
  const views: CallView[] = people.map((person) => ({
    id: `camera:${person.id}`, person, source: "camera",
    media: person.isLocal ? local.find((item) => item.source === "camera") : remote.find((item) => item.userId === person.id && item.source === "camera"),
  }));
  for (const item of local.filter((item) => item.source === "screen")) {
    views.push({ id: `screen:${participant.id}:${item.track.id}`, person: people[0], source: "screen", media: item });
  }
  for (const item of remote.filter((item) => item.source === "screen")) {
    const person = people.find((person) => person.id === item.userId);
    if (person) views.push({ id: `screen:${item.consumerId}`, person, source: "screen", media: item });
  }
  return { people, views };
}
