const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');
let installed;
try { installed = require('electron-updater/package.json').version; }
catch { console.error('Desktop updater is not installed. Run npm install in the desktop folder, then build again.'); process.exit(1); }
if (installed !== pkg.dependencies['electron-updater']) {
  console.error('Desktop updater dependencies are out of date. Run npm install before building.');
  process.exit(1);
}
for (const file of ['updates.cjs', 'persistent-login.cjs']) {
  if (!fs.existsSync(path.join(__dirname, '..', file))) throw new Error(`Missing ${file}`);
}
console.log(`VAL ${pkg.version}: desktop updater dependency verified (${installed}).`);
