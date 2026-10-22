const fs = require('node:fs/promises');
const { dirname } = require('node:path');

const IDLE_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

function isAuthCookie(name) {
  return name === 'doshab_session' || /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
}

function createPersistentLogin({ session, origin, statePath, now = Date.now, files = fs }) {
  let lastUsedAt = now();
  let lastSavedAt = 0;
  let pending = Promise.resolve();
  let clearing;

  const save = () => {
    const value = JSON.stringify({ version: 1, lastUsedAt });
    pending = pending.catch(() => {}).then(async () => {
      await files.mkdir(dirname(statePath), { recursive: true });
      await files.writeFile(`${statePath}.tmp`, value, { mode: 0o600 });
      await files.rename(`${statePath}.tmp`, statePath);
    });
    lastSavedAt = now();
    return pending;
  };

  const clearAuth = async () => {
    const cookies = await session.cookies.get({ url: origin });
    for (const cookie of cookies.filter(({ name }) => isAuthCookie(name))) {
      await session.cookies.remove(new URL(cookie.path || '/', origin).href, cookie.name);
    }
    await session.cookies.flushStore();
  };

  return {
    async restore() {
      let expired = false;
      try {
        const saved = JSON.parse(await files.readFile(statePath, 'utf8'));
        expired = !Number.isFinite(saved.lastUsedAt) || saved.lastUsedAt <= 0 || now() - saved.lastUsedAt >= IDLE_LIMIT_MS;
      } catch (error) {
        // A first upgrade adopts the existing browser profile; malformed state
        // cannot silently extend a previously tracked inactive session.
        expired = error.code !== 'ENOENT';
      }
      if (expired) await clearAuth();
      lastUsedAt = now();
      await save();
      return { expired };
    },
    async touch() {
      const expired = now() - lastUsedAt >= IDLE_LIMIT_MS;
      if (expired) {
        clearing ??= clearAuth();
        try { await clearing; } finally { clearing = null; }
      }
      lastUsedAt = now();
      if (expired || now() - lastSavedAt >= 60_000) await save();
      return { expired };
    },
    async flush() {
      const results = await Promise.allSettled([save(), session.cookies.flushStore()]);
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) throw failed.reason;
    }
  };
}

module.exports = { createPersistentLogin, isAuthCookie, IDLE_LIMIT_MS };
