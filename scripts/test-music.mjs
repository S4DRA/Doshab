import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { test, after } from "node:test";
import ts from "typescript";

// Compile the production reducer, not a second implementation. Fixtures never enter VAL's database.
const directory = mkdtempSync(path.join(tmpdir(), "val-music-tests-"));
for (const name of ["types", "state", "metadata", "refresh"]) {
  writeFileSync(path.join(directory, `${name}.js`), ts.transpileModule(readFileSync(new URL(`../lib/music/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText);
}
const require = createRequire(import.meta.url);
const { emptySession, expectedPosition } = require(path.join(directory, "types.js"));
const { applyCommand, reconcileDJ } = require(path.join(directory, "state.js"));
const { musicSessionFromMetadata } = require(path.join(directory, "metadata.js"));
const { coalesceMusicRefresh } = require(path.join(directory, "refresh.js"));
const metadataFile = path.resolve("lib/music/providers/youtube-metadata.ts");
const metadataModule = new Module(metadataFile);
metadataModule.filename = metadataFile;
metadataModule.paths = Module._nodeModulePaths(path.dirname(metadataFile));
metadataModule._compile(ts.transpileModule(readFileSync(metadataFile, "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, metadataFile);
const { youtubeVideoId, youtubeDuration, normalizeYouTubeVideo } = metadataModule.exports;
after(() => {
  const target = path.resolve(directory);
  assert.equal(path.dirname(target), path.resolve(tmpdir()));
  assert.ok(path.basename(target).startsWith("val-music-tests-"));
  rmSync(target, { recursive: true });
});

const a = { id: "a", name: "A", joinedAt: 10 };
const b = { id: "b", name: "B", joinedAt: 20 };
const c = { id: "c", name: "C", joinedAt: 30 };
const track = (id) => ({ id, queueId: id, provider: "youtube", title: "Test track", artist: "Test artist", artwork: null,
  artworkMirrors: [], duration: 180, genre: "", permalink: "", addedBy: a });
const start = () => applyCommand(emptySession("room"), { type: "playNow" }, a, 1000, track("one"));

test("metadata accepts server sessions and rejects malformed or unsupported tracks", () => {
  const session = { ...start(), track: track("abcdefghijk") };
  assert.deepEqual(musicSessionFromMetadata(JSON.stringify({ valMusicV1: session })), session);
  for (const raw of ["bad", "null", "{}", JSON.stringify({ valMusicV1: { ...session, version: -1 } }),
    JSON.stringify({ valMusicV1: { ...session, track: { ...session.track, provider: "other" } } })]) {
    assert.equal(musicSessionFromMetadata(raw), null);
  }
});

test("refresh bursts produce one active request and one follow-up", async () => {
  let calls = 0;
  let release;
  const coordinator = coalesceMusicRefresh(async () => {
    calls++;
    if (calls === 1) await new Promise((resolve) => { release = resolve; });
  });
  const first = coordinator.run();
  await Promise.all(Array.from({ length: 20 }, () => coordinator.run()));
  assert.equal(calls, 1);
  release();
  await first;
  assert.equal(calls, 2);
  coordinator.dispose();
});

test("unmount discards queued refreshes", async () => {
  let calls = 0;
  let release;
  const coordinator = coalesceMusicRefresh(async () => {
    calls++;
    await new Promise((resolve) => { release = resolve; });
  });
  const first = coordinator.run();
  await coordinator.run();
  coordinator.dispose();
  release();
  await first;
  await coordinator.run();
  assert.equal(calls, 1);
});

test("one participant: first play establishes DJ and server timing", () => {
  const s = start(); assert.equal(s.djUserId, a.id); assert.equal(s.state, "PLAYING"); assert.equal(expectedPosition(s, 51000), 50);
});
test("mid-song join reads position without restarting the room", () => {
  const s = start(); assert.deepEqual(reconcileDJ(s, [a, b]), s); assert.equal(expectedPosition(s, 43800), 42.8);
});
test("pause, seek, resume, restart use shared position anchors", () => {
  let s = applyCommand(start(), { type: "pause" }, a, 31000); assert.equal(expectedPosition(s, 90000), 30);
  s = applyCommand(s, { type: "seek", position: 80 }, a, 90000); assert.equal(expectedPosition(s, 100000), 80);
  s = applyCommand(s, { type: "play" }, a, 100000); assert.equal(expectedPosition(s, 105000), 85);
  s = applyCommand(s, { type: "restart" }, a, 105000); assert.equal(expectedPosition(s, 106000), 1);
});
test("listeners can enqueue but cannot operate DJ controls", () => {
  const s = applyCommand(start(), { type: "enqueue" }, b, 2000, track("two")); assert.equal(s.queue.length, 1);
  for (const command of [{ type: "pause" }, { type: "next" }, { type: "autoplay", enabled: true }, { type: "seek", position: 20 }, { type: "playNow" }, { type: "clear" }, { type: "reorder", queueIds: [] }]) {
    assert.throws(() => applyCommand(s, command, b, 2000), /Only the room DJ/);
  }
});
test("three participants: DJ deterministically transfers to earliest remaining user", () => {
  const s = reconcileDJ(start(), [c, b]); assert.equal(s.djUserId, b.id); assert.match(s.notice, /transferred to B/);
  assert.equal(reconcileDJ(s, [c]).djUserId, c.id);
  assert.equal(reconcileDJ(s, [a, b, c]).djUserId, b.id); // Returning former DJ does not steal controls.
});
test("empty room cleans session, queue, DJ, and history", () => {
  const s = applyCommand(start(), { type: "enqueue" }, b, 2000, track("two"));
  assert.deepEqual(reconcileDJ(s, []), emptySession("room"));
});
test("queue reorder preserves each item once and rejects stale lists", () => {
  let s = applyCommand(start(), { type: "enqueue" }, b, 2000, track("two"));
  s = applyCommand(s, { type: "enqueue" }, c, 2000, track("three"));
  assert.throws(() => applyCommand(s, { type: "reorder", queueIds: ["two", "two"] }, a, 2000), /queue changed/);
  assert.throws(() => applyCommand(s, { type: "reorder", queueIds: ["two"] }, a, 2000), /queue changed/);
  s = applyCommand(s, { type: "reorder", queueIds: ["three", "two"] }, a, 2000); assert.equal(s.queue[0].id, "three");
  s = applyCommand(s, { type: "moveBottom", queueId: "three" }, a, 2000); assert.equal(s.queue[0].id, "two");
  s = applyCommand(s, { type: "remove", queueId: "two" }, a, 2000); assert.equal(s.queue.length, 1);
});
test("queue is bounded and removed items fail clearly", () => {
  let s = start(); for (let i = 0; i < 30; i++) s = applyCommand(s, { type: "enqueue" }, b, 2000, track(String(i)));
  assert.throws(() => applyCommand(s, { type: "enqueue" }, b, 2000, track("overflow")), /queue is full/);
  assert.throws(() => applyCommand(s, { type: "remove", queueId: "gone" }, a, 2000), /no longer in the queue/);
});
test("listener cannot force an early end or end a paused track", () => {
  assert.throws(() => applyCommand(start(), { type: "ended" }, b, 3000), /has not ended/);
  assert.doesNotThrow(() => applyCommand(start(), { type: "ended" }, b, 181000));
  const paused = applyCommand(start(), { type: "pause" }, a, 10000);
  assert.throws(() => applyCommand(paused, { type: "ended" }, b, 999000), /has not ended/);
});
test("playback positions clamp and replay after the end starts at zero", () => {
  let s = start(); assert.equal(expectedPosition(s, 0), 0); assert.equal(expectedPosition(s, 999000), 180);
  s = applyCommand(s, { type: "seek", position: 1000 }, a, 2000); assert.equal(s.position, 180);
  s = applyCommand(s, { type: "pause" }, a, 3000); s = applyCommand(s, { type: "play" }, a, 4000); assert.equal(s.position, 0);
});

test("YouTube Music and regular video links resolve without accepting foreign hosts", () => {
  const id = "aBcD_123-45";
  for (const link of [id, `https://music.youtube.com/watch?v=${id}&list=anything`, `https://youtu.be/${id}?t=4`, `https://www.youtube.com/shorts/${id}`]) {
    assert.equal(youtubeVideoId(link), id);
  }
  for (const link of [`https://youtube.com.evil.example/watch?v=${id}`, `https://youtube.com@evil.example/watch?v=${id}`, `javascript:${id}`, "https://music.youtube.com/watch?v=bad"]) {
    assert.equal(youtubeVideoId(link), null);
  }
});

test("YouTube ISO durations are parsed consistently", () => {
  assert.equal(youtubeDuration("PT3M36S"), 216);
  assert.equal(youtubeDuration("PT1H2M3S"), 3723);
  assert.equal(youtubeDuration("P1DT2H"), 93600);
  assert.equal(youtubeDuration("unknown"), 0);
});

const youtubeVideo = () => ({
  id: "aBcD_123-45",
  snippet: { title: "Music title & details", channelTitle: "Artist channel", channelId: "channel", categoryId: "10", liveBroadcastContent: "none",
    thumbnails: { medium: { url: "https://i.ytimg.com/vi/aBcD_123-45/mqdefault.jpg" } } },
  contentDetails: { duration: "PT3M36S" }, status: { embeddable: true, privacyStatus: "public", uploadStatus: "processed" },
});

test("music-only normalization preserves titles and official video identity", () => {
  const video = youtubeVideo(); const result = normalizeYouTubeVideo(video);
  assert.equal(result.provider, "youtube"); assert.equal(result.id, video.id);
  assert.equal(result.title, video.snippet.title); assert.equal(result.duration, 216);
  assert.equal(result.channelId, video.snippet.channelId);
});

test("non-music, live, private, non-embeddable, and restricted videos are excluded", () => {
  const variants = [
    (v) => { v.snippet.categoryId = "20"; },
    (v) => { v.snippet.liveBroadcastContent = "live"; },
    (v) => { v.status.embeddable = false; },
    (v) => { v.status.privacyStatus = "private"; },
    (v) => { v.contentDetails.duration = "P1D"; },
    (v) => { v.contentDetails.contentRating = { ytRating: "ytAgeRestricted" }; },
    (v) => { v.contentDetails.regionRestriction = { blocked: ["TR"] }; },
    (v) => { v.contentDetails.regionRestriction = { allowed: ["US"] }; },
  ];
  for (const mutate of variants) { const video = youtubeVideo(); mutate(video); assert.equal(normalizeYouTubeVideo(video, "TR"), null); }
});
