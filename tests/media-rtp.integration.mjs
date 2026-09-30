import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
// Optional native integration test. Install @roamhq/wrtc outside the app and set
// WRTC_MODULE_PATH to that package directory, or make it available to Node.
const rtc = require(process.env.WRTC_MODULE_PATH || '@roamhq/wrtc');
const env = { ...Object.assign({}, ...['.env', '.env.local'].map(name => {
  const path = new URL(`../${name}`, import.meta.url);
  return existsSync(path) ? parse(readFileSync(path)) : {};
})), ...process.env };
assert.ok(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Supabase public configuration is required');
const roomId = `val-verification-${crypto.randomUUID()}`;
const compiled = ts.transpileModule(readFileSync(new URL('../lib/media/media-client.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const warnings = [];
const clients = [];
const waitFor = async (predicate, label, timeout = 15000) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error(`Timed out: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 75));
  }
};
function endpoint(name) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const connections = []; const intervals = []; const captures = []; const sinks = new Map();
  const received = { audio: 0, audible: 0, camera: 0, screen: 0 };
  const audio = () => {
    const source = new rtc.nonstandard.RTCAudioSource(); const track = source.createTrack(); captures.push(track);
    let phase = 0;
    intervals.push(setInterval(() => {
      if (track.readyState === 'ended') return;
      const samples = new Int16Array(480);
      for (let i = 0; i < samples.length; i++) samples[i] = 4000 * Math.sin((phase++ * 2 * Math.PI * 440) / 48000);
      source.onData({ samples, sampleRate: 48000 });
    }, 10));
    return track;
  };
  const video = (screen) => {
    const source = new rtc.nonstandard.RTCVideoSource(); const track = source.createTrack(); captures.push(track);
    const width = screen ? 640 : 320; const height = screen ? 360 : 240;
    const data = new Uint8ClampedArray(width * height * 1.5).fill(screen ? 160 : 80);
    intervals.push(setInterval(() => { if (track.readyState !== 'ended') source.onFrame({ width, height, data }); }, 50));
    return track;
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, crypto: { randomUUID: () => name }, window: { setTimeout, clearTimeout }, setTimeout, clearTimeout,
    console: { ...console, warn: (message, cause) => { warnings.push(`${name}: ${message}: ${cause?.message ?? cause}`); } },
    MediaStream: rtc.MediaStream,
    RTCPeerConnection: class extends rtc.RTCPeerConnection {
      constructor(options) { super(options); connections.push(this); }
      // node-webrtc's older wrapper requires an explicit description. Browser APIs infer it.
      async setLocalDescription(description) {
        return super.setLocalDescription(description ?? await (this.signalingState === 'have-remote-offer' ? this.createAnswer() : this.createOffer()));
      }
      async setRemoteDescription(description) {
        if (description.type === 'offer' && this.signalingState === 'have-local-offer') await super.setLocalDescription({ type: 'rollback' });
        return super.setRemoteDescription(description);
      }
    },
    navigator: { mediaDevices: {
      getUserMedia: async (options) => new rtc.MediaStream([options.audio ? audio() : video(false)]),
      getDisplayMedia: async () => new rtc.MediaStream([video(true), audio()]),
    } },
    require: () => ({ createSupabaseBrowserClientFromRuntimeConfig: async () => supabase }),
  });
  const media = new exports.MediaClient();
  media.subscribe(() => {
    const remote = media.snapshot().remote;
    for (const [id, sink] of sinks) if (!remote.some(item => item.consumerId === id)) { sink.stop(); sinks.delete(id); }
    for (const item of remote) {
      if (sinks.has(item.consumerId)) continue;
      if (item.kind === 'audio') {
        const sink = new rtc.nonstandard.RTCAudioSink(item.track);
        sink.ondata = ({ samples }) => { received.audio++; if (samples.some(value => Math.abs(value) > 100)) received.audible++; };
        sinks.set(item.consumerId, sink);
      } else {
        const sink = new rtc.nonstandard.RTCVideoSink(item.track);
        sink.onframe = ({ frame }) => {
          if (item.source === 'camera' && frame.width === 320) received.camera++;
          if (item.source === 'screen' && frame.width === 640) received.screen++;
        };
        sinks.set(item.consumerId, sink);
      }
    }
  });
  const result = { name, media, connections, received, captures, credential: { participant: { id: name, name, email: `${name}@example.test` }, signalingRoomId: roomId },
    async close() { intervals.forEach(clearInterval); await media.leave(); for (const sink of sinks.values()) sink.stop(); await supabase.removeAllChannels(); } };
  clients.push(result); return result;
}

try {
  const a = endpoint('rtp-test-a'); const b = endpoint('rtp-test-b');
  if (process.env.MEDIA_JOIN_ORDER === 'reverse') { await b.media.connect(b.credential); await a.media.connect(a.credential); }
  else if (process.env.MEDIA_JOIN_ORDER === 'together') await Promise.all([a.media.connect(a.credential), b.media.connect(b.credential)]);
  else { await a.media.connect(a.credential); await b.media.connect(b.credential); }
  await waitFor(() => a.media.snapshot().participants[0]?.connectionState === 'connected' && b.media.snapshot().participants[0]?.connectionState === 'connected', 'bidirectional media connection');
  console.log('PASS: live Supabase presence and native WebRTC connection between two independent clients');
  await a.media.start('mic', true); await b.media.start('mic', true);
  await waitFor(() => a.received.audible > 5 && b.received.audible > 5, 'bidirectional decoded audio');
  console.log('PASS: both clients decode audible microphone samples');
  await a.media.start('screen', true); await a.media.start('camera', true);
  await waitFor(() => b.received.camera > 3 && b.received.screen > 3, 'simultaneous camera and screen frames');
  assert.deepEqual([...b.media.snapshot().remote.map(item => item.source)].sort(), ['camera', 'mic', 'screen', 'screen-audio']);
  console.log('PASS: camera and screen decode concurrently; screen audio is also received');
  await a.media.stop('camera'); await waitFor(() => !b.media.snapshot().remote.some(item => item.source === 'camera'), 'camera stopped remotely');
  const previousScreen = b.received.screen;
  await waitFor(() => b.received.screen > previousScreen + 2, 'screen continues while camera is off');
  const previousCamera = b.received.camera;
  await a.media.start('camera', true); await waitFor(() => b.received.camera > previousCamera + 3, 'camera restart uses existing receiver');
  await a.media.stop('screen'); await waitFor(() => !b.media.snapshot().remote.some(item => item.source.startsWith('screen')), 'screen and its audio stopped');
  await a.media.setMicMuted(true); await waitFor(() => b.media.snapshot().participants[0]?.muted, 'remote mute status');
  console.log('PASS: stop/restart camera, stop share audio, and remote mute update independently');
  const stats = await Promise.all(clients.map(async client => {
    const reports = await client.connections[0].getStats();
    return { client: client.name, received: client.received, inbound: [...reports.values()].filter(item => item.type === 'inbound-rtp').map(item => ({ kind: item.kind ?? item.mediaType, packetsReceived: item.packetsReceived, bytesReceived: item.bytesReceived })) };
  }));
  console.log(JSON.stringify(stats, null, 2));
  await a.media.leave(); await waitFor(() => b.media.snapshot().participants.length === 0, 'participant departure');
  assert.ok(a.captures.every(track => track.readyState === 'ended'));
  assert.equal(warnings.length, 0, warnings.join('\n'));
  console.log('PASS: departure and hardware cleanup; no media signaling errors');
  await b.media.start('camera', true); await b.media.start('screen', true);
  await a.media.connect(a.credential);
  await waitFor(() => a.received.camera > 3 && a.received.screen > 3, 'late join receives already-active camera and screen');
  assert.equal(warnings.length, 0, warnings.join('\n'));
  console.log('PASS: leaving and rejoining receives already-active media');
} catch (error) {
  console.error(error.message);
  console.error(JSON.stringify(clients.map(client => ({ client: client.name, state: client.media.snapshot().state, peers: client.media.snapshot().participants.map(person => person.connectionState), remote: client.media.snapshot().remote.map(item => ({ source: item.source, kind: item.kind, track: item.track.id })), media: client.connections.map(pc => pc.getTransceivers().map(t => ({mid: t.mid, currentDirection:t.currentDirection, sender: t.sender.track?.id, receiver:t.receiver.track?.id}))), received: client.received })), null, 2));
  console.error(warnings.join('\n')); process.exitCode = 1;
} finally {
  await Promise.all(clients.map(client => client.close()));
  setTimeout(() => process.exit(process.exitCode ?? 0), 100);
}
