const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPersistentLogin, IDLE_LIMIT_MS } = require('../persistent-login.cjs');

function setup(saved) {
  let clock = 1_800_000_000_000;
  const disk = new Map();
  if (saved !== undefined) disk.set('/profile/desktop-session.json', saved);
  const removed = [];
  let writes = 0;
  let flushes = 0;
  const files = {
    async readFile(file) { if (!disk.has(file)) throw Object.assign(new Error('Missing'), { code: 'ENOENT' }); return disk.get(file); },
    async mkdir() {}, async writeFile(file, value) { writes++; disk.set(file, value); },
    async rename(from, to) { disk.set(to, disk.get(from)); disk.delete(from); }
  };
  const session = { cookies: {
    get: async () => ['doshab_session', 'sb-project-auth-token.0', 'sb-project-auth-token.1', 'theme'].map((name) => ({ name, path: '/' })),
    remove: async (url, name) => removed.push({ url, name }), flushStore: async () => { flushes++; }
  } };
  const store = createPersistentLogin({ session, origin: 'https://doshab.vercel.app', statePath: '/profile/desktop-session.json', now: () => clock, files });
  return { store, disk, removed, setClock: (value) => { clock = value; }, stats: () => ({ writes, flushes }) };
}

test('first desktop upgrade adopts the existing signed-in profile without storing credentials', async () => {
  const { store, disk, removed } = setup();
  assert.equal((await store.restore()).expired, false);
  assert.equal(removed.length, 0);
  assert.deepEqual(Object.keys(JSON.parse(disk.get('/profile/desktop-session.json'))).sort(), ['lastUsedAt', 'version']);
});
test('closing and reopening within 30 days retains authentication', async () => {
  const current = 1_800_000_000_000;
  const { store, removed } = setup(JSON.stringify({ version: 1, lastUsedAt: current - IDLE_LIMIT_MS + 1000 }));
  assert.equal((await store.restore()).expired, false);
  assert.equal(removed.length, 0);
});
test('30 days of inactivity clears only VAL authentication cookies', async () => {
  const { store, removed } = setup(JSON.stringify({ version: 1, lastUsedAt: 1_800_000_000_000 - IDLE_LIMIT_MS }));
  assert.equal((await store.restore()).expired, true);
  assert.deepEqual(removed.map(({ name }) => name), ['doshab_session', 'sb-project-auth-token.0', 'sb-project-auth-token.1']);
  assert.ok(removed.every(({ url }) => url === 'https://doshab.vercel.app/'));
});
test('malformed activity metadata does not preserve an unchecked old session', async () => {
  const { store, removed } = setup('{broken');
  assert.equal((await store.restore()).expired, true);
  assert.equal(removed.length, 3);
});
test('activity updates coalesce disk writes and quit flushes the cookie store', async () => {
  const { store, setClock, stats } = setup();
  await store.restore();
  for (let i = 0; i < 100; i++) await store.touch();
  assert.equal(stats().writes, 1);
  setClock(1_800_000_061_000);
  await store.touch();
  assert.equal(stats().writes, 2);
  await store.flush();
  assert.equal(stats().flushes, 1);
});

test('returning to an app left in the tray for 30 days also expires local login', async () => {
  const { store, removed, setClock } = setup();
  await store.restore();
  setClock(1_800_000_000_000 + IDLE_LIMIT_MS);
  assert.equal((await store.touch()).expired, true);
  assert.equal(removed.length, 3);
});
