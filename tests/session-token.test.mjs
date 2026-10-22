import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const deps = createRequire(process.env.VAL_TEST_DEPENDENCIES ? join(resolve(process.env.VAL_TEST_DEPENDENCIES), 'package.json') : import.meta.url);
const ts = deps('typescript');
const jose = await import(pathToFileURL(deps.resolve('jose')).href);
const secret = 'session-tests-only-not-a-production-secret-123456789';
const code = ts.transpileModule(readFileSync(new URL('../lib/session-token.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports, require: (name) => name === 'jose' ? jose : {},
  process: { env: { SESSION_SECRET: secret } }, TextEncoder, Date });
const now = Date.now();
const seconds = Math.floor(now / 1000);

test('session JWT lasts 30 days and preserves the verified account identity', async () => {
  const token = await exports.createSessionToken({ userId: 'user-123' }, now);
  const claims = jose.decodeJwt(token);
  assert.equal(claims.exp - claims.iat, 30 * 86400);
  assert.equal((await exports.verifySessionToken(token)).userId, 'user-123');
});
test('recent sessions are not resigned on every request', async () => {
  const token = await exports.createSessionToken({ userId: 'user-123' }, now);
  assert.equal(await exports.renewSessionTokenIfNeeded(token, now + 3600000), null);
});
test('verified activity after a day rolls expiry forward without changing identity', async () => {
  const token = await exports.createSessionToken({ userId: 'user-123' }, now);
  const renewed = await exports.renewSessionTokenIfNeeded(token, now + 25 * 3600000);
  const claims = jose.decodeJwt(renewed);
  assert.equal(claims.userId, 'user-123');
  assert.equal(claims.iat, seconds + 25 * 3600);
  assert.equal(claims.exp - claims.iat, 30 * 86400);
});
test('expired and tampered sessions cannot be renewed', async () => {
  const token = await exports.createSessionToken({ userId: 'user-123' }, now);
  assert.equal(await exports.renewSessionTokenIfNeeded(token, now + 31 * 86400000), null);
  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ ...jose.decodeJwt(token), userId: 'other-user' })).toString('base64url');
  assert.equal(await exports.verifySessionToken(parts.join('.')), null);
  assert.equal(await exports.renewSessionTokenIfNeeded(parts.join('.')), null);
});
test('a still-valid old 8-hour session migrates once to the new duration', async () => {
  const token = await new jose.SignJWT({ userId: 'legacy-user' }).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(seconds).setExpirationTime(seconds + 8 * 3600).sign(new TextEncoder().encode(secret));
  const renewed = await exports.renewSessionTokenIfNeeded(token, now);
  assert.equal(jose.decodeJwt(renewed).exp - jose.decodeJwt(renewed).iat, 30 * 86400);
});
test('wrong signing algorithms are rejected even with the same key', async () => {
  const token = await new jose.SignJWT({ userId: 'user-123' }).setProtectedHeader({ alg: 'HS384' })
    .setIssuedAt(seconds).setExpirationTime(seconds + 3600).sign(new TextEncoder().encode(secret));
  assert.equal(await exports.verifySessionToken(token), null);
});

async function runProxy(pathname, token) {
  const requestCookies = new Map(token ? [['doshab_session', token]] : []);
  const responseCookies = new Map();
  const response = { cookies: { set: (name, value, options) => responseCookies.set(name, { value, options }) } };
  let forwardedHeaders;
  const proxyExports = {};
  const proxyCode = ts.transpileModule(readFileSync(new URL('../lib/supabase/proxy.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(proxyCode, { exports: proxyExports, Headers, Date, process: { env: { NODE_ENV: 'production' } },
    require: (name) => name === 'next/server' ? { NextResponse: { next: (options) => { forwardedHeaders = options.request.headers; return response; } } }
      : name === '@/lib/session-token' ? exports : {} });
  await proxyExports.updateSession({ headers: new Headers(), nextUrl: { pathname, search: '' }, cookies: {
    get: (name) => requestCookies.has(name) ? { value: requestCookies.get(name) } : undefined,
    set: (name, value) => requestCookies.set(name, value),
    toString: () => [...requestCookies].map(([name, value]) => `${name}=${value}`).join('; ')
  } });
  return { requestCookies, responseCookies, forwardedHeaders };
}

test('proxy renews verified activity with persistent secure HttpOnly cookies', async () => {
  const old = await exports.createSessionToken({ userId: 'user-123' }, now - 25 * 3600000);
  const { requestCookies, responseCookies, forwardedHeaders } = await runProxy('/dashboard', old);
  const cookie = responseCookies.get('doshab_session');
  assert.ok(cookie);
  assert.equal(cookie.value, requestCookies.get('doshab_session'));
  assert.equal(forwardedHeaders.get('cookie'), `doshab_session=${cookie.value}`);
  assert.equal(cookie.options.maxAge, 30 * 86400);
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
});
test('proxy never renews logout or other auth endpoints', async () => {
  const old = await exports.createSessionToken({ userId: 'user-123' }, now - 25 * 3600000);
  for (const pathname of ['/api/auth/logout', '/api/auth/login']) {
    assert.equal((await runProxy(pathname, old)).responseCookies.size, 0);
  }
});
test('proxy cannot turn an expired cookie into a new login', async () => {
  const old = await exports.createSessionToken({ userId: 'user-123' }, now - 31 * 86400000);
  assert.equal((await runProxy('/dashboard', old)).responseCookies.size, 0);
});
