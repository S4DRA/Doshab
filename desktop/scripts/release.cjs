const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { version } = require('../package.json');
const root = path.join(__dirname, '..');
const artifacts = [`VAL-Setup-${version}.exe`, `VAL-Setup-${version}.exe.blockmap`, 'latest.yml'].map((name) => path.join(root, 'dist', name));
for (const file of artifacts) {
  if (!fs.existsSync(file)) throw new Error(`Build the installer first. Missing: ${path.basename(file)}`);
}
if (!fs.readFileSync(artifacts[2], 'utf8').includes(`version: ${version}`)) throw new Error('Update metadata version does not match the installer.');
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
if (revision.status !== 0) throw new Error('Run this helper from the VAL repository checkout.');
const result = spawnSync('gh', ['release', 'create', `v${version}`, '--repo', 'S4DRA/Doshab', '--target', revision.stdout.trim(), '--draft',
  '--title', `VAL for Windows ${version}`, '--notes-file', path.join(root, 'RELEASE-NOTES.md'), ...artifacts], { stdio: 'inherit' });
if (result.error) { console.error('GitHub CLI is required. Sign in with gh auth login, then retry.'); process.exit(1); }
process.exit(result.status ?? 1);
