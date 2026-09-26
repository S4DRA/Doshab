import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the production client with browser/media boundaries replaced, without devices or a live room.
const compiled = ts.transpileModule(readFileSync(new URL("../lib/media/media-client.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const credential = { participant: { id: "local", name: "Local", email: "local@example.test" }, signalingRoomId: "isolated-test" };
function setup() {
  let status;
  let receive;
  let resolveCapture;
  const track = { id: "local-mic", kind: "audio", enabled: true, readyState: "live", stop() { this.readyState = "ended"; } };
  const remoteScreen = { id: "remote-screen", kind: "video" };
  const sent = [];
  class PeerConnection {
    signalingState = "stable";
    async setRemoteDescription(description) { this.remoteDescription = description; this.ontrack?.({ track: remoteScreen }); }
    async setLocalDescription() { this.localDescription = { type: "answer", sdp: "test" }; }
    getSenders() { return []; }
    close() {}
  }
  const channel = {
    on(_event, _filter, callback) { receive = callback; return this; },
    subscribe(callback) { status = callback; queueMicrotask(() => callback("SUBSCRIBED")); },
    async send(message) { sent.push(message.payload); return "ok"; },
    async unsubscribe() { status?.("CLOSED"); },
  };
  const capture = new Promise((resolve) => { resolveCapture = () => resolve({ getAudioTracks: () => [track], getVideoTracks: () => [], getTracks: () => [track] }); });
  const exports = {};
  const context = vm.createContext({
    exports, console, crypto, window: { setTimeout, clearTimeout }, RTCPeerConnection: PeerConnection,
    navigator: { mediaDevices: { getUserMedia: () => capture } },
    require(name) {
      assert.equal(name, "@/lib/supabase/client");
      return { createSupabaseBrowserClientFromRuntimeConfig: async () => ({ channel: () => channel }) };
    },
  });
  vm.runInContext(compiled, context);
  return { client: new exports.MediaClient(), track, resolveCapture, sent, receive: (payload) => receive({ payload }), status: (value) => status(value) };
}

test("leaving during a permission prompt stops the late microphone track", async () => {
  const { client, track, resolveCapture } = setup();
  await client.connect(credential);
  const pending = client.start("mic", true);
  await client.leave();
  resolveCapture();
  await assert.rejects(pending, /call ended/);
  assert.equal(track.readyState, "ended");
  assert.equal(client.snapshot().local.length, 0);
  assert.equal(client.snapshot().state, "disconnected");
});

test("a signaling failure after joining updates the UI state and can recover", async () => {
  const { client, status } = setup();
  await client.connect(credential);
  status("CHANNEL_ERROR");
  assert.equal(client.snapshot().state, "failed");
  status("SUBSCRIBED");
  assert.equal(client.snapshot().state, "connected");
  await client.leave();
  status("SUBSCRIBED");
  assert.equal(client.snapshot().state, "disconnected");
});

test("mute changes the actual track, and leaving releases it", async () => {
  const { client, track, resolveCapture } = setup();
  await client.connect(credential);
  resolveCapture();
  await client.start("mic", true);
  await client.setMicMuted(true);
  assert.equal(track.enabled, false);
  assert.equal(client.snapshot().micMuted, true);
  await client.setMicMuted(false);
  assert.equal(track.enabled, true);
  await client.leave();
  assert.equal(track.readyState, "ended");
  assert.equal(client.snapshot().local.length, 0);
});

test("remote screen metadata reaches the stage instead of being treated as a camera", async () => {
  const { client, receive, sent } = setup();
  await client.connect(credential);
  receive({ type: "offer", from: "remote-instance", participant: { id: "remote", name: "Remote" }, description: { type: "offer", sdp: "test" }, sources: { "remote-screen": "screen" } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(client.snapshot().remote[0].source, "screen");
  assert.equal(client.snapshot().remote[0].userId, "remote");
  assert.ok(sent.some((signal) => signal.type === "answer"));
  await client.leave();
});
