import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(path) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}
const navigation = loadModule("../lib/mobile-navigation.ts");
const { createDraftStore } = loadModule("../lib/message-drafts.ts");
const { coalesceMusicRefresh } = loadModule("../lib/music/refresh.ts");
const homeOrder = loadModule("../lib/mobile-home-order.ts");
const navbar = loadModule("../lib/mobile-navbar.ts");

test("navbar preferences keep defaults, accept an empty bar and reject unknown destinations", () => {
  assert.deepEqual(Array.from(navbar.normalizeMobileNavbar(null).buttons), ["home", "groups", "messages", "profile"]);
  assert.deepEqual(Array.from(navbar.normalizeMobileNavbar({ buttons: [] }).buttons), []);
  assert.deepEqual(Array.from(navbar.normalizeMobileNavbar({ buttons: ["search", "search", "/external", "profile"] }).buttons), ["search", "profile"]);
  assert.equal(navbar.normalizeMobileNavbar({ position: "diagonal" }).position, "bottom");
});

test("floating navbar is only valid at the bottom", () => {
  assert.equal(navbar.normalizeMobileNavbar({ position: "bottom", floating: true }).floating, true);
  for (const position of ["top", "left", "right"]) assert.equal(navbar.normalizeMobileNavbar({ position, floating: true }).floating, false);
  assert.equal(navbar.normalizeMobileNavbar({ floating: "true" }).floating, false);
});

test("custom navbar highlights added routes and does not select hidden buttons", () => {
  assert.equal(navbar.selectedMobileNavbarButton("/dashboard/search", "home", ["home", "search"]), "search");
  assert.equal(navbar.selectedMobileNavbarButton("/dashboard/groups/a/channels/b", "messages", ["groups", "messages"]), "messages");
  assert.equal(navbar.selectedMobileNavbarButton("/dashboard/friends", "home", ["friends"]), "friends");
  assert.equal(navbar.selectedMobileNavbarButton("/dashboard/profile", "profile", ["home"]), undefined);
  assert.equal(navbar.selectedMobileNavbarButton("/dashboard", "home", []), undefined);
});

test("navbar preference keys isolate accounts", () => {
  assert.notEqual(navbar.mobileNavbarKey("account-one"), navbar.mobileNavbarKey("account-two"));
});

test("saved Home layout rejects unknown or duplicate blocks and keeps missing sections", () => {
  assert.deepEqual(Array.from(homeOrder.normalizeMobileHomeOrder(["spaces", "spaces", "removed-section", "friends"])), ["spaces", "friends", "conversations", "requests"]);
  for (const invalid of [null, {}, "spaces"]) assert.deepEqual(Array.from(homeOrder.normalizeMobileHomeOrder(invalid)), ["conversations", "spaces", "friends", "requests"]);
});

test("moving Home blocks respects both ends without mutating the saved order", () => {
  const original = ["conversations", "spaces", "friends", "requests"];
  assert.deepEqual(Array.from(homeOrder.moveMobileHomeSection(original, "requests", -10)), ["requests", "conversations", "spaces", "friends"]);
  assert.deepEqual(Array.from(homeOrder.moveMobileHomeSection(original, "conversations", 20)), ["spaces", "friends", "requests", "conversations"]);
  assert.deepEqual(original, ["conversations", "spaces", "friends", "requests"]);
});

test("Home layout preference keys isolate accounts", () => {
  assert.notEqual(homeOrder.mobileHomeOrderKey("account-one"), homeOrder.mobileHomeOrderKey("account-two"));
});

test("contextual screens preserve the four navigation destinations", () => {
  for (const [path, destination] of [
    ["/dashboard", "home"], ["/dashboard/messages", "messages"], ["/dashboard/calls/direct-call", "messages"], ["/dashboard/notifications", "home"],
    ["/dashboard/friends", "home"], ["/dashboard/channels", "groups"],
    ["/dashboard/groups/space/channels/text", "groups"], ["/dashboard/create", "groups"],
    ["/dashboard/search", "home"], ["/dashboard/profile", "profile"],
  ]) assert.equal(navigation.mobileDestination(path), destination);
});

test("a remembered channel must belong to the current space", () => {
  const space = { id: "space", channels: [{ id: "text", type: "TEXT" }, { id: "voice", type: "VOICE" }] };
  assert.equal(navigation.rememberedChannelHref(space, "voice"), "/dashboard/groups/space/channels/voice");
  assert.equal(navigation.rememberedChannelHref(space, "another-space-channel"), "/dashboard/groups/space/channels/text");
  assert.equal(navigation.rememberedChannelHref({ id: "empty", channels: [] }, "removed"), "/dashboard/groups/empty");
});

test("search handles Unicode normalization and absent optional fields", () => {
  assert.equal(navigation.matchesSearch(" ÇAĞ ", null, "Çağrı"), true);
  assert.equal(navigation.matchesSearch("space", "ＳＰＡＣＥ"), true);
  assert.equal(navigation.matchesSearch("ö", "Görüşme"), true);
  assert.equal(navigation.matchesSearch("missing", undefined, "Other"), false);
});

test("reply swipes leave OS edges, vertical scroll and opposite-direction drags alone", () => {
  for (const width of [360, 375, 390, 412, 430]) {
    assert.equal(navigation.isReplySwipe(width / 2, width, -80, 5), true);
    for (const x of [0, 24, width - 24, width]) assert.equal(navigation.isReplySwipe(x, width, -80, 5), false);
    assert.equal(navigation.isReplySwipe(width / 2, width, -80, 25), false);
    assert.equal(navigation.isReplySwipe(width / 2, width, 80, 5), false);
    assert.equal(navigation.isReplySwipe(width / 2, width, -40, 5), false);
  }
});

test("drafts are isolated by account, channel and signed-in layout lifetime", () => {
  const store = createDraftStore();
  store.set("account-a:channel-a", "Private unsent text");
  assert.equal(store.get("account-a:channel-a"), "Private unsent text");
  assert.equal(store.get("account-b:channel-a"), "");
  assert.equal(store.get("account-a:channel-b"), "");
  assert.equal(createDraftStore().get("account-a:channel-a"), "");
});

test("functional draft updates use the latest value, clear after send, and avoid redundant notifications", () => {
  const store = createDraftStore();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  store.set("chat", "Hello");
  store.set("chat", (previous) => `${previous} 👋`);
  store.set("chat", "Hello 👋");
  assert.equal(store.get("chat"), "Hello 👋");
  assert.equal(updates, 2);
  store.set("chat", "");
  assert.equal(store.get("chat"), "");
  unsubscribe();
  store.set("chat", "New draft");
  assert.equal(updates, 3);
});

test("bounded drafts retain the most recently edited conversations", () => {
  const store = createDraftStore(2);
  store.set("old", "First"); store.set("other", "Second");
  store.set("old", "Recently edited"); store.set("new", "Third");
  assert.equal(store.get("other"), "");
  assert.equal(store.get("old"), "Recently edited");
  assert.equal(store.get("new"), "Third");
});

test("persistent music refreshes coalesce concurrent triggers into one follow-up request", async () => {
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  let requests = 0;
  const refresh = coalesceMusicRefresh(async () => {
    requests++;
    if (requests === 1) await waiting;
  });
  const first = refresh.run();
  await refresh.run();
  await refresh.run();
  assert.equal(requests, 1);
  release();
  await first;
  assert.equal(requests, 2);
});

test("leaving a music session prevents a queued or later refresh from restarting it", async () => {
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  let requests = 0;
  const refresh = coalesceMusicRefresh(async () => { requests++; await waiting; });
  const first = refresh.run();
  await refresh.run();
  refresh.dispose();
  release();
  await first;
  await refresh.run();
  assert.equal(requests, 1);
});

function offlineWorker(fetchImpl = async () => new Response("Online")) {
  const handlers = new Map();
  const additions = [];
  const deletions = [];
  const self = { location: { origin: "https://val.example" }, clients: { claim: async () => {} }, addEventListener: (name, handler) => handlers.set(name, handler) };
  const cache = { addAll: async (assets) => additions.push(...assets) };
  const caches = {
    open: async () => cache,
    keys: async () => ["val-offline-old", "unrelated-cache", "val-offline-v1"],
    delete: async (key) => { deletions.push(key); return true; },
    match: async (input) => (typeof input === "string" ? input : new URL(input.url).pathname) === "/offline.html" ? new Response("Public offline screen") : undefined,
  };
  vm.runInNewContext(readFileSync(new URL("../public/push-sw.js", import.meta.url), "utf8"), { self, caches, fetch: fetchImpl, Response, URL });
  return { handlers, additions, deletions };
}
async function dispatchFetch(worker, path, options = {}) {
  let response;
  worker.handlers.get("fetch")({ request: { url: `https://val.example${path}`, method: "GET", mode: "navigate", ...options }, respondWith: (value) => { response = value; } });
  return response ? await response : undefined;
}

test("offline installation caches only public fallback assets present in the repository", async () => {
  const worker = offlineWorker();
  let install;
  worker.handlers.get("install")({ waitUntil: (promise) => { install = promise; } });
  await install;
  assert.ok(worker.additions.includes("/offline.html"));
  for (const path of worker.additions) {
    assert.ok(path === "/offline.html" || path.startsWith("/brand/"));
    assert.ok(readFileSync(new URL(`../public${path}`, import.meta.url)).length > 0);
  }
});

test("online navigation never caches private page responses", async () => {
  const worker = offlineWorker();
  assert.equal(await (await dispatchFetch(worker, "/dashboard/groups/private/channels/private")).text(), "Online");
  assert.deepEqual(worker.additions, []);
});

test("offline navigation returns a public screen and ignores private API, mutations and external requests", async () => {
  const worker = offlineWorker(async () => { throw new TypeError("Network unavailable"); });
  assert.equal(await (await dispatchFetch(worker, "/dashboard/messages")).text(), "Public offline screen");
  assert.equal(await dispatchFetch(worker, "/api/messages/private", { mode: "cors" }), undefined);
  assert.equal(await dispatchFetch(worker, "/api/groups", { method: "POST" }), undefined);
  assert.equal(await dispatchFetch(worker, "/dashboard", { url: "https://other.example/dashboard" }), undefined);
});

test("service-worker activation removes only older VAL offline caches", async () => {
  const worker = offlineWorker();
  let activation;
  worker.handlers.get("activate")({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(worker.deletions, ["val-offline-old"]);
});
