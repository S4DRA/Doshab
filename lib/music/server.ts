import "server-only";
import { RoomServiceClient } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { createLiveKitRoomName, getLiveKitConfig } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { getMusicProvider } from "./providers";
import { applyCommand, MusicError, reconcileDJ, startTrack, type MusicParticipant } from "./state";
import { emptySession, expectedPosition, type MusicCommand, type MusicSession, type QueueTrack } from "./types";

const metadataKey = "valMusicV1";

export function musicRoomService() {
  const config = getLiveKitConfig();
  if (!config) throw new MusicError("Room music is not configured.", 503);
  return new RoomServiceClient(config.livekitUrl.replace(/^ws/, "http"), config.apiKey, config.apiSecret, { requestTimeout: 3 });
}

export async function authorizeMusic(channelId: string) {
  const user = await getCurrentUser();
  if (!user) throw new MusicError("Authentication required.", 401);
  const channel = await prisma.channel.findFirst({ where: { id: channelId, type: "VOICE", group: { members: { some: { userId: user.id } } } },
    select: { id: true, groupId: true } });
  if (!channel) throw new MusicError("You do not have access to this voice room.", 403);
  return { user, groupId: channel.groupId, roomName: createLiveKitRoomName(channel.groupId, channel.id) };
}

function readMetadata(raw: string) {
  if (!raw) return {} as Record<string, unknown>;
  try { const data: unknown = JSON.parse(raw); if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>; } catch { /* Preserve unknown metadata rather than overwriting it. */ }
  throw new MusicError("Room music cannot read this room's metadata.", 503);
}

function readSession(metadata: Record<string, unknown>, sid: string): MusicSession {
  const session = metadata[metadataKey] as MusicSession | undefined;
  if (!session || session.roomId !== sid) return emptySession(sid);
  if (!Number.isSafeInteger(session.version) || !Array.isArray(session.queue) || !Array.isArray(session.commandIds)) {
    throw new MusicError("Room music state is unavailable.", 503);
  }
  // Old ephemeral sessions may still contain the previous provider during a hot deployment.
  if ((session.track && session.track.provider !== "youtube") || session.queue.some((track) => track.provider !== "youtube")) {
    return { ...emptySession(sid), version: session.version };
  }
  return session;
}

async function snapshot(service: RoomServiceClient, roomName: string, groupId?: string) {
  const [rooms, liveParticipants] = await Promise.all([service.listRooms([roomName]), service.listParticipants(roomName)]);
  const room = rooms[0];
  if (!room) throw new MusicError("Join the voice room to listen together.", 409);
  const members = groupId ? await prisma.groupMember.findMany({ where: { groupId, userId: { in: liveParticipants.map((p) => p.identity) } },
    select: { userId: true, user: { select: { name: true } } } }) : [];
  const participants: MusicParticipant[] = liveParticipants
    .filter((p) => !groupId || members.some((m) => m.userId === p.identity))
    .map((p) => ({ id: p.identity, name: members.find((m) => m.userId === p.identity)?.user.name ?? p.name ?? p.identity,
      joinedAt: Number(p.joinedAt) * 1000 }));
  const metadata = readMetadata(room.metadata);
  return { room, metadata, session: readSession(metadata, room.sid), participants };
}

async function advance(session: MusicSession, now: number) {
  const next = { ...session, queue: [...session.queue] };
  // Bound provider fan-out; a long unavailable queue must not hold a request open.
  const candidates = next.queue.slice(0, 5);
  const tracks = candidates.length ? await getMusicProvider("youtube").getTracks(candidates.map((queued) => queued.id)) : [];
  const resolved = candidates.map((queued) => ({ queued, track: tracks.find((track) => track.id === queued.id) }));
  while (next.queue.length) {
    const queued = next.queue.shift()!;
    const candidate = resolved.find((item) => item.queued.queueId === queued.queueId);
    if (!candidate) return { ...next, queue: [queued, ...next.queue], state: "PAUSED" as const,
      position: expectedPosition(session, Date.now()), notice: "Several queued tracks were unavailable. Try Next to continue." };
    const { track } = candidate;
    if (track) return startTrack(next, { ...queued, ...track }, Date.now());
  }
  if (next.autoplay && next.track) {
    const related = await getMusicProvider(next.track.provider).getRelatedTracks(next.track);
    const track = related.find((t) => t.id !== next.track?.id && !next.recentlyPlayed.includes(t.id));
    if (track) return startTrack(next, { ...track, queueId: crypto.randomUUID(), addedBy: { id: "", name: "Autoplay" } }, Date.now());
  }
  return { ...next, state: "STOPPED" as const, position: 0, track: null, startedAt: now,
    notice: next.autoplay ? "No related track was available." : null };
}

type CommandRequest = { command: MusicCommand; commandId: string; version: number; roomId: string };

export async function roomMusic(context: Awaited<ReturnType<typeof authorizeMusic>>, input?: CommandRequest) {
  const service = musicRoomService();
  const initial = await snapshot(service, context.roomName, context.groupId);
  if (!initial.participants.some((participant) => participant.id === context.user.id)) {
    throw new MusicError("Join the voice room to listen together.", 403);
  }
  // Provider work happens before taking the cross-instance room lock.
  let addedTrack: QueueTrack | undefined;
  if (input && "trackId" in input.command) {
    const track = await getMusicProvider(input.command.provider).getTrack(input.command.trackId);
    if (!track) throw new MusicError("This track cannot be played here.");
    addedTrack = { ...track, queueId: input.commandId, addedBy: { id: context.user.id, name: context.user.name } };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = attempt === 0 ? initial : await snapshot(service, context.roomName, context.groupId);
    const actor = current.participants.find((p) => p.id === context.user.id);
    if (!actor) throw new MusicError("Join the voice room to listen together.", 403);
    const { session } = current;
    if (input && session.commandIds.includes(input.commandId)) return responseFor(session);
    if (input && (input.roomId !== session.roomId || (input.command.type !== "enqueue" && input.version !== session.version))) {
      throw new MusicError("Room music changed. Your player is resynchronizing; try again.", 409);
    }
    let next = reconcileDJ(session, current.participants);
    if (input) next = applyCommand(next, input.command, actor, Date.now(), addedTrack);
    const ended = next.state === "PLAYING" && next.track && expectedPosition(next, Date.now()) >= next.track.duration;
    if (input?.command.type === "next" || input?.command.type === "ended" || ended) {
      try { next = await advance(next, Date.now()); }
      catch { next = { ...next, state: "PAUSED", position: expectedPosition(next, Date.now()), notice: "Music provider is temporarily unavailable. Try Next again." }; }
    }
    if (input) next.commandIds = [...next.commandIds, input.commandId].slice(-40);
    if (JSON.stringify(next) === JSON.stringify(session)) return responseFor(session);
    const planned = next;
    const committed = await prisma.$transaction(async (tx) => {
      // Transaction-scoped advisory locks also work with transaction poolers. No rows or playback positions are written.
      const [lock] = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext(${`val-music:${context.roomName}`})) AS acquired`;
      if (!lock.acquired) return null;
      const latest = await snapshot(service, context.roomName);
      if (latest.room.sid !== session.roomId || latest.session.version !== session.version) return null;
      if (!latest.participants.some((p) => p.id === actor.id)) throw new MusicError("You left the voice room.", 403);
      const membership = await tx.groupMember.findFirst({ where: { groupId: context.groupId, userId: actor.id }, select: { id: true } });
      if (!membership) throw new MusicError("You are no longer a member of this space.", 403);
      if (planned.djUserId && !latest.participants.some((p) => p.id === planned.djUserId)) return null;
      const committedSession = { ...planned, version: session.version + 1 };
      const metadata = JSON.stringify({ ...latest.metadata, [metadataKey]: committedSession });
      if (Buffer.byteLength(metadata) > 60000) throw new MusicError("Room music queue is full.");
      await service.updateRoomMetadata(context.roomName, metadata);
      return committedSession;
    }, { timeout: 10000, maxWait: 3000 });
    if (committed) return responseFor(committed);
  }
  throw new MusicError("Room music is busy. Try again.", 409);
}

function responseFor(session: MusicSession) {
  return { session, serverTime: Date.now(), source: session.track ? getMusicProvider(session.track.provider).createPlaybackSource(session.track.id) : null };
}

export async function requireActiveMusicParticipant(context: Awaited<ReturnType<typeof authorizeMusic>>) {
  const participants = await musicRoomService().listParticipants(context.roomName);
  if (!participants.some((p) => p.identity === context.user.id)) throw new MusicError("Join the voice room to search music.", 403);
}

// Signed LiveKit webhooks cover the last participant leaving, when no client remains to reconcile.
export async function reconcileMusicMembership(roomName: string) {
  const channelId = roomName.split("-channel-").at(-1);
  if (!channelId) return;
  const channel = await prisma.channel.findFirst({ where: { id: channelId, type: "VOICE" }, select: { id: true, groupId: true } });
  if (!channel || createLiveKitRoomName(channel.groupId, channel.id) !== roomName) return;
  const service = musicRoomService();
  if (!(await service.listRooms([roomName])).length) return;
  await prisma.$transaction(async (tx) => {
    // Webhook deliveries may race client requests. Waiting here allows the webhook sender to retry a failure.
    const [lock] = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext(${`val-music:${roomName}`})) AS acquired`;
    if (!lock.acquired) throw new MusicError("Music membership reconciliation is busy.", 503);
    const current = await snapshot(service, roomName, channel.groupId);
    const next = reconcileDJ(current.session, current.participants);
    if (JSON.stringify(next) === JSON.stringify(current.session)) return;
    await service.updateRoomMetadata(roomName, JSON.stringify({ ...current.metadata,
      [metadataKey]: { ...next, version: current.session.version + 1 } }));
  }, { timeout: 10000, maxWait: 3000 });
}
