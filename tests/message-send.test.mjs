import assert from "node:assert/strict";
import { test } from "node:test";
import { interactionModule } from "./helpers/interaction-module.mjs";

const { createMessageSendStore, createMessagePresentation, establishMessage } = interactionModule("lib/message-send.ts");
const { createDraftStore } = interactionModule("lib/message-drafts.ts");
const user = { id: "account-a", name: "Sender", email: "sender@example.test" };
const scope = "account-a:channel-a";
const time = "2026-10-08T10:00:00.000Z";
const receipt = (id = "server-a", sender = user) => ({ id, content: "encrypted-envelope", createdAt: time, sender, reactions: [], replyTo: null });
const response = (message = receipt(), status = 201) => ({ ok: status >= 200 && status < 300, status, json: async () => message });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const begin = (store, id = "pending:a", content = "Intent A", known = []) => store.begin(scope, content, user, id, time, known);
const state = (store, index = 0) => store.get(scope).operations[index].message.sendState;
const establish = (store, operation, post, encrypt = async () => "encrypted-envelope") => establishMessage(store, scope, operation, { encrypt, post });

test("intent is immediately visible with plaintext/reply before encryption finishes", async () => {
  const store = createMessageSendStore();
  store.setReply(scope, { ...receipt("original"), content: "Reply text" });
  const operation = begin(store);
  const encryption = deferred();
  let posts = 0;
  const work = establish(store, operation, async () => { posts++; return response(); }, () => encryption.promise);
  assert.equal(state(store), "pending");
  assert.equal(operation.message.content, "Intent A");
  assert.equal(operation.message.replyTo.content, "Reply text");
  assert.equal(store.get(scope).replyTarget, null);
  assert.equal(posts, 0);
  encryption.resolve("cipher"); await work;
  assert.equal(state(store), "confirmed");
});

test("confirmation keeps visual identity, content, reply and ordering time without waiting for decrypt", async () => {
  const store = createMessageSendStore();
  store.setReply(scope, { ...receipt("original"), content: "Reply text" });
  const operation = begin(store);
  const present = createMessagePresentation();
  const before = present([], store.get(scope).operations, user.id)[0];
  await establish(store, operation, async (_, replyId) => { assert.equal(replyId, "original"); return response({ ...receipt(), createdAt: "2026-10-08T10:00:01.000Z" }); });
  const after = present([], store.get(scope).operations, user.id)[0];
  assert.equal(after.id, "server-a");
  assert.equal(after.visualId, before.visualId);
  assert.equal(after.createdAt, before.createdAt);
  assert.equal(after.content, before.content);
  assert.equal(after.replyTo, before.replyTo);
});

test("encryption/device lookup failure is known not sent and never invokes POST", async () => {
  const store = createMessageSendStore(); const operation = begin(store);
  await establish(store, operation, () => assert.fail("POST must not run"), async () => { throw Error("No key"); });
  assert.equal(state(store), "failed"); assert.equal(store.get(scope).operations[0].message.content, "Intent A");
});

test("route's explicit pre-write HTTP rejections are failed with retained intent", async () => {
  for (const status of [400, 401, 404, 429]) {
    const store = createMessageSendStore(); const operation = begin(store);
    await establish(store, operation, async () => response(null, status));
    assert.equal(state(store), "failed"); assert.equal(store.get(scope).operations.length, 1);
  }
});

test("network loss after POST invocation and server 500 are unknown, with no retry", async () => {
  for (const failure of [async () => { throw Error("Receipt lost"); }, async () => response(null, 500)]) {
    const store = createMessageSendStore(); const operation = begin(store); let posts = 0;
    await establish(store, operation, (...args) => { posts++; return failure(...args); });
    assert.equal(state(store), "unknown"); assert.equal(posts, 1);
    assert.equal(store.get(scope).operations[0].message.content, "Intent A");
  }
});

test("unreadable, malformed, accepted-only and wrong-author receipts cannot confirm", async () => {
  const invalid = [response({}, 201), response(receipt("server-a", { ...user, id: "other-account" })), response(receipt(), 202),
    response({ ...receipt(), reactions: {} }), { ...response(), json: async () => { throw Error("Lost body"); } }];
  for (const result of invalid) {
    const store = createMessageSendStore(); const operation = begin(store);
    await establish(store, operation, async () => result);
    assert.equal(state(store), "unknown");
  }
});

test("failure A cannot overwrite draft B or its newer reply target", async () => {
  const drafts = createDraftStore(); const store = createMessageSendStore();
  const operation = begin(store); const pending = deferred();
  const work = establish(store, operation, () => pending.promise);
  drafts.set(scope, "New draft B"); const replyB = receipt("reply-b"); store.setReply(scope, replyB);
  pending.resolve(response(null, 400)); await work;
  assert.equal(drafts.get(scope), "New draft B"); assert.equal(store.get(scope).replyTarget, replyB);
  assert.equal(store.get(scope).operations[0].message.content, "Intent A");
});

test("POST before SSE and delayed/reconnected duplicate echoes yield one stable row", async () => {
  const store = createMessageSendStore(); const operation = begin(store); const present = createMessagePresentation();
  await establish(store, operation, async () => response());
  const confirmed = present([], store.get(scope).operations, user.id);
  assert.equal(confirmed.length, 1);
  const echo = receipt();
  const reconnected = present([echo, echo], store.get(scope).operations, user.id);
  assert.equal(reconnected.length, 1); assert.equal(reconnected[0].visualId, confirmed[0].visualId);
  assert.equal(reconnected[0].content, "Intent A");
  const again = present([echo], store.get(scope).operations, user.id);
  assert.equal(again[0], reconnected[0]);
});

test("SSE before POST is staged without hiding known history or other people's messages", async () => {
  const store = createMessageSendStore(); const old = receipt("old"); const operation = begin(store, "pending:a", "Intent A", ["old"]);
  const other = receipt("other", { ...user, id: "account-b" }); const echo = receipt();
  const present = createMessagePresentation(); const pending = deferred();
  const work = establish(store, operation, () => pending.promise);
  const before = present([old, echo, other], store.get(scope).operations, user.id);
  assert.deepEqual(Array.from(before, (message) => message.id), ["old", "other", "pending:a"]);
  pending.resolve(response(echo)); await work;
  const after = present([old, echo, other], store.get(scope).operations, user.id);
  assert.equal(after.length, 3); assert.equal(after[2].visualId, before[2].visualId);
});

test("rapid identical text sends remain distinct intents and can acknowledge out of order", async () => {
  const store = createMessageSendStore(); const a = begin(store, "pending:a", "same text");
  const b = begin(store, "pending:b", "same text"); const first = deferred(); const second = deferred();
  const wa = establish(store, a, () => first.promise); const wb = establish(store, b, () => second.promise);
  second.resolve(response(receipt("server-b"))); await wb;
  assert.equal(state(store, 0), "pending"); assert.equal(state(store, 1), "confirmed");
  first.resolve(response(receipt("server-a"))); await wa;
  const rows = createMessagePresentation()([receipt("server-a"), receipt("server-b")], store.get(scope).operations, user.id);
  assert.equal(rows.length, 2); assert.deepEqual(Array.from(rows, (message) => message.visualId), ["pending:a", "pending:b"]);
});

test("unmount/switch/back retains pending and captures completion in the original channel/account", async () => {
  const store = createMessageSendStore(); const operation = begin(store); const pending = deferred();
  const work = establish(store, operation, () => pending.promise);
  const seen = []; const unsubscribe = store.subscribe(() => seen.push(store.get(scope)));
  unsubscribe(); // Channel panel unmounts; the dashboard store stays mounted.
  assert.equal(store.get("account-a:channel-b").operations.length, 0);
  assert.equal(store.get("account-b:channel-a").operations.length, 0);
  pending.resolve(response()); await work;
  assert.equal(state(store), "confirmed"); assert.equal(seen.length, 0);
  assert.equal(createMessageSendStore().get(scope).operations.length, 0);
});

test("duplicate/stale completion and SSE renders never announce success twice", async () => {
  const store = createMessageSendStore(); const operation = begin(store);
  await establish(store, operation, async () => response());
  const settled = store.get(scope);
  store.finish(scope, operation.localId, "failed"); store.finish(scope, operation.localId, "confirmed", receipt());
  createMessagePresentation()([receipt(), receipt()], store.get(scope).operations, user.id);
  assert.equal(store.get(scope), settled); assert.equal(settled.announcement.sequence, 2);
});

test("lost receipt cannot be guessed from content/time; server history and unconfirmed intent stay honest", async () => {
  const store = createMessageSendStore(); const operation = begin(store);
  await establish(store, operation, async () => { throw Error("Server wrote but response lost"); });
  const server = { ...receipt(), content: "Intent A" }; // Deliberately identical plaintext/time is not a correlation key.
  const rows = createMessagePresentation()([server, server], store.get(scope).operations, user.id);
  assert.equal(rows.filter((message) => message.id === server.id).length, 1);
  assert.equal(rows.find((message) => message.visualId === operation.localId).sendState, "unknown");
  // The two representations cannot safely be collapsed without protocol-level correlation.
  assert.equal(rows.length, 2);
});

test("unrelated row references survive operation transitions and same-ID metadata updates", async () => {
  const store = createMessageSendStore(); const other = receipt("other", { ...user, id: "account-b" });
  const operation = begin(store); const present = createMessagePresentation();
  const before = present([other], store.get(scope).operations, user.id);
  await establish(store, operation, async () => response());
  const after = present([other], store.get(scope).operations, user.id);
  assert.equal(after[0], before[0]);
  const changed = { ...receipt(), reactions: [{ emoji: "👍", count: 1, reacted: true }] };
  const update = present([other, changed], store.get(scope).operations, user.id);
  assert.equal(update[0], before[0]); assert.equal(update[1].reactions, changed.reactions);
  assert.equal(update[1].visualId, operation.localId);
});

test("actual composer consumes the draft once, permits new typing, and failure never restores stale input", async () => {
  const drafts = createDraftStore(); const sends = createMessageSendStore(); const jobs = [];
  const key = `${user.id}:channel-a`; drafts.set(key, "First intent");
  let slot = 0; let intentId = 0;
  const { RealtimeMessagePanel } = interactionModule("components/chat/realtime-message-panel.tsx", { globals: {
    crypto: { randomUUID: () => `test-${intentId++}` },
    fetch: async (_url, options) => { const job = deferred(); jobs.push({ ...job, body: JSON.parse(options.body) }); return job.promise; },
  }, mocks: {
    react: { useState: (initial) => { const index = slot++; return [index === 4 ? true : typeof initial === "function" ? initial() : initial, () => {}]; },
      useCallback: (fn) => fn, useMemo: (fn) => fn(), useEffect: () => {}, useRef: (value) => ({ current: value }) },
    "react-dom": { flushSync: (fn) => fn() },
    "@/components/chat/message-list": { MessageList: "test-message-list" },
    "@/components/chat/message-drafts-provider": {
      useMessageDraft: () => [drafts.get(key), (next) => drafts.set(key, next)],
      useMessageSend: () => ({ drafts, sends, snapshot: sends.get(key) }),
    },
    "@/components/ui/dialog-surface": {}, "@/lib/chat-constants": { reactionEmojis: [] },
    "@/lib/e2ee-message.client": { fetchChannelDeviceKeys: async () => ({ devices: [] }), encryptMessageContent: async () => "cipher" },
    "@/lib/message-send": { createMessagePresentation, establishMessage },
  } });
  const tree = RealtimeMessagePanel({ channelId: "channel-a", channelName: "general", currentUser: user, initialMessages: [] });
  function find(node, predicate) {
    if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
    if (!node?.props) return undefined;
    return predicate(node) ? node : find(node.props.children, predicate);
  }
  const submit = find(tree, (node) => node.type === "form" && node.props.onSubmit).props.onSubmit;
  const event = { preventDefault() {} };
  const first = submit(event); const repeated = submit(event);
  assert.equal(drafts.get(key), ""); assert.equal(sends.get(key).operations.length, 1);
  drafts.set(key, "Second intent"); const second = submit(event);
  drafts.set(key, "Still typing");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].body.notificationPreview, "First intent"); assert.equal(jobs[1].body.notificationPreview, "Second intent");
  jobs[1].resolve(response(receipt("server-b"))); jobs[0].resolve(response(null, 400));
  await Promise.all([first, repeated, second]);
  assert.equal(drafts.get(key), "Still typing");
  assert.equal(sends.get(key).operations[0].message.sendState, "failed");
  assert.equal(sends.get(key).operations[1].message.sendState, "confirmed");
});

test("real message rows retain their React key and expose state without server actions before confirmation", () => {
  const { MessageList } = interactionModule("components/chat/message-list.tsx", { mocks: {
    react: { memo: (component) => component, useState: (value) => [value, () => {}], useEffect: () => {}, useRef: (value) => ({ current: value }) },
    "@/components/ui/avatar-initials": { AvatarInitials: "test-avatar" },
    "@/lib/chat-constants": { reactionEmojis: [] }, "@/lib/chat-presentation": { messageSegments: (text) => [{ text }] },
    "@/lib/utils": { formatReadableTimestamp: () => "10:00" }, "@/components/ui/dialog-surface": {},
    "@/components/mobile/mobile-shell": { useMobileLayout: () => true }, "@/lib/mobile-navigation": {},
  } });
  function nodes(node, result = []) {
    if (Array.isArray(node)) node.forEach((child) => nodes(child, result));
    else if (node?.props) { result.push(node); nodes(node.props.children, result); }
    return result;
  }
  const keys = [];
  for (const phase of ["pending", "failed", "unknown", "confirmed"]) {
    const message = { ...receipt(phase === "confirmed" ? "server-a" : "pending:a"), content: "Intent A", visualId: "pending:a", sendState: phase };
    const rowElement = nodes(MessageList({ messages: [message], currentUserId: user.id })).find((node) => node.props.message === message);
    keys.push(rowElement.key);
    const row = nodes(rowElement.type(rowElement.props));
    const article = row.find((node) => node.type === "article");
    assert.equal(article.props["data-send-state"], phase);
    const action = row.find((node) => node.props["aria-label"]?.startsWith("More actions"));
    assert.equal(Boolean(action), phase === "confirmed");
    const status = row.find((node) => node.props.className?.includes("val-message-send-status"));
    assert.ok(status); assert.equal(status.props.role, undefined); // One central live region, not one per row.
    if (phase === "unknown") assert.match(status.props.title, /may already be saved.*Do not resend/);
    if (phase !== "confirmed") article.props.onPointerDown({ pointerType: "touch" }); // No window reads/capture/timer for unestablished rows.
  }
  assert.deepEqual(keys, ["pending:a", "pending:a", "pending:a", "pending:a"]);
});

test("failed and unknown intent survive draft-LRU eviction without storing plaintext on disk", async () => {
  const drafts = createDraftStore(1); const sends = createMessageSendStore();
  const failed = begin(sends); const unknown = begin(sends, "pending:b", "Unknown B");
  await establish(sends, failed, async () => response(null, 400));
  await establish(sends, unknown, async () => { throw Error("Lost receipt"); });
  drafts.set(scope, "Older draft"); drafts.set("account-a:channel-b", "Newer draft");
  assert.equal(drafts.get(scope), "");
  assert.equal(sends.get(scope).operations[0].message.content, "Intent A");
  assert.equal(sends.get(scope).operations[1].message.content, "Unknown B");
});

test("account owner unmount during encryption prevents a late POST under another login", async () => {
  const store = createMessageSendStore(); const operation = begin(store); const encryption = deferred();
  const work = establish(store, operation, () => assert.fail("Inactive account must not POST"), () => encryption.promise);
  store.setActive(false); encryption.resolve("cipher"); await work;
  assert.equal(state(store), "failed");
  const nextAccount = createMessageSendStore(); assert.equal(nextAccount.get(scope).operations.length, 0);
});

test("effect setup-cleanup-setup keeps the same owner usable in React development Strict Mode", async () => {
  const store = createMessageSendStore(); store.setActive(true); store.setActive(false); store.setActive(true);
  const operation = begin(store); await establish(store, operation, async () => response());
  assert.equal(state(store), "confirmed");
});
