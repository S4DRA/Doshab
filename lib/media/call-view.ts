import type { LocalMedia, MediaParticipant, RemoteMedia } from "./types";

export type CallPerson = { id: string; name: string; image?: string | null; isLocal: boolean; muted: boolean; connectionState: string };
export type CallView = { id: string; person: CallPerson; source: "camera" | "screen"; media?: LocalMedia | RemoteMedia };

export function buildCallViews(
  participant: { id: string; name: string; image?: string | null },
  local: LocalMedia[], remote: RemoteMedia[], participants: MediaParticipant[], micMuted: boolean,
) {
  const people: CallPerson[] = [{ ...participant, isLocal: true, muted: micMuted, connectionState: "connected" }];
  for (const other of participants) {
    if (people.some((person) => person.id === other.userId)) continue;
    people.push({ id: other.userId, name: other.metadata?.name || "Participant", isLocal: false,
      muted: other.muted, connectionState: other.connectionState ?? "connecting" });
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
