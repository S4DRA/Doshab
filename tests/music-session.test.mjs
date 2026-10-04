import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const modules = new Map();
function loadModule(name) {
  if (modules.has(name)) return modules.get(name);
  const code = ts.transpileModule(readFileSync(new URL(`../lib/music/${name}.ts`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  modules.set(name, exports);
  vm.runInNewContext(code, { exports, require: (dependency) => loadModule(dependency.replace(/^\.\//, "")) });
  return exports;
}
const { emptySession, expectedPosition } = loadModule("types");
const { applyCommand, startTrack } = loadModule("state");
const starter = { id: "starter", name: "Starter", joinedAt: 1 };
const member = { id: "member", name: "Member", joinedAt: 2 };
const song = (id) => ({ id, queueId: `queue-${id}`, title: id, duration: 120, addedBy: starter });
const playing = () => startTrack({ ...emptySession("room"), djUserId: starter.id, djName: starter.name }, song("one"), 1000);

test("an authorized member can pause, seek and resume another member's song", () => {
  const initial = playing();
  const paused = applyCommand(initial, { type: "pause" }, member, 11000);
  assert.equal(paused.state, "PAUSED");
  assert.equal(paused.position, 10);
  const seeked = applyCommand(paused, { type: "seek", position: 30 }, member, 12000);
  const resumed = applyCommand(seeked, { type: "play" }, member, 13000);
  assert.equal(expectedPosition(resumed, 15000), 32);
  assert.equal(resumed.djUserId, starter.id);
  assert.equal(initial.state, "PLAYING");
});

test("another authorized member can change the song even after the starter leaves", () => {
  const changed = applyCommand(playing(), { type: "playNow" }, member, 11000, song("two"));
  assert.equal(changed.track.id, "two");
  assert.equal(changed.position, 0);
  assert.equal(changed.startedAt, 11000);
});

test("queue controls are shared, preserve order and do not mutate previous state", () => {
  const initial = { ...playing(), queue: [song("two"), song("three")] };
  const reordered = applyCommand(initial, { type: "reorder", queueIds: ["queue-three", "queue-two"] }, member, 11000);
  assert.deepEqual(Array.from(reordered.queue, (track) => track.id), ["three", "two"]);
  const removed = applyCommand(reordered, { type: "remove", queueId: "queue-three" }, member, 12000);
  assert.deepEqual(Array.from(removed.queue, (track) => track.id), ["two"]);
  assert.deepEqual(initial.queue.map((track) => track.id), ["two", "three"]);
});

test("shared controls still reject overflowing queues and stale reorder commands", () => {
  const full = { ...playing(), queue: Array.from({ length: 30 }, (_, index) => song(String(index))) };
  assert.throws(() => applyCommand(full, { type: "enqueue" }, member, 11000, song("overflow")), /queue is full/);
  assert.throws(() => applyCommand(full, { type: "reorder", queueIds: ["missing"] }, member, 11000), /queue changed/);
});

test("a listener cannot advance a song with a premature ended command", () => {
  assert.throws(() => applyCommand(playing(), { type: "ended" }, member, 11000), /has not ended/);
  assert.equal(applyCommand(playing(), { type: "ended" }, member, 121000).track.id, "one");
});

function serverFixture(initial = { ...playing(), startedAt: Date.now() }) {
  let record = initial ? { state: initial, version: 1 } : null;
  let viewer = member;
  const prisma = {
    channel: { findFirst: async ({ where }) => [starter.id, member.id].includes(where.group.members.some.userId) ? { id: "room", groupId: "space" } : null },
    musicSession: {
      findUnique: async () => structuredClone(record),
      create: async ({ data }) => {
        if (record) throw Object.assign(new Error("Duplicate room"), { code: "P2002" });
        record = structuredClone(data);
      },
      updateMany: async ({ where, data }) => {
        if (!record || where.version !== record.version) return { count: 0 };
        record = { state: structuredClone(data.state), version: record.version + data.version.increment };
        return { count: 1 };
      },
    },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL("../lib/music/server.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, crypto: { randomUUID }, require: (name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/auth") return { getCurrentUser: async () => viewer };
    if (name === "@/lib/prisma") return { prisma };
    if (name === "./providers") return { getMusicProvider: () => ({ getTrack: async (id) => song(id), createPlaybackSource: () => "provider-source" }) };
    return loadModule(name.replace(/^\.\//, ""));
  } });
  return { ...exports, snapshot: () => structuredClone(record), setViewer: (user) => { viewer = user; } };
}
const context = (user) => ({ channelId: "room", groupId: "space", user });
const request = (command, version = 1) => ({ command, commandId: randomUUID(), version, roomId: "room" });

test("concurrent queue additions cannot overwrite another member's song", async () => {
  const server = serverFixture();
  const first = request({ type: "enqueue", trackId: "two", provider: "youtube" });
  const second = request({ type: "enqueue", trackId: "three", provider: "youtube" });
  const results = await Promise.allSettled([server.roomMusic(context(starter), first), server.roomMusic(context(member), second)]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
  const retry = results[0].status === "rejected" ? first : second;
  await server.roomMusic(context(member), retry);
  assert.deepEqual(Array.from(server.snapshot().state.queue, track => track.id).sort(), ["three", "two"]);
  assert.equal(server.snapshot().version, 3);
});

test("retrying an acknowledged command is idempotent after its version becomes stale", async () => {
  const server = serverFixture();
  const input = request({ type: "enqueue", trackId: "two", provider: "youtube" });
  await server.roomMusic(context(member), input);
  const result = await server.roomMusic(context(member), input);
  assert.equal(result.session.queue.length, 1);
  assert.equal(result.session.version, 2);
  await assert.rejects(server.roomMusic(context(member), { ...input, roomId: "other-room" }), error => error.status === 409);
});

test("concurrent first songs resolve to one room session and a recoverable conflict", async () => {
  const server = serverFixture(null);
  const results = await Promise.allSettled([
    server.roomMusic(context(starter), request({ type: "playNow", trackId: "one", provider: "youtube" }, 0)),
    server.roomMusic(context(member), request({ type: "playNow", trackId: "two", provider: "youtube" }, 0)),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
  assert.equal(server.snapshot().version, 1);
});

test("music authorization still rejects signed-out users and people outside the room's space", async () => {
  const server = serverFixture();
  server.setViewer(null);
  await assert.rejects(server.authorizeMusic("room"), error => error.status === 401);
  server.setViewer({ id: "outsider", name: "Outsider" });
  await assert.rejects(server.authorizeMusic("room"), error => error.status === 403);
  server.setViewer(member);
  assert.equal((await server.authorizeMusic("room")).user.id, member.id);
});
