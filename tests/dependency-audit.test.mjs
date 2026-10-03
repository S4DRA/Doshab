import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAudit } from '../scripts/audit-dependencies.mjs';

const now = new Date('2026-10-03T12:00:00Z');
const advisory = { url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', severity: 'high' };
function fixture() {
  const vulnerabilities = {};
  const packages = {};
  for (const [name, via] of [
    ['braces', [advisory]], ['micromatch', ['braces']], ['fast-glob', ['micromatch']],
    ['@next/eslint-plugin-next', ['fast-glob']], ['eslint-config-next', ['@next/eslint-plugin-next']],
  ]) {
    const node = `node_modules/${name}`;
    vulnerabilities[name] = { severity: 'high', nodes: [node], via };
    packages[node] = { version: name === 'braces' ? '3.0.3' : '1.0.0', dev: true };
  }
  return { report: { vulnerabilities, metadata: { vulnerabilities: { high: 5, total: 5 } } }, lockfile: { packages } };
}

test('the known development-only chain remains visible as an exception', () => {
  const { report, lockfile } = fixture();
  const result = evaluateAudit(report, lockfile, now);
  assert.equal(result.excepted.length, 5);
  assert.deepEqual(result.blocked, []);
});

test('a runtime copy of braces blocks the entire chain', () => {
  const { report, lockfile } = fixture();
  lockfile.packages['node_modules/braces'].dev = false;
  assert.equal(evaluateAudit(report, lockfile, now).blocked.length, 5);
});

test('a new advisory on the same package blocks its dependency chain', () => {
  const { report, lockfile } = fixture();
  report.vulnerabilities.braces.via.push({ url: 'https://github.com/advisories/new-issue', severity: 'high' });
  assert.equal(evaluateAudit(report, lockfile, now).blocked.length, 5);
});

test('other vulnerable dependencies are never excepted', () => {
  const { report, lockfile } = fixture();
  report.vulnerabilities.next = { severity: 'critical', nodes: ['node_modules/next'], via: [{ url: 'other', severity: 'critical' }] };
  report.metadata.vulnerabilities.total = 6;
  assert.deepEqual(evaluateAudit(report, lockfile, now).blocked, ['next']);
});

test('expired exceptions and unrecognized package versions block', () => {
  const { report, lockfile } = fixture();
  assert.equal(evaluateAudit(report, lockfile, new Date('2026-10-18')).blocked.length, 5);
  lockfile.packages['node_modules/braces'].version = '3.0.4';
  assert.equal(evaluateAudit(report, lockfile, now).blocked.length, 5);
});

test('missing package classification, cycles, and audit errors fail closed', () => {
  const { report, lockfile } = fixture();
  assert.equal(evaluateAudit(report, { packages: {} }, now).blocked.length, 5);
  report.vulnerabilities.braces.via = ['fast-glob'];
  assert.equal(evaluateAudit(report, lockfile, now).blocked.length, 5);
  assert.throws(() => evaluateAudit({ error: { code: 'ENETWORK' } }, lockfile, now));
  assert.throws(() => evaluateAudit({}, lockfile, now));
  assert.throws(() => evaluateAudit({ vulnerabilities: {}, metadata: { vulnerabilities: { total: 1 } } }, lockfile, now));
});
