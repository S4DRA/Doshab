"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { createSupabaseBrowserClientFromRuntimeConfig } from "@/lib/supabase/client";
import type { LocalMedia, MediaConnectionState, MediaParticipant, MediaSource, RemoteMedia } from "./types";

type Credential = { participant: { email: string; id: string; name: string }; signalingRoomId: string };
type Listener = () => void;
type Signal = { candidate?: RTCIceCandidateInit; description?: RTCSessionDescriptionInit; from: string; participant: Credential["participant"]; to?: string; type: "answer" | "candidate" | "hello" | "leave" | "offer" };
type Peer = { candidates: RTCIceCandidateInit[]; connection: RTCPeerConnection; ignoreOffer: boolean; makingOffer: boolean; participant: Credential["participant"]; polite: boolean };

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export class MediaClient {
  private channel: RealtimeChannel | null = null;
  private credential: Credential | null = null;
  private instanceId = crypto.randomUUID();
  private listeners = new Set<Listener>();
  private localTracks = new Map<MediaSource, MediaStreamTrack>();
  private participants = new Map<string, MediaParticipant>();
  private peers = new Map<string, Peer>();
  private remote = new Map<string, RemoteMedia>();
  private state: MediaConnectionState = "disconnected";

  subscribe(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  snapshot() { const local: LocalMedia[] = [...this.localTracks.entries()].map(([source, track]) => ({ kind: track.kind as "audio" | "video", source, track })); return { state: this.state, participants: [...this.participants.values()], local, remote: [...this.remote.values()], micMuted: !this.localTracks.get("mic")?.enabled, cameraOn: this.localTracks.has("camera"), screenOn: this.localTracks.has("screen") }; }
  private changed() { this.listeners.forEach((listener) => listener()); }

  async connect(credential: Credential) {
    await this.leave(); this.state = "connecting"; this.credential = credential; this.changed();
    const supabase = await createSupabaseBrowserClientFromRuntimeConfig();
    if (!supabase) throw new Error("Supabase Realtime is not configured.");
    const channel = supabase.channel(`val-media:${credential.signalingRoomId}`, { config: { broadcast: { ack: true, self: false } } }).on("broadcast", { event: "signal" }, ({ payload }) => { void this.handleSignal(payload as Signal); });
    this.channel = channel;
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Timed out connecting to voice signaling.")), 10_000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") { window.clearTimeout(timeout); this.state = "connected"; this.changed(); void this.send({ type: "hello" }); resolve(); }
        if (["CHANNEL_ERROR", "CLOSED", "TIMED_OUT"].includes(status)) { window.clearTimeout(timeout); reject(new Error("Could not connect to Supabase Realtime.")); }
      });
    });
  }

  async start(source: MediaSource, constraints: MediaTrackConstraints | boolean) {
    if (!this.channel || !this.credential) throw new Error("Join a media room first.");
    await this.stop(source);
    const stream = source === "screen" || source === "screen-audio" ? await navigator.mediaDevices.getDisplayMedia({ audio: source === "screen-audio", video: source === "screen" }) : await navigator.mediaDevices.getUserMedia({ [source === "mic" ? "audio" : "video"]: constraints });
    const track = source === "mic" || source === "screen-audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
    if (!track) throw new Error("No requested media track is available.");
    this.localTracks.set(source, track); track.onended = () => void this.stop(source);
    for (const peer of this.peers.values()) peer.connection.addTrack(track, stream);
    this.changed(); return track;
  }

  async stop(source: MediaSource) {
    const track = this.localTracks.get(source); if (!track) return;
    this.localTracks.delete(source); track.onended = null; track.stop();
    for (const peer of this.peers.values()) for (const sender of peer.connection.getSenders()) if (sender.track === track) await sender.replaceTrack(null);
    this.changed();
  }

  async setMicMuted(muted: boolean) { const track = this.localTracks.get("mic"); if (!track) return; track.enabled = !muted; this.changed(); }

  private async send(signal: Omit<Signal, "from" | "participant">) {
    if (!this.channel || !this.credential) return;
    const result = await this.channel.send({ type: "broadcast", event: "signal", payload: { ...signal, from: this.instanceId, participant: this.credential.participant } });
    if (result !== "ok") throw new Error("Voice signaling message was not delivered.");
  }

  private createPeer(remoteId: string, participant: Credential["participant"]) {
    const connection = new RTCPeerConnection({ iceServers });
    const peer: Peer = { candidates: [], connection, ignoreOffer: false, makingOffer: false, participant, polite: this.instanceId.localeCompare(remoteId) > 0 };
    this.peers.set(remoteId, peer); this.participants.set(remoteId, { userId: participant.id, metadata: participant, muted: false, speaking: false });
    for (const track of this.localTracks.values()) connection.addTrack(track, new MediaStream([track]));
    connection.onicecandidate = ({ candidate }) => { if (candidate) void this.send({ type: "candidate", to: remoteId, candidate: candidate.toJSON() }); };
    connection.onnegotiationneeded = () => { void this.createOffer(remoteId, peer); };
    connection.ontrack = ({ track }) => {
      const source: MediaSource = track.kind === "audio" ? "mic" : "camera"; const id = `${remoteId}:${track.id}`;
      this.remote.set(id, { consumerId: id, producerId: id, userId: participant.id, source, kind: track.kind as "audio" | "video", track });
      track.onended = () => { this.remote.delete(id); this.changed(); }; this.changed();
    };
    connection.onconnectionstatechange = () => { if (["closed", "failed", "disconnected"].includes(connection.connectionState)) this.closePeer(remoteId); };
    this.changed(); return peer;
  }

  private async handleSignal(signal: Signal) {
    if (!signal || signal.from === this.instanceId || (signal.to && signal.to !== this.instanceId)) return;
    if (signal.type === "leave") { this.closePeer(signal.from); return; }
    let peer = this.peers.get(signal.from);
    if (signal.type === "hello") {
      if (!peer) peer = this.createPeer(signal.from, signal.participant);
      if (this.instanceId.localeCompare(signal.from) > 0) await this.createOffer(signal.from, peer);
      return;
    }
    if (!peer) peer = this.createPeer(signal.from, signal.participant);
    if (signal.type === "candidate" && signal.candidate) {
      if (peer.connection.remoteDescription) await peer.connection.addIceCandidate(signal.candidate); else peer.candidates.push(signal.candidate);
      return;
    }
    if (!signal.description) return;
    const collision = signal.description.type === "offer" && (peer.makingOffer || peer.connection.signalingState !== "stable");
    peer.ignoreOffer = !peer.polite && collision; if (peer.ignoreOffer) return;
    if (collision) await peer.connection.setLocalDescription({ type: "rollback" });
    await peer.connection.setRemoteDescription(signal.description);
    for (const candidate of peer.candidates.splice(0)) await peer.connection.addIceCandidate(candidate);
    if (signal.description.type === "offer") { await peer.connection.setLocalDescription(); await this.send({ type: "answer", to: signal.from, description: peer.connection.localDescription ?? undefined }); }
  }

  private async createOffer(remoteId: string, peer: Peer) {
    if (peer.makingOffer || peer.connection.signalingState !== "stable") return;
    peer.makingOffer = true;
    try { await peer.connection.setLocalDescription(); await this.send({ type: "offer", to: remoteId, description: peer.connection.localDescription ?? undefined }); } finally { peer.makingOffer = false; }
  }

  private closePeer(remoteId: string) {
    const peer = this.peers.get(remoteId); if (!peer) return;
    this.peers.delete(remoteId); this.participants.delete(remoteId); peer.connection.close();
    for (const [id, remote] of this.remote) if (remote.userId === peer.participant.id) this.remote.delete(id);
    this.changed();
  }

  async leave() {
    await Promise.all([...this.localTracks.keys()].map((source) => this.stop(source)));
    await this.send({ type: "leave" }).catch(() => undefined);
    for (const remoteId of [...this.peers.keys()]) this.closePeer(remoteId);
    if (this.channel) await this.channel.unsubscribe();
    this.channel = null; this.credential = null; this.participants.clear(); this.remote.clear(); this.state = "disconnected"; this.changed();
  }
}
