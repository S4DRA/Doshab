import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = compile("../lib/media/media-client.ts");
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(setImmediate); };
const identity = (id) => ({ id, name: id, email: `${id}@example.test` });
const credential = (id) => ({ participant: identity(id), signalingRoomId: "isolated-unit-test" });
let sequence = 0;
const track = (kind, id = `capture-${++sequence}`) => ({ id, kind, enabled: true, readyState: "live", stop() { this.readyState = "ended"; } });
class Stream {
  constructor(tracks) { this.tracks = tracks; }
  getTracks() { return this.tracks; }
  getAudioTracks() { return this.tracks.filter((item) => item.kind === "audio"); }
  getVideoTracks() { return this.tracks.filter((item) => item.kind === "video"); }
}

// Stateful transport/WebRTC boundaries exercise multiple production clients.
// This suite verifies signaling and lifecycle behavior, not real browser RTP delivery.
function room({ dropHello = false } = {}) {
  const channels = new Set();
  const signals = [];
  const errors = [];
  const connections = [];
  const sync = () => queueMicrotask(() => { for (const channel of channels) channel.handlers.presence?.(); });
  class PeerConnection {
    signalingState = "stable";
    connectionState = "new";
    transceivers = [];
    remoteDescription = null;
    localDescription = null;
    negotiationPending = false;
    received = new Set();
    restarts = 0;
    constructor(config) { this.config = config; connections.push(this); }
    addTransceiver(kind) {
      const sender = { track: null, async replaceTrack(value) { this.track = value; } };
      const transceiver = { mid: null, sender, receiver: { track: track(kind, `receiver-${++sequence}`) }, kind };
      this.transceivers.push(transceiver);
      if (!this.negotiationPending) {
        this.negotiationPending = true;
        queueMicrotask(() => { this.negotiationPending = false; if (this.signalingState === "stable") this.onnegotiationneeded?.(); });
      }
      return transceiver;
    }
    getTransceivers() { return this.transceivers; }
    getSenders() { return this.transceivers.map((item) => item.sender); }
    async setLocalDescription() {
      const type = this.signalingState === "have-remote-offer" ? "answer" : "offer";
      this.transceivers.forEach((item, index) => { item.mid = String(index); });
      this.localDescription = { type, sdp: JSON.stringify(this.transceivers.map((item) => ({ mid: item.mid, kind: item.kind }))) };
      this.signalingState = type === "offer" ? "have-local-offer" : "stable";
      if (type === "answer") { this.connectionState = "connected"; this.onconnectionstatechange?.(); }
    }
    async setRemoteDescription(description) {
      if (description.type === "answer") assert.equal(this.signalingState, "have-local-offer", "answer needs an outstanding offer");
      this.remoteDescription = description;
      this.signalingState = description.type === "offer" ? "have-remote-offer" : "stable";
      for (const { mid } of JSON.parse(description.sdp)) {
        const transceiver = this.transceivers[Number(mid)];
        transceiver.mid = mid;
        if (!this.received.has(mid)) { this.received.add(mid); this.ontrack?.({ track: transceiver.receiver.track, transceiver }); }
      }
      if (description.type === "answer") { this.connectionState = "connected"; this.onconnectionstatechange?.(); }
    }
    async addIceCandidate() { assert.ok(this.remoteDescription, "candidate must wait for a remote description"); }
    restartIce() { this.restarts++; queueMicrotask(() => this.onnegotiationneeded?.()); }
    close() { this.signalingState = "closed"; this.connectionState = "closed"; this.onconnectionstatechange?.(); }
  }
  function client(instanceId) {
    let channel;
    let capture;
    let failedDelivery = false;
    const captures = [];
    const exports = {};
    const acquire = async (constraints, display = false) => {
      if (capture) return capture(constraints);
      const tracks = [];
      if (constraints.audio) tracks.push(track("audio"));
      if (constraints.video || display) tracks.push(track("video"));
      captures.push(...tracks);
      return new Stream(tracks);
    };
    vm.runInNewContext(compiled, {
      exports, console: { ...console, warn: (...args) => errors.push(args) },
      crypto: { randomUUID: () => instanceId }, window: { setTimeout, clearTimeout }, setTimeout, clearTimeout,
      MediaStream: Stream, RTCPeerConnection: PeerConnection,
      navigator: { mediaDevices: { getUserMedia: (constraints) => acquire(constraints), getDisplayMedia: (constraints) => acquire(constraints, true) } },
      require(name) {
        assert.equal(name, "@/lib/supabase/client");
        return { createSupabaseBrowserClientFromRuntimeConfig: async () => ({ channel: () => {
          channel = {
            handlers: {}, presence: null,
            on(event, _filter, handler) { this.handlers[event] = handler; return this; },
            subscribe(handler) { this.status = handler; channels.add(this); queueMicrotask(() => handler("SUBSCRIBED")); },
            async track(value) { this.presence = value; sync(); return "ok"; },
            presenceState() { return Object.fromEntries([...channels].filter((item) => item.presence).map((item) => [item.presence.instanceId, [item.presence]])); },
            async send({ payload }) {
              if (failedDelivery) return "error";
              signals.push(payload);
              if (signals.length > 150) throw new Error("Negotiation did not settle");
              if (dropHello && ["hello", "welcome"].includes(payload.type)) return "ok";
              for (const other of channels) if (other !== this) queueMicrotask(() => other.handlers.broadcast?.({ payload }));
              return "ok";
            },
            async unsubscribe() { channels.delete(this); this.status("CLOSED"); sync(); },
          };
          return channel;
        } }) };
      },
    });
    const media = new exports.MediaClient();
    return { media, captures, setCapture: (fn) => { capture = fn; }, failDelivery: () => { failedDelivery = true; },
      status: (value) => channel.status(value), disconnect: () => { channels.delete(channel); sync(); },
      receive: (payload) => channel.handlers.broadcast({ payload }), channel: () => channel };
  }
  return { client, signals, errors, connections };
}

for (const order of ["az", "za", "together"]) test(`two muted accounts discover each other and negotiation settles (${order})`, async () => {
  const network = room(); const a = network.client("a"); const z = network.client("z");
  if (order === "together") await Promise.all([a.media.connect(credential("Alice")), z.media.connect(credential("Zoe"))]);
  else for (const id of order) await (id === "a" ? a : z).media.connect(credential(id === "a" ? "Alice" : "Zoe"));
  await flush();
  assert.equal(a.media.snapshot().participants[0].metadata.name, "Zoe");
  assert.equal(z.media.snapshot().participants[0].metadata.name, "Alice");
  assert.ok(network.connections.every((item) => item.signalingState === "stable"));
  const offers = network.signals.filter((item) => item.type === "offer").length;
  assert.equal(offers, 1, "exactly one initial offer should establish the pair");
  await flush(); assert.equal(network.signals.filter((item) => item.type === "offer").length, offers);
  assert.equal(network.errors.length, 0);
  await a.media.leave(); await z.media.leave();
});

test("presence discovers peers even when one-shot announcements are missed", async () => {
  const { client, errors } = room({ dropHello: true }); const a = client("a"); const b = client("b");
  await a.media.connect(credential("Alice")); await b.media.connect(credential("Bob")); await flush();
  assert.equal(a.media.snapshot().participants.length, 1); assert.equal(b.media.snapshot().participants.length, 1);
  assert.equal(a.media.snapshot().participants[0].connectionState, "connected");
  assert.equal(errors.length, 0); await a.media.leave(); await b.media.leave();
});

test("microphone, camera, screen and screen audio coexist and restart independently", async () => {
  const { client, signals, errors } = room(); const a = client("a"); const b = client("b");
  await a.media.connect(credential("Alice")); await b.media.connect(credential("Bob")); await flush();
  await Promise.all([a.media.start("mic", true), b.media.start("mic", true)]);
  await a.media.start("screen", true); await a.media.start("camera", true); await flush();
  assert.deepEqual([...b.media.snapshot().remote.map((item) => item.source)].sort(), ["camera", "mic", "screen", "screen-audio"]);
  assert.equal(a.media.snapshot().remote[0].source, "mic");
  await a.media.setMicMuted(true); await flush();
  assert.equal(b.media.snapshot().participants[0].muted, true);
  await a.media.stop("camera"); await flush();
  assert.ok(b.media.snapshot().remote.some((item) => item.source === "screen"));
  assert.ok(!b.media.snapshot().remote.some((item) => item.source === "camera"));
  await a.media.start("camera", true); await flush();
  assert.ok(b.media.snapshot().remote.some((item) => item.source === "camera"), "receiver track identity survives replaceTrack");
  await a.media.stop("screen"); await flush();
  assert.deepEqual([...b.media.snapshot().remote.map((item) => item.source)].sort(), ["camera", "mic"]);
  assert.ok(signals.filter((item) => item.type === "offer").length <= 2, "media toggles do not create offer loops");
  assert.equal(errors.length, 0); await a.media.leave(); await b.media.leave();
  assert.ok(a.captures.every((item) => item.readyState === "ended"));
});

test("temporary ICE interruption keeps the participant; presence departure removes them", async () => {
  const { client, connections } = room(); const a = client("a"); const b = client("b");
  await a.media.connect(credential("Alice")); await b.media.connect(credential("Bob")); await flush();
  connections[0].connectionState = "disconnected"; connections[0].onconnectionstatechange();
  assert.equal(a.media.snapshot().participants.length, 1);
  b.disconnect(); await flush(); assert.equal(a.media.snapshot().participants.length, 0);
  await a.media.leave(); await b.media.leave();
});

test("late discovery announcements retain negotiated media mappings", async () => {
  const { client, signals } = room(); const a = client("a"); const b = client("b");
  await a.media.connect(credential("Alice"));
  await a.media.start("camera", true); await a.media.start("screen", true);
  await b.media.connect(credential("Bob")); await flush();
  const hello = signals.findLast((signal) => signal.from === "a" && signal.type === "hello" && !signal.to);
  const sources = Object.fromEntries(a.media.snapshot().local.map((item) => [item.track.id, item.source]));
  b.receive({ ...hello, sources }); await flush();
  assert.deepEqual([...b.media.snapshot().remote.map((item) => item.source)].sort(), ["camera", "screen", "screen-audio"]);
  await a.media.leave(); await b.media.leave();
});

test("leaving one session does not erase another session for the same account", async () => {
  const { client } = room(); const a = client("a"); const b = client("b"); const c = client("c");
  await a.media.connect(credential("Alice")); await b.media.connect(credential("Bob")); await c.media.connect(credential("Bob")); await flush();
  await b.media.start("mic", true); await c.media.start("mic", true); await flush();
  assert.equal(a.media.snapshot().remote.length, 2);
  await b.media.leave(); await flush(); assert.equal(a.media.snapshot().remote.length, 1);
  await a.media.leave(); await c.media.leave();
});

test("leaving during a permission prompt stops late capture", async () => {
  const { client } = room(); const a = client("a"); const mic = track("audio"); let resolve;
  a.setCapture(() => new Promise((done) => { resolve = done; }));
  await a.media.connect(credential("Alice")); const pending = a.media.start("mic", true);
  await a.media.leave(); resolve(new Stream([mic]));
  await assert.rejects(pending, /call ended/); assert.equal(mic.readyState, "ended");
  assert.equal(a.media.snapshot().local.length, 0);
});

test("cancelling a replacement camera capture preserves the live camera", async () => {
  const { client } = room(); const a = client("a"); await a.media.connect(credential("Alice"));
  const camera = await a.media.start("camera", true);
  a.setCapture(() => Promise.reject(new Error("Permission denied")));
  await assert.rejects(a.media.start("camera", true), /Permission denied/);
  assert.equal(camera.readyState, "live"); assert.equal(a.media.snapshot().cameraOn, true);
  await a.media.leave();
});

test("push-to-talk release during a microphone prompt keeps late capture muted", async () => {
  const { client } = room(); const a = client("a"); const mic = track("audio"); let resolve;
  a.setCapture(() => new Promise((done) => { resolve = done; }));
  await a.media.connect(credential("Alice"));
  await a.media.setMicMuted(false); const pending = a.media.start("mic", true);
  await a.media.setMicMuted(true); resolve(new Stream([mic])); await pending;
  assert.equal(mic.enabled, false); assert.equal(a.media.snapshot().micMuted, true);
  await a.media.leave();
});

test("server-issued ICE configuration reaches each peer connection", async () => {
  const { client, connections } = room(); const a = client("a"); const b = client("b");
  const iceServers = [{ urls: "turn:relay.example.test:3478", username: "temporary", credential: "test-only" }];
  await a.media.connect({ ...credential("Alice"), iceServers });
  await b.media.connect({ ...credential("Bob"), iceServers }); await flush();
  assert.ok(connections.every((connection) => connection.config.iceServers === iceServers));
  await a.media.leave(); await b.media.leave();
});

test("leaving releases all hardware when signaling delivery fails", async () => {
  const { client, errors } = room(); const a = client("a"); await a.media.connect(credential("Alice"));
  await a.media.start("mic", true); await a.media.start("screen", true); a.failDelivery();
  await a.media.leave(); assert.ok(a.captures.every((item) => item.readyState === "ended"));
  assert.equal(a.media.snapshot().state, "disconnected"); assert.equal(errors.length, 1);
});

test("signaling failure recovers and a stale subscription cannot revive a left room", async () => {
  const { client } = room(); const a = client("a"); await a.media.connect(credential("Alice"));
  a.status("CHANNEL_ERROR"); assert.equal(a.media.snapshot().state, "failed");
  a.status("SUBSCRIBED"); await flush(); assert.equal(a.media.snapshot().state, "connected");
  await a.media.leave(); a.status("SUBSCRIBED"); await flush(); assert.equal(a.media.snapshot().state, "disconnected");
});

test("the call view retains camera and screen as separate selectable views", () => {
  const exports = {}; vm.runInNewContext(compile("../lib/media/call-view.ts"), { exports });
  const local = [{ source: "camera", kind: "video", track: track("video") }, { source: "screen", kind: "video", track: track("video") }];
  const remote = [{ source: "camera", kind: "video", track: track("video"), userId: "Bob" }, { source: "screen", kind: "video", track: track("video"), userId: "Bob", consumerId: "remote-screen" }];
  const { people, views } = exports.buildCallViews(identity("Alice"), local, remote, [{ userId: "Bob", metadata: identity("Bob"), muted: true }], false);
  assert.equal(people.length, 2); assert.equal(views.length, 4);
  assert.equal(views.filter((item) => item.source === "camera").length, 2);
  assert.equal(views.filter((item) => item.source === "screen").length, 2);
  assert.equal(new Set(views.map((item) => item.id)).size, 4);
});

const callViews = () => {
  const exports = {}; vm.runInNewContext(compile("../lib/media/call-view.ts"), { exports });
  const { views } = exports.buildCallViews(identity("Alice"), [], [], [{ userId: "Bob", metadata: identity("Bob"), muted: false, connectionState: "connected" }], true);
  return { ...exports, views };
};
test("auto layout shows both participants and focuses a newly shared screen", () => {
  const { selectCallLayout, views } = callViews();
  assert.equal(selectCallLayout(views, "auto", null, []).gallery, true);
  views.push({ id: "screen:Bob", person: views[1].person, source: "screen" });
  const layout = selectCallLayout(views, "auto", null, []);
  assert.equal(layout.gallery, false); assert.equal(layout.activeView.id, "screen:Bob");
});
test("manual gallery keeps both camera and screen visible, and focus keeps its pin", () => {
  const { selectCallLayout, views } = callViews();
  views.push({ id: "screen:Bob", person: views[1].person, source: "screen" });
  const gallery = selectCallLayout(views, "gallery", null, ["Bob"]);
  assert.equal(gallery.gallery, true); assert.equal(gallery.galleryViews[0].source, "screen");
  assert.equal(gallery.galleryViews.length, 3);
  const focus = selectCallLayout(views, "focus", views[0].id, ["Bob"]);
  assert.equal(focus.gallery, false); assert.equal(focus.activeView.id, views[0].id);
});
test("a stopped pinned share restores automatic participant visibility", () => {
  const { selectCallLayout, views } = callViews();
  const layout = selectCallLayout(views, "focus", "screen:stopped", ["Alice", "Bob"]);
  assert.equal(layout.mode, "auto"); assert.equal(layout.gallery, true);
  assert.equal(layout.activeView.person.id, "Bob");
});
test("large rooms page video views and clamp after participants leave", () => {
  const { pageCallViews, views } = callViews();
  const many = Array.from({ length: 19 }, (_, i) => ({ ...views[0], id: `camera:${i}` }));
  const page = pageCallViews(many, 2);
  assert.equal(page.items.length, 6); assert.equal(page.items[0].id, "camera:12"); assert.equal(page.pages, 4);
  const remaining = pageCallViews(many.slice(0, 4), 2);
  assert.equal(remaining.page, 0); assert.equal(remaining.items.length, 4);
});
test("multiple sessions for one person show their connected and unmuted state", () => {
  const { buildCallViews } = callViews();
  const participants = [
    { userId: "Bob", metadata: { ...identity("Bob"), image: "/avatar.png" }, muted: true, connectionState: "connecting" },
    { userId: "Bob", metadata: identity("Bob"), muted: false, connectionState: "connected" },
  ];
  const { people, views } = buildCallViews(identity("Alice"), [], [], participants, true);
  assert.equal(people.length, 2); assert.equal(views.length, 2);
  assert.equal(people[1].connectionState, "connected"); assert.equal(people[1].muted, false);
  assert.equal(people[1].image, "/avatar.png");
});
