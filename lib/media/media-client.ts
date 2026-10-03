"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClientFromRuntimeConfig } from "@/lib/supabase/client";
import type { LocalMedia, MediaConnectionState, MediaParticipant, MediaSource, RemoteMedia } from "./types";

type Identity = { email: string; id: string; name: string };
type Credential = { participant: Identity; signalingRoomId: string; iceServers?: RTCIceServer[] };
type MediaState = { micMuted: boolean; sources: Record<string, MediaSource>; mids?: Record<string, MediaSource> };
type Signal = MediaState & {
  candidate?: RTCIceCandidateInit; description?: RTCSessionDescriptionInit;
  from: string; participant: Identity; to?: string;
  type: "answer" | "candidate" | "hello" | "welcome" | "leave" | "media" | "offer";
};
type Presence = { instanceId: string; participant: Identity };
type Peer = {
  connection: RTCPeerConnection; participant: Identity; candidates: RTCIceCandidateInit[];
  ignoreOffer: boolean; makingOffer: boolean; settingAnswer: boolean; polite: boolean;
  media: MediaState; senders: Map<MediaSource, RTCRtpSender>;
  received: Map<string, { track: MediaStreamTrack; transceiver: RTCRtpTransceiver }>;
  disconnectTimer?: ReturnType<typeof setTimeout>; restartAttempted: boolean;
};
const defaultIceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
const isSource = (value: unknown): value is MediaSource => ["mic", "camera", "screen", "screen-audio"].includes(value as string);

export class MediaClient {
  private channel: RealtimeChannel | null = null;
  private credential: Credential | null = null;
  private instanceId = crypto.randomUUID();
  private listeners = new Set<() => void>();
  private localTracks = new Map<MediaSource, MediaStreamTrack>();
  private microphoneMuted = false;
  private captureRequests = new Map<MediaSource, number>();
  private peers = new Map<string, Peer>();
  private present = new Set<string>();
  private remote = new Map<string, RemoteMedia>();
  private state: MediaConnectionState = "disconnected";
  private error: string | null = null;
  private generation = 0;
  private cancelConnect: (() => void) | null = null;

  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  snapshot() {
    const local: LocalMedia[] = [...this.localTracks].map(([source, track]) => ({ kind: track.kind as "audio" | "video", source, track }));
    const participants: MediaParticipant[] = [...this.peers].map(([instanceId, peer]) => ({
      instanceId, userId: peer.participant.id, metadata: peer.participant, muted: peer.media.micMuted,
      speaking: false, connectionState: peer.connection.connectionState,
    }));
    return { state: this.state, error: this.error, participants, local, remote: [...this.remote.values()],
      micMuted: !this.localTracks.get("mic")?.enabled, cameraOn: this.localTracks.has("camera"), screenOn: this.localTracks.has("screen") };
  }
  private changed() { this.listeners.forEach((listener) => listener()); }
  private report(cause: unknown) {
    console.warn("Voice connection error", cause);
    this.error = "A call connection was interrupted. Reconnect if you cannot hear or see someone.";
    this.changed();
  }

  async connect(credential: Credential) {
    await this.leave();
    this.state = "connecting"; this.credential = credential; this.error = null; this.changed();
    const generation = this.generation;
    const supabase = await createSupabaseBrowserClientFromRuntimeConfig();
    if (generation !== this.generation) throw new Error("Voice connection was cancelled.");
    if (!supabase) throw new Error("Supabase Realtime is not configured.");
    const current = () => generation === this.generation && this.channel === channel;
    const channel = supabase.channel(`val-media:${credential.signalingRoomId}`, {
      config: { broadcast: { ack: true, self: false }, presence: { key: this.instanceId } },
    }).on("broadcast", { event: "signal" }, ({ payload }) => {
      if (current()) void this.handleSignal(payload as Signal).catch((cause) => { if (current()) this.report(cause); });
    }).on("presence", { event: "sync" }, () => { if (current()) this.syncPresence(); });
    this.channel = channel;
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (current()) { this.state = "failed"; this.changed(); }
        reject(new Error("Timed out connecting to voice signaling."));
      }, 10_000);
      this.cancelConnect = () => { window.clearTimeout(timeout); reject(new Error("Voice connection was cancelled.")); };
      channel.subscribe((status) => {
        if (!current()) return;
        if (status === "SUBSCRIBED") {
          void (async () => {
            const result = await channel.track({ instanceId: this.instanceId, participant: credential.participant });
            if (!current()) return;
            if (result !== "ok") throw new Error("Could not announce your presence in the room.");
            this.state = "connected"; this.error = null; this.changed();
            await this.send({ type: "hello" });
            window.clearTimeout(timeout); this.cancelConnect = null; resolve();
          })().catch((cause) => {
            if (current()) { this.state = "failed"; this.report(cause); }
            window.clearTimeout(timeout); reject(cause);
          });
        } else if (["CHANNEL_ERROR", "CLOSED", "TIMED_OUT"].includes(status)) {
          window.clearTimeout(timeout); this.state = "failed"; this.changed();
          reject(new Error("Could not connect to voice signaling."));
        }
      });
    });
  }

  private syncPresence() {
    const state = this.channel?.presenceState<Presence>() ?? {};
    const next = new Set<string>();
    for (const entries of Object.values(state)) for (const entry of entries) {
      if (!entry.instanceId || entry.instanceId === this.instanceId || !entry.participant?.id) continue;
      next.add(entry.instanceId);
      if (!this.peers.has(entry.instanceId)) {
        this.createPeer(entry.instanceId, entry.participant);
        void this.send({ type: "hello", to: entry.instanceId }).catch((cause) => this.report(cause));
      }
    }
    // Broadcasts can arrive before the initial presence sync.
    for (const id of this.present) if (!next.has(id)) this.closePeer(id);
    this.present = next;
  }

  async start(source: MediaSource, constraints: MediaTrackConstraints | boolean) {
    if (!this.channel || !this.credential) throw new Error("Join a media room first.");
    if (source === "screen-audio") throw new Error("Share your screen and enable audio in the sharing dialog.");
    const generation = this.generation;
    const request = (this.captureRequests.get(source) ?? 0) + 1;
    this.captureRequests.set(source, request);
    // Cancelling a permission dialog must preserve any existing capture.
    const stream = source === "screen"
      ? await navigator.mediaDevices.getDisplayMedia({ audio: true, video: constraints })
      : await navigator.mediaDevices.getUserMedia({ [source === "mic" ? "audio" : "video"]: constraints });
    const track = source === "mic" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
    if (generation !== this.generation || request !== this.captureRequests.get(source) || !track) {
      stream.getTracks().forEach((item) => item.stop());
      throw new Error(track ? "Media request was cancelled because the call ended or changed." : "No requested media track is available.");
    }
    const tracks: [MediaSource, MediaStreamTrack][] = [[source, track]];
    if (source === "mic") track.enabled = !this.microphoneMuted;
    if (source === "screen" && stream.getAudioTracks()[0]) tracks.push(["screen-audio", stream.getAudioTracks()[0]]);
    stream.getTracks().filter((item) => !tracks.some(([, kept]) => kept === item)).forEach((item) => item.stop());
    const updates: Promise<void>[] = [];
    if (source === "screen" && !stream.getAudioTracks().length) updates.push(this.removeTrack("screen-audio"));
    // Register every captured track before yielding, so leave() can release all hardware.
    for (const [kind, next] of tracks) {
      const previous = this.localTracks.get(kind);
      this.localTracks.set(kind, next);
      next.onended = () => { if (this.localTracks.get(kind) === next) void this.stop(kind).catch((cause) => this.report(cause)); };
      if (previous) { previous.onended = null; previous.stop(); }
      for (const peer of this.peers.values()) updates.push(this.attachTrack(peer, kind, next));
    }
    this.changed(); await Promise.all(updates);
    if (generation !== this.generation) throw new Error("Media request was cancelled because the call ended.");
    await this.announceMedia(); return track;
  }

  private async attachTrack(peer: Peer, source: MediaSource, track: MediaStreamTrack) {
    const sender = peer.senders.get(source);
    if (sender) await sender.replaceTrack(track);
    else peer.senders.set(source, peer.connection.addTrack(track, new MediaStream([track])));
  }
  private async removeTrack(source: MediaSource) {
    const track = this.localTracks.get(source); if (!track) return;
    this.localTracks.delete(source); track.onended = null; track.stop();
    await Promise.all([...this.peers.values()].map(async (peer) => {
      const sender = peer.senders.get(source);
      if (sender) await sender.replaceTrack(null);
    }));
  }
  async stop(source: MediaSource) {
    this.captureRequests.set(source, (this.captureRequests.get(source) ?? 0) + 1);
    const updates = [this.removeTrack(source)];
    if (source === "screen") updates.push(this.removeTrack("screen-audio"));
    this.changed(); await Promise.all(updates); await this.announceMedia();
  }
  async setMicMuted(muted: boolean) {
    this.microphoneMuted = muted;
    const track = this.localTracks.get("mic"); if (!track) return;
    track.enabled = !muted; this.changed(); await this.announceMedia();
  }
  private async announceMedia() {
    await Promise.all([...this.peers.keys()].map((to) => this.send({ type: "media", to })));
  }
  private async send(signal: Pick<Signal, "type" | "to" | "candidate" | "description">) {
    if (!this.channel || !this.credential) return;
    const sources = Object.fromEntries([...this.localTracks].map(([source, track]) => [track.id, source]));
    const peer = signal.to ? this.peers.get(signal.to) : undefined;
    const mids: Record<string, MediaSource> = {};
    if (peer) for (const transceiver of peer.connection.getTransceivers()) {
      for (const [source, sender] of peer.senders) {
        if (transceiver.mid !== null && transceiver.sender === sender && this.localTracks.has(source)) mids[transceiver.mid] = source;
      }
    }
    const result = await this.channel.send({ type: "broadcast", event: "signal", payload: {
      ...signal, sources, mids: peer ? mids : undefined, micMuted: !this.localTracks.get("mic")?.enabled,
      from: this.instanceId, participant: this.credential.participant,
    } });
    if (result !== "ok") throw new Error("Voice signaling message was not delivered.");
  }

  private createPeer(remoteId: string, participant: Identity) {
    const connection = new RTCPeerConnection({ iceServers: this.credential?.iceServers ?? defaultIceServers });
    const peer: Peer = {
      candidates: [], connection, ignoreOffer: false, makingOffer: false, settingAnswer: false,
      participant, polite: this.instanceId.localeCompare(remoteId) > 0,
      media: { sources: {}, micMuted: true }, senders: new Map(), received: new Map(), restartAttempted: false,
    };
    this.peers.set(remoteId, peer);
    const current = () => this.peers.get(remoteId) === peer;
    connection.onicecandidate = ({ candidate }) => {
      if (candidate && current()) void this.send({ type: "candidate", to: remoteId, candidate: candidate.toJSON() }).catch((cause) => this.report(cause));
    };
    connection.onnegotiationneeded = () => {
      if (current()) void this.negotiate(remoteId, peer).catch((cause) => { if (current()) this.report(cause); });
    };
    connection.ontrack = ({ track, transceiver }) => {
      if (!current()) return;
      peer.received.set(track.id, { track, transceiver });
      track.onended = () => { peer.received.delete(track.id); this.refreshRemote(remoteId, peer); };
      track.onunmute = () => this.refreshRemote(remoteId, peer);
      this.refreshRemote(remoteId, peer);
    };
    connection.onconnectionstatechange = () => {
      if (!current()) return;
      if (peer.disconnectTimer) { clearTimeout(peer.disconnectTimer); peer.disconnectTimer = undefined; }
      if (connection.connectionState === "connected") { peer.restartAttempted = false; this.error = null; }
      if (connection.connectionState === "failed" && !peer.restartAttempted) {
        peer.restartAttempted = true; connection.restartIce();
      }
      if (connection.connectionState === "disconnected") peer.disconnectTimer = setTimeout(() => {
        if (current() && connection.connectionState === "disconnected") connection.restartIce();
      }, 5000);
      this.changed();
    };
    // Stable media sections allow muted joins and independent camera/screen toggles.
    for (const source of ["mic", "camera", "screen", "screen-audio"] as const) {
      const transceiver = connection.addTransceiver(source === "mic" || source === "screen-audio" ? "audio" : "video", { direction: "sendrecv" });
      peer.senders.set(source, transceiver.sender);
      const track = this.localTracks.get(source);
      if (track) void transceiver.sender.replaceTrack(track).catch((cause) => this.report(cause));
    }
    this.changed(); return peer;
  }

  private refreshRemote(remoteId: string, peer: Peer) {
    if (this.peers.get(remoteId) !== peer) return;
    for (const [id] of this.remote) if (id.startsWith(`${remoteId}:`)) this.remote.delete(id);
    for (const { track, transceiver } of peer.received.values()) {
      const source = (transceiver.mid !== null ? peer.media.mids?.[transceiver.mid] : undefined) ?? peer.media.sources[track.id];
      if (!isSource(source) || track.readyState === "ended" || !Object.values(peer.media.sources).includes(source)) continue;
      const id = `${remoteId}:${track.id}`;
      this.remote.set(id, { consumerId: id, producerId: id, userId: peer.participant.id, source, kind: track.kind as "audio" | "video", track });
    }
    this.changed();
  }

  private async handleSignal(signal: Signal) {
    if (!signal?.from || !signal.participant?.id || signal.from === this.instanceId || (signal.to && signal.to !== this.instanceId)) return;
    if (signal.type === "leave") { this.present.delete(signal.from); this.closePeer(signal.from); return; }
    let peer = this.peers.get(signal.from);
    if (!peer) peer = this.createPeer(signal.from, signal.participant);
    peer.media = { sources: signal.sources ?? {}, mids: signal.mids ?? peer.media.mids, micMuted: signal.micMuted ?? false };
    this.refreshRemote(signal.from, peer);
    if (signal.type === "hello") { await this.send({ type: "welcome", to: signal.from }); return; }
    if (signal.type === "welcome" || signal.type === "media") return;
    if (signal.type === "candidate" && signal.candidate) {
      if (peer.ignoreOffer) return;
      if (peer.connection.remoteDescription) await peer.connection.addIceCandidate(signal.candidate);
      else peer.candidates.push(signal.candidate);
      return;
    }
    if (!signal.description) return;
    const connection = peer.connection;
    const ready = !peer.makingOffer && (connection.signalingState === "stable" || peer.settingAnswer);
    const collision = signal.description.type === "offer" && !ready;
    peer.ignoreOffer = !peer.polite && collision;
    if (peer.ignoreOffer) { peer.candidates = []; return; }
    peer.settingAnswer = signal.description.type === "answer";
    try { await connection.setRemoteDescription(signal.description); }
    finally { peer.settingAnswer = false; }
    if (this.peers.get(signal.from) !== peer) return;
    for (const candidate of peer.candidates.splice(0)) await connection.addIceCandidate(candidate);
    this.refreshRemote(signal.from, peer);
    if (signal.description.type === "offer") {
      await connection.setLocalDescription();
      await this.send({ type: "answer", to: signal.from, description: connection.localDescription ?? undefined });
    }
    // Never create another offer merely because an answer arrived.
  }
  private async negotiate(remoteId: string, peer: Peer) {
    if (peer.makingOffer || peer.connection.signalingState !== "stable") return;
    // One initial offerer prevents simultaneous joins from creating competing media sections.
    // After setup, either peer can negotiate an ICE restart using perfect negotiation.
    if (peer.polite && !peer.connection.remoteDescription) return;
    try {
      peer.makingOffer = true;
      await peer.connection.setLocalDescription();
      if (this.peers.get(remoteId) !== peer) return;
      await this.send({ type: "offer", to: remoteId, description: peer.connection.localDescription ?? undefined });
    } finally { peer.makingOffer = false; }
  }
  private closePeer(remoteId: string) {
    const peer = this.peers.get(remoteId); if (!peer) return;
    this.peers.delete(remoteId);
    if (peer.disconnectTimer) clearTimeout(peer.disconnectTimer);
    peer.connection.onconnectionstatechange = null; peer.connection.ontrack = null;
    peer.connection.onicecandidate = null; peer.connection.onnegotiationneeded = null;
    for (const { track } of peer.received.values()) { track.onended = null; track.onunmute = null; }
    peer.connection.close();
    for (const [id] of this.remote) if (id.startsWith(`${remoteId}:`)) this.remote.delete(id);
    this.changed();
  }
  async leave() {
    this.generation += 1; this.cancelConnect?.(); this.cancelConnect = null;
    // Release hardware before any network operation can time out.
    for (const track of this.localTracks.values()) { track.onended = null; track.stop(); }
    this.localTracks.clear(); this.captureRequests.clear();
    this.microphoneMuted = false;
    for (const remoteId of [...this.peers.keys()]) this.closePeer(remoteId);
    const channel = this.channel;
    const leave = this.send({ type: "leave" }).catch((cause) => console.warn("Voice leave announcement failed", cause));
    this.channel = null; this.credential = null; this.present.clear(); this.remote.clear();
    this.state = "disconnected"; this.error = null; this.changed();
    await leave;
    if (channel) await channel.unsubscribe();
  }
}
