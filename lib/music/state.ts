import { emptySession, expectedPosition, type MusicCommand, type MusicSession, type QueueTrack } from "./types";

export class MusicError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type MusicParticipant = { id: string; name: string; joinedAt: number };

export function reconcileDJ(session: MusicSession, participants: MusicParticipant[]) {
  if (!participants.length) return { ...emptySession(session.roomId), version: session.version };
  if (!session.djUserId || participants.some((p) => p.id === session.djUserId)) return session;
  const next = [...participants].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0];
  return { ...session, djUserId: next.id, djName: next.name, notice: `Music controls transferred to ${next.name}.` };
}

export function startTrack(session: MusicSession, track: QueueTrack, now: number): MusicSession {
  return { ...session, track, state: "PLAYING", position: 0, startedAt: now, notice: null,
    recentlyPlayed: [...session.recentlyPlayed.filter((id) => id !== track.id), track.id].slice(-10) };
}

export function applyCommand(session: MusicSession, command: MusicCommand, actor: MusicParticipant, now: number, track?: QueueTrack): MusicSession {
  const isDJ = session.djUserId === actor.id;
  if (command.type !== "enqueue" && command.type !== "ended" && !isDJ &&
      !(command.type === "playNow" && !session.djUserId)) {
    throw new MusicError("Only the room DJ can control playback.", 403);
  }
  let next: MusicSession = { ...session, queue: [...session.queue], notice: null };
  switch (command.type) {
    case "enqueue": case "addNext": case "playNow": {
      if (!track) throw new MusicError("This track cannot be played here.");
      if (command.type === "playNow") {
        next = startTrack({ ...next, djUserId: next.djUserId ?? actor.id, djName: next.djName ?? actor.name }, track, now);
      } else {
        if (next.queue.length >= 30) throw new MusicError("The queue is full (30 tracks).");
        if (command.type === "addNext") next.queue.unshift(track); else next.queue.push(track);
      }
      break;
    }
    case "play":
      if (!next.track) throw new MusicError("Choose a track first.");
      if (next.state !== "PLAYING") next = { ...next, state: "PLAYING", startedAt: now,
        position: next.position >= next.track.duration ? 0 : next.position };
      break;
    case "pause": next = { ...next, position: expectedPosition(next, now), startedAt: now, state: "PAUSED" }; break;
    case "seek": next = { ...next, position: Math.min(next.track?.duration ?? 0, Math.max(0, command.position)), startedAt: now }; break;
    case "restart": next = { ...next, position: 0, startedAt: now }; break;
    case "autoplay": next.autoplay = command.enabled; break;
    case "clear": next.queue = []; break;
    case "remove": case "moveNext": case "moveBottom": {
      const index = next.queue.findIndex((item) => item.queueId === command.queueId);
      if (index < 0) throw new MusicError("That track is no longer in the queue.", 409);
      const [item] = next.queue.splice(index, 1);
      if (command.type === "moveNext") next.queue.unshift(item);
      if (command.type === "moveBottom") next.queue.push(item);
      break;
    }
    case "reorder": {
      if (command.queueIds.length !== next.queue.length || new Set(command.queueIds).size !== next.queue.length ||
          command.queueIds.some((id) => !next.queue.some((item) => item.queueId === id))) {
        throw new MusicError("The queue changed. Try reordering again.", 409);
      }
      next.queue = command.queueIds.map((id) => next.queue.find((item) => item.queueId === id)!);
      break;
    }
    // The server validates time and resolves the next playable provider track.
    case "ended":
      if (next.state !== "PLAYING" || !next.track || expectedPosition(next, now) < next.track.duration - 0.5) {
        throw new MusicError("The current track has not ended.", 409);
      }
      break;
    case "next": break;
  }
  return next;
}
