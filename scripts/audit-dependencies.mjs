import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const developmentAdvisory = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const exceptionExpiry = new Date('2026-10-18T00:00:00Z');
const developmentChain = new Set(['braces', 'micromatch', 'fast-glob', '@next/eslint-plugin-next', 'eslint-config-next']);
const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

// See docs/dependency-audit-exceptions.md. This exception never applies to runtime packages.
export function evaluateAudit(report, lockfile, now = new Date()) {
  if (report?.error || !report?.vulnerabilities || !report?.metadata?.vulnerabilities) {
    throw new Error('Dependency audit did not return a complete report.');
  }
  const vulnerabilities = report.vulnerabilities;
  if (!Number.isInteger(report.metadata.vulnerabilities.total)
      || report.metadata.vulnerabilities.total !== Object.keys(vulnerabilities).length) {
    throw new Error('Dependency audit counts do not match the returned findings.');
  }
  function isAcceptedDevelopmentChain(name, seen = new Set()) {
    const item = vulnerabilities[name];
    if (!item || seen.has(name) || !developmentChain.has(name) || now >= exceptionExpiry) return false;
    if (item.severity !== 'high' || !item.nodes?.length || !item.via?.length) return false;
    if (!item.nodes.every((node) => lockfile.packages?.[node]?.dev === true)) return false;
    const nextSeen = new Set(seen).add(name);
    return item.via.every((via) => typeof via === 'string'
      ? isAcceptedDevelopmentChain(via, nextSeen)
      : name === 'braces' && via.url === developmentAdvisory && via.severity === 'high'
        && item.nodes.every((node) => lockfile.packages[node].version === '3.0.3'));
  }
  const blocked = [];
  const excepted = [];
  for (const [name, item] of Object.entries(vulnerabilities)) {
    if (!(item.severity in severityRank)) throw new Error(`Unknown audit severity for ${name}.`);
    if (severityRank[item.severity] < severityRank.moderate) continue;
    (isAcceptedDevelopmentChain(name) ? excepted : blocked).push(name);
  }
  return { blocked, excepted };
}

function runAudit(args) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run this check with npm run audit:dependencies.');
  const result = spawnSync(process.execPath, [npmCli, 'audit', '--json', '--audit-level=moderate', ...args], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 120_000,
  });
  if (result.error || ![0, 1].includes(result.status)) throw new Error('npm audit failed to complete; no exception was applied.');
  return JSON.parse(result.stdout);
}

export function main() {
  try {
    const lockfile = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    const production = runAudit(['--omit=dev']);
    // An empty lockfile denies the development exception for every production finding.
    const runtimeResult = evaluateAudit(production, { packages: {} });
    if (runtimeResult.blocked.length) {
      console.error('Production dependency findings:', runtimeResult.blocked.join(', '));
      return 1;
    }
    const full = runAudit([]);
    const result = evaluateAudit(full, lockfile);
    console.log('Full dependency audit:', JSON.stringify(full.metadata.vulnerabilities));
    if (result.excepted.length) {
      console.warn(`Temporary development-only exception through 2026-10-17: ${developmentAdvisory}`);
      console.warn('Affected linter dependency chain:', result.excepted.join(', '));
    }
    if (result.blocked.length) {
      console.error('Unaccepted dependency findings:', result.blocked.join(', '));
      return 1;
    }
    console.log('Production dependency audit passed; no unaccepted moderate-or-higher findings.');
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Dependency audit failed.');
    return 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) process.exitCode = main();
