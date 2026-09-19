"use client";

import { Device, type types } from "mediasoup-client";
import { io, type Socket } from "socket.io-client";
import type { MediaConnectionState, MediaParticipant, MediaSource, RemoteMedia } from "./types";

type Credential = { credential: string; mediaServerUrl: string; roomId: string };
type Listener = () => void;
type TransportResponse = types.TransportOptions;
type ConsumeResponse = { id: string; producerId: string; kind: "audio" | "video"; rtpParameters: types.RtpParameters; source: MediaSource; userId: string };
const request = <T>(socket: Socket, event: string, payload: unknown) => new Promise<T>((resolve, reject) => socket.emit(event, payload, (result: T & { error?: string }) => result?.error ? reject(new Error(result.error)) : resolve(result)));

export class MediaClient {
  private socket: Socket | null = null; private device: Device | null = null; private sendTransport: types.Transport | null = null; private recvTransport: types.Transport | null = null;
  private producers = new Map<MediaSource, types.Producer>(); private consumers = new Map<string, types.Consumer>(); private remote = new Map<string, RemoteMedia>(); private listeners = new Set<Listener>(); private state: MediaConnectionState = "disconnected"; private participants = new Map<string, MediaParticipant>();
  subscribe(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  snapshot() { return { state: this.state, participants: [...this.participants.values()], remote: [...this.remote.values()], micMuted: this.producers.get("mic")?.paused ?? true, cameraOn: this.producers.has("camera"), screenOn: this.producers.has("screen") }; }
  private changed() { this.listeners.forEach((listener) => listener()); }
  async connect(credential: Credential) {
    await this.leave(); this.state = "connecting"; this.changed();
    const socket = io(credential.mediaServerUrl, { auth: { credential: credential.credential }, transports: ["websocket"] }); this.socket = socket;
    await new Promise<void>((resolve, reject) => { socket.once("connect", () => resolve()); socket.once("connect_error", reject); });
    const joined = await request<{ rtpCapabilities: object; producers: Array<{ producerId: string; userId: string; source: MediaSource; kind: "audio" | "video" }> }>(socket, "join-room", { roomId: credential.roomId });
    const device = new Device(); await device.load({ routerRtpCapabilities: joined.rtpCapabilities }); this.device = device;
    this.sendTransport = await this.createTransport("send"); this.recvTransport = await this.createTransport("recv");
    socket.on("new-producer", (producer) => void this.consume(producer)); socket.on("producer-closed", ({ producerId }) => this.closeConsumerByProducer(producerId)); socket.on("consumer-closed", ({ consumerId }) => this.closeConsumer(consumerId)); socket.on("peer-joined", ({ userId, metadata }) => { this.participants.set(userId, { userId, metadata, muted: false, speaking: false }); this.changed(); }); socket.on("peer-left", ({ userId }) => { this.participants.delete(userId); this.changed(); }); socket.on("disconnect", () => { this.state = "disconnected"; this.changed(); });
    for (const producer of joined.producers) await this.consume(producer); this.state = "connected"; this.changed();
  }
  private async createTransport(direction: "send" | "recv"): Promise<types.Transport> {
    if (!this.socket || !this.device) throw new Error("Media device is unavailable."); const data = await request<TransportResponse>(this.socket, "create-transport", { direction }); const transport = direction === "send" ? this.device.createSendTransport(data) : this.device.createRecvTransport(data);
    transport.on("connect", ({ dtlsParameters }, callback, errback) => { request(this.socket!, "connect-transport", { transportId: transport.id, dtlsParameters }).then(() => callback()).catch(errback); });
    if (direction === "send") transport.on("produce", ({ kind, rtpParameters, appData }, callback, errback) => { request<{ id: string }>(this.socket!, "produce", { transportId: transport.id, kind, rtpParameters, source: appData.source }).then(({ id }) => callback({ id })).catch(errback); });
    transport.on("connectionstatechange", (state) => { if (state === "failed") { this.state = "failed"; this.changed(); } }); return transport;
  }
  async start(source: MediaSource, constraints: MediaTrackConstraints | boolean) { if (!this.sendTransport) throw new Error("Join a media room first."); await this.stop(source); const stream = source === "screen" || source === "screen-audio" ? await navigator.mediaDevices.getDisplayMedia({ video: source === "screen", audio: source === "screen-audio" }) : await navigator.mediaDevices.getUserMedia({ [source === "mic" ? "audio" : "video"]: constraints }); const track = source === "mic" || source === "screen-audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]; if (!track) throw new Error("No requested media track is available."); const producer = await this.sendTransport.produce({ track, appData: { source } }); this.producers.set(source, producer); track.onended = () => void this.stop(source); this.changed(); return producer; }
  async stop(source: MediaSource) { const producer = this.producers.get(source); if (!producer) return; this.producers.delete(source); if (this.socket) await request(this.socket, "close-producer", { producerId: producer.id }).catch(() => undefined); producer.track?.stop(); producer.close(); this.changed(); }
  async setMicMuted(muted: boolean) { const producer = this.producers.get("mic"); if (!producer) return; if (muted) await producer.pause(); else await producer.resume(); this.changed(); }
  private async consume(info: { producerId: string; userId: string; source: MediaSource; kind: "audio" | "video" }) { if (!this.recvTransport || !this.socket || !this.device || this.remote.has(info.producerId)) return; const result = await request<ConsumeResponse>(this.socket, "consume", { transportId: this.recvTransport.id, producerId: info.producerId, rtpCapabilities: this.device.rtpCapabilities }); const consumer = await this.recvTransport.consume(result); this.consumers.set(consumer.id, consumer); this.remote.set(result.producerId, { consumerId: consumer.id, producerId: result.producerId, userId: result.userId, source: result.source, kind: result.kind, track: consumer.track }); await request(this.socket, "resume-consumer", { consumerId: consumer.id }); this.changed(); }
  private closeConsumer(id: string) { const consumer = this.consumers.get(id); if (!consumer) return; this.consumers.delete(id); const item = [...this.remote.values()].find((value) => value.consumerId === id); if (item) this.remote.delete(item.producerId); consumer.close(); this.changed(); }
  private closeConsumerByProducer(producerId: string) { const item = this.remote.get(producerId); if (item) this.closeConsumer(item.consumerId); }
  async leave() { for (const source of [...this.producers.keys()]) await this.stop(source); for (const id of [...this.consumers.keys()]) this.closeConsumer(id); if (this.socket) await request(this.socket, "leave-room", {}).catch(() => undefined); this.sendTransport?.close(); this.recvTransport?.close(); this.socket?.disconnect(); this.socket = null; this.device = null; this.sendTransport = null; this.recvTransport = null; this.participants.clear(); this.state = "disconnected"; this.changed(); }
}
